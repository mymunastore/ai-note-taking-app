import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import type { SummarizeRequest, SummarizeResponse } from "../notes/types";

const openAIKey = secret("OpenAIKey");

// Generates a summary of the provided transcript using OpenAI GPT.
export const summarize = api<SummarizeRequest, SummarizeResponse>(
  { expose: true, method: "POST", path: "/ai/summarize" },
  async (req) => {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey()}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an expert at summarizing meeting transcripts and phone calls. 
              Create a concise, well-structured summary that captures:
              - Key topics discussed
              - Important decisions made
              - Action items or next steps
              - Key participants and their contributions
              
              Format the summary with clear sections and bullet points where appropriate.
              Keep it professional and focused on the most important information.`,
            },
            {
              role: "user",
              content: `Please summarize this transcript:\n\n${req.transcript}`,
            },
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw APIError.internal(`OpenAI API error: ${error}`);
      }

      const result = await response.json();
      const summary = result.choices?.[0]?.message?.content || "No summary available";

      return { summary };
    } catch (error) {
      console.error("Summarization error:", error);
      throw APIError.internal("Failed to generate summary");
    }
  }
);
