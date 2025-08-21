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
      // Validate input
      if (!req.transcript || req.transcript.trim().length === 0) {
        throw APIError.invalidArgument("Transcript is required and cannot be empty");
      }

      // Check transcript length (reasonable limits)
      if (req.transcript.length > 100000) { // ~100k characters
        throw APIError.invalidArgument("Transcript too long. Maximum length is 100,000 characters");
      }

      if (req.transcript.trim().length < 10) {
        throw APIError.invalidArgument("Transcript too short. Minimum length is 10 characters");
      }

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
          const summary = result.summary || "";
          
          if (summary.trim().length > 0) {
            return { summary };
          }
        } else if (response.status === 429) {
          console.warn("Cohere rate limit exceeded, falling back to OpenAI");
        } else {
          console.warn("Cohere summarization failed, falling back to OpenAI:", response.status);
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
        const errorText = await openAIResponse.text();
        console.error("OpenAI summarization error:", errorText);
        
        if (openAIResponse.status === 400) {
          throw APIError.invalidArgument("Invalid transcript content");
        } else if (openAIResponse.status === 429) {
          throw APIError.resourceExhausted("Rate limit exceeded. Please try again later");
        } else {
          throw APIError.internal(`OpenAI API error: ${openAIResponse.status}`);
        }
      }

      const openAIResult = await openAIResponse.json();
      const summary = openAIResult.choices[0]?.message?.content || "";

      if (!summary || summary.trim().length === 0) {
        throw APIError.internal("Failed to generate summary");
      }

      return { summary };
    } catch (error) {
      console.error("Summarization error:", error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw APIError.unavailable("Unable to connect to summarization service. Please check your internet connection");
      }
      
      throw APIError.internal("Failed to generate summary. Please try again");
    }
  }
);
