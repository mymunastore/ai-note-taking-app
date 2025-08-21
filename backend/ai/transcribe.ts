import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import type { TranscribeRequest, TranscribeResponse } from "../notes/types";

const openAIKey = secret("OpenAIKey");

// Transcribes audio to text using OpenAI Whisper API.
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
      return { transcript: result.text || "" };
    } catch (error) {
      console.error("Transcription error:", error);
      throw APIError.internal("Failed to transcribe audio");
    }
  }
);
