import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

const openAIKey = secret("OpenAIKey");

interface AnalyzeTranscriptRequest {
  transcript: string;
  analysisType: "sentiment" | "topics" | "speakers" | "action_items" | "summary_insights";
}

interface AnalyzeTranscriptResponse {
  analysis: {
    sentiment?: {
      overall: "positive" | "negative" | "neutral";
      confidence: number;
      details: string;
    };
    topics?: Array<{
      topic: string;
      relevance: number;
      mentions: number;
    }>;
    speakers?: Array<{
      speaker: string;
      segments: number;
      keyPoints: string[];
    }>;
    actionItems?: Array<{
      item: string;
      assignee?: string;
      priority: "high" | "medium" | "low";
      deadline?: string;
    }>;
    insights?: {
      keyDecisions: string[];
      followUpNeeded: string[];
      importantQuotes: string[];
    };
  };
}

// Analyzes transcript content for various insights using advanced AI.
export const analyzeTranscript = api<AnalyzeTranscriptRequest, AnalyzeTranscriptResponse>(
  { expose: true, method: "POST", path: "/ai/analyze" },
  async (req) => {
    try {
      let systemPrompt = "";
      let userPrompt = "";

      switch (req.analysisType) {
        case "sentiment":
          systemPrompt = "You are an expert at analyzing sentiment in conversations and meetings. Analyze the overall sentiment, confidence level, and provide detailed insights. Only return a valid JSON object. No prose.";
          userPrompt = `Analyze the sentiment of this transcript and return a JSON response with:
          {
            "sentiment": {
              "overall": "positive|negative|neutral",
              "confidence": 0.0-1.0,
              "details": "explanation of the sentiment analysis"
            }
          }
          
          Transcript: ${req.transcript}`;
          break;

        case "topics":
          systemPrompt = "You are an expert at identifying and categorizing topics in conversations. Extract the main topics discussed and their relevance. Only return a valid JSON object. No prose.";
          userPrompt = `Identify the main topics discussed in this transcript and return a JSON response with:
          {
            "topics": [
              {
                "topic": "topic name",
                "relevance": 0.0-1.0,
                "mentions": number_of_mentions
              }
            ]
          }
          
          Transcript: ${req.transcript}`;
          break;

        case "speakers":
          systemPrompt = "You are an expert at identifying speakers and their contributions in conversations. Analyze speaker patterns and key points. Only return a valid JSON object. No prose.";
          userPrompt = `Analyze the speakers in this transcript and return a JSON response with:
          {
            "speakers": [
              {
                "speaker": "speaker identifier",
                "segments": number_of_speaking_segments,
                "keyPoints": ["key point 1", "key point 2"]
              }
            ]
          }
          
          Transcript: ${req.transcript}`;
          break;

        case "action_items":
          systemPrompt = "You are an expert at extracting action items, tasks, and commitments from meeting transcripts. Only return a valid JSON object. No prose.";
          userPrompt = `Extract action items from this transcript and return a JSON response with:
          {
            "actionItems": [
              {
                "item": "action item description",
                "assignee": "person responsible (if mentioned)",
                "priority": "high|medium|low",
                "deadline": "deadline if mentioned"
              }
            ]
          }
          
          Transcript: ${req.transcript}`;
          break;

        case "summary_insights":
          systemPrompt = "You are an expert at extracting key insights, decisions, and important information from meeting transcripts. Only return a valid JSON object. No prose.";
          userPrompt = `Extract key insights from this transcript and return a JSON response with:
          {
            "insights": {
              "keyDecisions": ["decision 1", "decision 2"],
              "followUpNeeded": ["follow up 1", "follow up 2"],
              "importantQuotes": ["quote 1", "quote 2"]
            }
          }
          
          Transcript: ${req.transcript}`;
          break;

        default:
          throw APIError.invalidArgument("Invalid analysis type");
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAIKey()}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 1000
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw APIError.internal(`OpenAI API error: ${error}`);
      }

      const result = await response.json();
      const analysisText = result.choices[0]?.message?.content;
      
      if (!analysisText) {
        throw APIError.internal("No analysis result received");
      }

      let analysis: AnalyzeTranscriptResponse["analysis"];
      try {
        analysis = JSON.parse(analysisText);
      } catch (e) {
        // Attempt to extract JSON if there is any extra text
        const match = analysisText.match(/\{[\s\S]*\}$/);
        if (!match) throw APIError.internal("Invalid JSON returned from model");
        analysis = JSON.parse(match[0]);
      }

      return { analysis };

    } catch (error) {
      console.error("Analysis error:", error);
      throw APIError.internal("Failed to analyze transcript");
    }
  }
);
