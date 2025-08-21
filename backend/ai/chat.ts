import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import type { ChatRequest, ChatResponse } from "../notes/types";

const cohereApiKey = secret("CohereApiKey");

// Provides AI-powered chat assistance for notes and recordings using Cohere.
export const chat = api<ChatRequest, ChatResponse>(
  { expose: true, method: "POST", path: "/ai/chat" },
  async (req) => {
    try {
      const preamble = `You are SCRIBE AI, an intelligent assistant specialized in helping users with their voice recordings, transcripts, and notes. You can:
1. Answer questions about their recordings and notes
2. Help analyze meeting content and extract insights
3. Suggest action items from transcripts
4. Provide summaries and explanations
5. Help with note organization and search
Be helpful, concise, and professional. If the user provides context from their notes or recordings, use that information to give more relevant responses.
${req.context ? `\n\nContext from user's notes/recordings:\n${req.context}` : ''}`;

      const response = await fetch("https://api.cohere.ai/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cohereApiKey()}`,
        },
        body: JSON.stringify({
          model: "command-r",
          message: req.message,
          chat_history: req.chatHistory,
          preamble: preamble,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw APIError.internal(`Cohere API error: ${error}`);
      }

      const result = await response.json();
      const chatResponse = result.text || "I'm sorry, I couldn't generate a response.";

      return { response: chatResponse };
    } catch (error) {
      console.error("Chat error:", error);
      throw APIError.internal("Failed to generate chat response");
    }
  }
);
