import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

const openAIKey = secret("OpenAIKey");

interface TranscribeRequest {
  audioBase64: string;
}

interface TranscribeResponse {
  transcript: string;
  originalLanguage?: string;
  translated?: boolean;
}

// Transcribes audio to text using OpenAI Whisper API with automatic language detection and English translation.
export const transcribe = api<TranscribeRequest, TranscribeResponse>(
  { expose: true, method: "POST", path: "/ai/transcribe" },
  async (req) => {
    try {
      // Validate input
      if (!req.audioBase64 || req.audioBase64.trim() === "") {
        throw APIError.invalidArgument("Audio data is required");
      }

      // Convert base64 to buffer
      let audioBuffer: Buffer;
      try {
        audioBuffer = Buffer.from(req.audioBase64, "base64");
      } catch (error) {
        throw APIError.invalidArgument("Invalid audio data format");
      }

      if (audioBuffer.length === 0) {
        throw APIError.invalidArgument("Audio data is empty");
      }

      // Check file size (25MB limit)
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (audioBuffer.length > maxSize) {
        throw APIError.invalidArgument("Audio file too large. Maximum size is 25MB");
      }

      // Create form data for OpenAI API
      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: "audio/webm" });
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("response_format", "verbose_json");
      
      // First, detect the language and get initial transcription
      const detectResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAIKey()}`,
        },
        body: formData,
      });

      if (!detectResponse.ok) {
        const errorText = await detectResponse.text();
        console.error("OpenAI transcription error:", errorText);
        
        if (detectResponse.status === 400) {
          throw APIError.invalidArgument("Invalid audio format or corrupted file");
        } else if (detectResponse.status === 413) {
          throw APIError.invalidArgument("Audio file too large");
        } else if (detectResponse.status === 429) {
          throw APIError.resourceExhausted("Rate limit exceeded. Please try again later");
        } else {
          throw APIError.internal(`OpenAI API error: ${detectResponse.status}`);
        }
      }

      const detectResult = await detectResponse.json();
      const detectedLanguage = detectResult.language || "en";
      let transcript = detectResult.text || "";

      // Validate transcript
      if (!transcript || transcript.trim().length === 0) {
        throw APIError.invalidArgument("No speech detected in audio. Please ensure clear speech and try again");
      }

      // If the detected language is not English, use translation
      if (detectedLanguage !== "en") {
        try {
          // Use translation endpoint to get English translation
          const translateFormData = new FormData();
          const translateBlob = new Blob([audioBuffer], { type: "audio/webm" });
          translateFormData.append("file", translateBlob, "audio.webm");
          translateFormData.append("model", "whisper-1");

          const translateResponse = await fetch("https://api.openai.com/v1/audio/translations", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openAIKey()}`,
            },
            body: translateFormData,
          });

          if (translateResponse.ok) {
            const translateResult = await translateResponse.json();
            if (translateResult.text && translateResult.text.trim()) {
              transcript = translateResult.text;
              
              return { 
                transcript: transcript,
                originalLanguage: detectedLanguage,
                translated: true
              };
            }
          }
        } catch (translationError) {
          console.warn("Translation failed, using original transcript:", translationError);
          // Fall back to original transcript if translation fails
        }
        
        return { 
          transcript: transcript,
          originalLanguage: detectedLanguage,
          translated: false
        };
      } else {
        // For English audio, use regular transcription
        return { 
          transcript: transcript,
          originalLanguage: "en",
          translated: false
        };
      }
    } catch (error) {
      console.error("Transcription error:", error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw APIError.unavailable("Unable to connect to transcription service. Please check your internet connection");
      }
      
      throw APIError.internal("Failed to transcribe audio. Please try again");
    }
  }
);
