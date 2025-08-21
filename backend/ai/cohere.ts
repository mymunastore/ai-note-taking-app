import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { fetchWithRetry } from "./utils";

const cohereApiKey = secret("CohereApiKey");

interface CohereGenerateRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

interface CohereGenerateResponse {
  text: string;
}

interface CohereSearchRequest {
  query: string;
  documents: string[];
  topK?: number;
}

interface CohereSearchResponse {
  results: Array<{
    document: string;
    relevanceScore: number;
    index: number;
  }>;
}

interface CohereClassifyRequest {
  inputs: string[];
  examples: Array<{
    text: string;
    label: string;
  }>;
}

interface CohereClassifyResponse {
  classifications: Array<{
    input: string;
    prediction: string;
    confidence: number;
  }>;
}

// Generates text using Cohere's language models.
export const generate = api<CohereGenerateRequest, CohereGenerateResponse>(
  { expose: true, method: "POST", path: "/ai/cohere/generate" },
  async (req) => {
    try {
      const response = await fetchWithRetry("https://api.cohere.ai/v1/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cohereApiKey()}`,
        },
        body: JSON.stringify({
          model: req.model || "command",
          prompt: req.prompt,
          max_tokens: req.maxTokens || 100,
          temperature: req.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw APIError.internal(`Cohere API error: ${error}`);
      }

      const result = await response.json();
      return { text: result.generations[0]?.text || "" };
    } catch (error) {
      console.error("Cohere generation error:", error);
      throw APIError.internal("Failed to generate text with Cohere");
    }
  }
);

// Performs semantic search using Cohere's embedding models.
export const semanticSearch = api<CohereSearchRequest, CohereSearchResponse>(
  { expose: true, method: "POST", path: "/ai/cohere/search" },
  async (req) => {
    try {
      const response = await fetchWithRetry("https://api.cohere.ai/v1/rerank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cohereApiKey()}`,
        },
        body: JSON.stringify({
          model: "rerank-english-v2.0",
          query: req.query,
          documents: req.documents,
          top_n: req.topK || 5,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw APIError.internal(`Cohere API error: ${error}`);
      }

      const result = await response.json();
      return {
        results: result.results.map((item: any) => ({
          document: req.documents[item.index],
          relevanceScore: item.relevance_score,
          index: item.index,
        })),
      };
    } catch (error) {
      console.error("Cohere search error:", error);
      throw APIError.internal("Failed to perform semantic search");
    }
  }
);

// Classifies text using Cohere's classification models.
export const classify = api<CohereClassifyRequest, CohereClassifyResponse>(
  { expose: true, method: "POST", path: "/ai/cohere/classify" },
  async (req) => {
    try {
      const response = await fetchWithRetry("https://api.cohere.ai/v1/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cohereApiKey()}`,
        },
        body: JSON.stringify({
          model: "embed-multilingual-v2.0",
          inputs: req.inputs,
          examples: req.examples,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw APIError.internal(`Cohere API error: ${error}`);
      }

      const result = await response.json();
      return {
        classifications: result.classifications.map((item: any) => ({
          input: item.input,
          prediction: item.prediction,
          confidence: item.confidence,
        })),
      };
    } catch (error) {
      console.error("Cohere classification error:", error);
      throw APIError.internal("Failed to classify text");
    }
  }
);
