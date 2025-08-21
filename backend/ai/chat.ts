import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

const openAIKey = secret("OpenAIKey");

interface ChatRequest {
  message: string;
  context?: string;
  chatHistory?: Array<{ role: "USER" | "CHATBOT"; message: string }>;
}

interface ChatResponse {
  response: string;
}

// Provides AI-powered chat assistance for notes and recordings.
export const chat = api<ChatRequest, ChatResponse>(
  { expose: true, method: "POST", path: "/ai/chat" },
  async (req) => {
    try {
      const messages = [
        {
          role: "system",
          content: `You are SCRIBE AI, an intelligent assistant specialized in helping users with their voice recordings, transcripts, and notes. You can:
1. Answer questions about their recordings and notes
2. Help analyze meeting content and extract insights
3. Suggest action items from transcripts
4. Provide summaries and explanations
5. Help with note organization and search
6. Assist with multilingual content understanding

Be helpful, concise, and professional. If the user provides context from their notes or recordings, use that information to give more relevant responses. Always prioritize accuracy and provide actionable insights.

${req.context ? `\n\nContext from user's notes/recordings:\n${req.context}` : ''}`
        }
      ];

      if (req.chatHistory) {
        for (const msg of req.chatHistory) {
          messages.push({
            role: msg.role === "USER" ? "user" : "assistant",
            content: msg.message
          });
        }
      }

      messages.push({
        role: "user",
        content: req.message
      });

      const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAIKey()}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!openAIResponse.ok) {
        const error = await openAIResponse.text();
        throw APIError.internal(`OpenAI API error: ${error}`);
      }

      const openAIResult = await openAIResponse.json();
      const chatResponse = openAIResult.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

      return { response: chatResponse };
    } catch (error) {
      console.error("Chat error:", error);
      throw APIError.internal("Failed to generate chat response");
    }
  }
);
