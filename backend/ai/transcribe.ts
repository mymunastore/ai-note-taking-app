import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import type { TranscribeRequest, TranscribeResponse } from "../notes/types";

const openAIKey = secret("OpenAIKey");

// Transcribes audio to text using OpenAI Whisper API with automatic language detection and English translation.
export const transcribe = api<TranscribeRequest, TranscribeResponse>(
  { expose: true, method: "POST", path: "/ai/transcribe" },
  async (req) => {
    try {
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(req.audioBase64, "base64");

      // Create form data for OpenAI API
      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });
      formData.append("file", audioBlob, "audio.wav");
      formData.append("model", "whisper-1");
      
      // First, detect the language
      const detectFormData = new FormData();
      detectFormData.append("file", audioBlob, "audio.wav");
      detectFormData.append("model", "whisper-1");

      const detectResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAIKey()}`,
        },
        body: detectFormData,
      });

      if (!detectResponse.ok) {
        const error = await detectResponse.text();
        throw APIError.internal(`OpenAI API error: ${error}`);
      }

      const detectResult = await detectResponse.json();
      const detectedLanguage = detectResult.language || "en";

      // If the detected language is not English, use translation
      if (detectedLanguage !== "en") {
        // Use translation endpoint to get English translation
        const translateFormData = new FormData();
        translateFormData.append("file", audioBlob, "audio.wav");
        translateFormData.append("model", "whisper-1");

        const translateResponse = await fetch("https://api.openai.com/v1/audio/translations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAIKey()}`,
          },
          body: translateFormData,
        });

        if (!translateResponse.ok) {
          const error = await translateResponse.text();
          throw APIError.internal(`OpenAI translation API error: ${error}`);
        }

        const translateResult = await translateResponse.json();
        return { 
          transcript: translateResult.text || "",
          originalLanguage: detectedLanguage,
          translated: true
        };
      } else {
        // For English audio, use regular transcription
        formData.append("language", "en");

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAIKey()}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const error = await response.text();
          throw APIError.internal(`OpenAI API error: ${error}`);
        }

        const result = await response.json();
        return { 
          transcript: result.text || "",
          originalLanguage: "en",
          translated: false
        };
      }
    } catch (error) {
      console.error("Transcription error:", error);
      throw APIError.internal("Failed to transcribe audio");
    }
  }
);
