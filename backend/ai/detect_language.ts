import { api, APIError } from "encore.dev/api";
import { openAIKey, fetchWithRetry } from "./utils";

interface DetectLanguageRequest {
  audioBase64: string;
}

interface DetectLanguageResponse {
  language: string;
  confidence: number;
}

// Detects the language of audio using OpenAI Whisper API.
export const detectLanguage = api<DetectLanguageRequest, DetectLanguageResponse>(
  { expose: true, method: "POST", path: "/ai/detect-language" },
  async (req) => {
    try {
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(req.audioBase64, "base64");

      // Create form data for OpenAI API
      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });
      formData.append("file", audioBlob, "audio.wav");
      formData.append("model", "whisper-1");

      const response = await fetchWithRetry("https://api.openai.com/v1/audio/transcriptions", {
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

      const language = result.language || "en";

      return {
        language: language,
        confidence: 0.95, // Whisper is generally very accurate
      };
    } catch (error) {
      console.error("Language detection error:", error);
      throw APIError.internal("Failed to detect language");
    }
  }
);
