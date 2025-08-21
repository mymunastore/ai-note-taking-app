import { api, APIError } from "encore.dev/api";
import { getCached, setCached } from "./cache";
import { openAIChat, hashString } from "./utils";

interface SummarizeRequest {
  transcript: string;
  length?: "short" | "medium" | "long";
  format?: "paragraph" | "bullets";
}

interface SummarizeResponse {
  summary: string;
}

// Generates a summary of the provided transcript using OpenAI.
export const summarize = api<SummarizeRequest, SummarizeResponse>(
  { expose: true, method: "POST", path: "/ai/summarize" },
  async (req) => {
    try {
      if (!req.transcript || req.transcript.trim().length === 0) {
        throw APIError.invalidArgument("Transcript is required and cannot be empty");
      }

      if (req.transcript.length > 100000) {
        throw APIError.invalidArgument("Transcript too long. Maximum length is 100,000 characters");
      }

      if (req.transcript.trim().length < 10) {
        throw APIError.invalidArgument("Transcript too short. Minimum length is 10 characters");
      }

      const len = req.length ?? "medium";
      const fmt = req.format ?? "bullets";
      const cacheKey = `sum:${len}:${fmt}:${hashString(req.transcript.trim())}`;
      const cached = await getCached<SummarizeResponse>(cacheKey);
      if (cached) return cached;

      const summary = await openAIChat(
        [
          {
            role: "system",
            content: `You are an expert at summarizing meeting transcripts and voice recordings. Create a concise, well-structured summary that includes:
1. Key Points: Main topics and important information discussed
2. Action Items: Tasks, decisions, and next steps identified
3. Participants: Key speakers or roles mentioned (if applicable)
4. Outcomes: Decisions made and conclusions reached

Format the summary in clear, ${fmt === "bullets" ? "bullet-point" : "paragraph"} style for easy reading. Focus on actionable insights and important details.`,
          },
          {
            role: "user",
            content: `Please summarize this transcript (${len} length):\n\n${req.transcript}`,
          },
        ],
        { model: "gpt-4o-mini", temperature: 0.3, max_tokens: 700 }
      );

      if (!summary || summary.trim().length === 0) {
        throw APIError.internal("Failed to generate summary");
      }

      const response = { summary };
      await setCached(cacheKey, response, { ttlSeconds: 60 * 60 * 24 * 7 }); // 7 days
      return response;
    } catch (error: any) {
      console.error("Summarization error:", error);

      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof TypeError && String(error.message || "").includes("fetch")) {
        throw APIError.unavailable("Unable to connect to summarization service. Please check your internet connection");
      }

      throw APIError.internal("Failed to generate summary. Please try again");
    }
  }
);
