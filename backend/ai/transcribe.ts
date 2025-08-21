import { api, APIError } from "encore.dev/api";
import { openAIKey, fetchWithRetry } from "./utils";

interface TranscribeRequest {
  audioBase64: string;
  enableDiarization?: boolean;
}

interface DiarizedSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

interface TranscribeResponse {
  transcript: string;
  originalLanguage?: string;
  translated?: boolean;
  segments?: DiarizedSegment[];
}

// Transcribes audio to text using OpenAI Whisper API with automatic language detection and English translation.
export const transcribe = api<TranscribeRequest, TranscribeResponse>(
  { expose: true, method: "POST", path: "/ai/transcribe" },
  async (req) => {
    try {
      if (!req.audioBase64 || req.audioBase64.trim() === "") {
        throw APIError.invalidArgument("Audio data is required");
      }

      let audioBuffer: Buffer;
      try {
        audioBuffer = Buffer.from(req.audioBase64, "base64");
      } catch (error) {
        throw APIError.invalidArgument("Invalid audio data format");
      }

      if (audioBuffer.length === 0) {
        throw APIError.invalidArgument("Audio data is empty");
      }

      const maxSize = 25 * 1024 * 1024; // 25MB
      if (audioBuffer.length > maxSize) {
        throw APIError.invalidArgument("Audio file too large. Maximum size is 25MB");
      }

      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: "audio/webm" });
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("response_format", "verbose_json");
      if (req.enableDiarization) {
        // @ts-ignore - Diarization is a beta feature
        formData.append("diarization_enabled", "true");
      }

      const detectResponse = await fetchWithRetry("https://api.openai.com/v1/audio/transcriptions", {
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
      let segments: DiarizedSegment[] = [];

      if (req.enableDiarization && detectResult.words) {
        let currentSegment: DiarizedSegment | null = null;
        for (const word of detectResult.words) {
          const speaker = word.speaker ?? "UNKNOWN";
          if (currentSegment && currentSegment.speaker === speaker) {
            currentSegment.text += " " + word.word;
            currentSegment.end = word.end;
          } else {
            if (currentSegment) {
              segments.push(currentSegment);
            }
            currentSegment = {
              speaker: speaker,
              start: word.start,
              end: word.end,
              text: word.word,
            };
          }
        }
        if (currentSegment) {
          segments.push(currentSegment);
        }
      }

      if (!transcript || transcript.trim().length === 0) {
        throw APIError.invalidArgument("No speech detected in audio. Please ensure clear speech and try again");
      }

      if (detectedLanguage !== "en") {
        try {
          const translateFormData = new FormData();
          const translateBlob = new Blob([audioBuffer], { type: "audio/webm" });
          translateFormData.append("file", translateBlob, "audio.webm");
          translateFormData.append("model", "whisper-1");

          const translateResponse = await fetchWithRetry("https://api.openai.com/v1/audio/translations", {
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
                translated: true,
                segments,
              };
            }
          }
        } catch (translationError) {
          console.warn("Translation failed, using original transcript:", translationError);
        }

        return {
          transcript: transcript,
          originalLanguage: detectedLanguage,
          translated: false,
          segments,
        };
      } else {
        return {
          transcript: transcript,
          originalLanguage: "en",
          translated: false,
          segments,
        };
      }
    } catch (error: any) {
      console.error("Transcription error:", error);

      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof TypeError && String(error.message || "").includes("fetch")) {
        throw APIError.unavailable("Unable to connect to transcription service. Please check your internet connection");
      }

      throw APIError.internal("Failed to transcribe audio. Please try again");
    }
  }
);
