import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

const cohereApiKey = secret("CohereApiKey");
const openAIKey = secret("OpenAIKey");

interface SummarizeRequest {
  transcript: string;
  length?: "short" | "medium" | "long";
  format?: "paragraph" | "bullets";
}

interface SummarizeResponse {
  summary: string;
}

// Generates a summary of the provided transcript using Cohere or OpenAI.
export const summarize = api<SummarizeRequest, SummarizeResponse>(
  { expose: true, method: "POST", path: "/ai/summarize" },
  async (req) => {
    try {
      // Try Cohere first, fallback to OpenAI if needed
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
            extractiveness: "medium",
            additional_command: "Focus on key points, action items, and important decisions. Include speaker insights if multiple speakers are detected.",
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const summary = result.summary || "No summary available";
          return { summary };
        }
      } catch (cohereError) {
        console.warn("Cohere summarization failed, falling back to OpenAI:", cohereError);
      }

      // Fallback to OpenAI GPT-4
      const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAIKey()}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an expert at summarizing meeting transcripts and voice recordings. Create a concise, well-structured summary that includes:
              
              1. Key Points: Main topics and important information discussed
              2. Action Items: Tasks, decisions, and next steps identified
              3. Participants: Key speakers or roles mentioned (if applicable)
              4. Outcomes: Decisions made and conclusions reached
              
              Format the summary in clear, bullet-point style for easy reading. Focus on actionable insights and important details.`
            },
            {
              role: "user",
              content: `Please summarize this transcript:\n\n${req.transcript}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!openAIResponse.ok) {
        const error = await openAIResponse.text();
        throw APIError.internal(`OpenAI API error: ${error}`);
      }

      const openAIResult = await openAIResponse.json();
      const summary = openAIResult.choices[0]?.message?.content || "No summary available";

      return { summary };
    } catch (error) {
      console.error("Summarization error:", error);
      throw APIError.internal("Failed to generate summary");
    }
  }
);
