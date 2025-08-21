import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import type { SummarizeRequest, SummarizeResponse } from "../notes/types";

const cohereApiKey = secret("CohereApiKey");

// Generates a summary of the provided transcript using Cohere.
export const summarize = api<SummarizeRequest, SummarizeResponse>(
  { expose: true, method: "POST", path: "/ai/summarize" },
  async (req) => {
    try {
      const response = await fetch("https://api.cohere.ai/v1/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cohereApiKey()}`,
        },
        body: JSON.stringify({
          text: req.transcript,
          model: "command",
          length: req.length || "medium",
          format: req.format || "bullets",
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw APIError.internal(`Cohere API error: ${error}`);
      }

      const result = await response.json();
      const summary = result.summary || "No summary available";

      return { summary };
    } catch (error) {
      console.error("Summarization error:", error);
      throw APIError.internal("Failed to generate summary");
    }
  }
);
