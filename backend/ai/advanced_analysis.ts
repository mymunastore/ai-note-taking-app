import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

const openAIKey = secret("OpenAIKey");

interface AdvancedAnalysisRequest {
  transcript: string;
  analysisTypes: Array<"sentiment" | "emotions" | "topics" | "speakers" | "action_items" | "decisions" | "risks" | "opportunities" | "compliance" | "meeting_quality">;
  customPrompts?: Array<{
    name: string;
    prompt: string;
  }>;
}

interface AdvancedAnalysisResponse {
  analysis: {
    sentiment?: {
      overall: "positive" | "negative" | "neutral";
      confidence: number;
      details: string;
      emotional_tone: string;
      engagement_level: number;
    };
    emotions?: Array<{
      emotion: string;
      intensity: number;
      timestamp?: string;
      context: string;
    }>;
    topics?: Array<{
      topic: string;
      relevance: number;
      mentions: number;
      sentiment: "positive" | "negative" | "neutral";
      keywords: string[];
    }>;
    speakers?: Array<{
      speaker: string;
      segments: number;
      speaking_time: number;
      keyPoints: string[];
      communication_style: string;
      engagement_score: number;
    }>;
    actionItems?: Array<{
      item: string;
      assignee?: string;
      priority: "critical" | "high" | "medium" | "low";
      deadline?: string;
      category: string;
      estimated_effort: string;
    }>;
    decisions?: Array<{
      decision: string;
      decision_maker: string;
      impact_level: "high" | "medium" | "low";
      rationale: string;
      follow_up_required: boolean;
    }>;
    risks?: Array<{
      risk: string;
      severity: "critical" | "high" | "medium" | "low";
      probability: number;
      mitigation_suggestions: string[];
    }>;
    opportunities?: Array<{
      opportunity: string;
      potential_value: "high" | "medium" | "low";
      effort_required: string;
      timeline: string;
    }>;
    compliance?: {
      issues_identified: string[];
      recommendations: string[];
      risk_level: "high" | "medium" | "low";
    };
    meetingQuality?: {
      overall_score: number;
      participation_balance: number;
      agenda_adherence: number;
      outcome_clarity: number;
      recommendations: string[];
    };
    customAnalysis?: Array<{
      name: string;
      result: string;
    }>;
  };
  insights: {
    key_takeaways: string[];
    next_steps: string[];
    follow_up_meetings: string[];
    stakeholder_actions: Array<{
      stakeholder: string;
      actions: string[];
    }>;
  };
  metadata: {
    processing_time: number;
    confidence_score: number;
    language_detected: string;
    word_count: number;
    estimated_reading_time: number;
  };
}

// Performs advanced AI analysis with multiple sophisticated insights.
export const advancedAnalysis = api<AdvancedAnalysisRequest, AdvancedAnalysisResponse>(
  { expose: true, method: "POST", path: "/ai/advanced-analysis" },
  async (req) => {
    const startTime = Date.now();
    
    try {
      if (!req.transcript || req.transcript.trim().length < 50) {
        throw APIError.invalidArgument("Transcript must be at least 50 characters long for advanced analysis");
      }

      const analysis: any = {};
      const insights: any = {
        key_takeaways: [],
        next_steps: [],
        follow_up_meetings: [],
        stakeholder_actions: []
      };

      // For mapping snake_case keys to camelCase properties in the response
      const keyMap: Record<string, string> = {
        action_items: "actionItems",
        meeting_quality: "meetingQuality",
      };

      // Process each analysis type
      for (const analysisType of req.analysisTypes) {
        try {
          const result = await performSpecificAnalysis(req.transcript, analysisType);
          const key = keyMap[analysisType] || analysisType;
          analysis[key] = result;
        } catch (error) {
          console.warn(`Failed to perform ${analysisType} analysis:`, error);
        }
      }

      // Process custom prompts
      if (req.customPrompts && req.customPrompts.length > 0) {
        analysis.customAnalysis = [];
        for (const customPrompt of req.customPrompts) {
          try {
            const result = await performCustomAnalysis(req.transcript, customPrompt);
            analysis.customAnalysis.push(result);
          } catch (error) {
            console.warn(`Failed to perform custom analysis "${customPrompt.name}":`, error);
          }
        }
      }

      // Generate comprehensive insights
      const comprehensiveInsights = await generateComprehensiveInsights(req.transcript, analysis);
      Object.assign(insights, comprehensiveInsights);

      const processingTime = Date.now() - startTime;
      const wordCount = req.transcript.split(/\s+/).length;

      return {
        analysis,
        insights,
        metadata: {
          processing_time: processingTime,
          confidence_score: calculateConfidenceScore(analysis),
          language_detected: "en",
          word_count: wordCount,
          estimated_reading_time: Math.ceil(wordCount / 200)
        }
      };

    } catch (error) {
      console.error("Advanced analysis error:", error);
      throw APIError.internal("Failed to perform advanced analysis");
    }
  }
);

async function performSpecificAnalysis(transcript: string, analysisType: string) {
  const systemPrompts = {
    sentiment: `You are an expert at analyzing sentiment and emotional tone in business communications. Provide detailed sentiment analysis with emotional context and engagement metrics. Only return valid JSON without any additional text.`,
    emotions: `You are an expert at detecting emotions and emotional patterns in conversations. Identify specific emotions, their intensity, and contextual triggers. Only return valid JSON without any additional text.`,
    topics: `You are an expert at topic modeling and content analysis. Extract main topics with relevance scores, sentiment per topic, and associated keywords. Only return valid JSON without any additional text.`,
    speakers: `You are an expert at analyzing speaker patterns and communication styles. Evaluate speaking time, engagement, communication effectiveness, and individual contributions. Only return valid JSON without any additional text.`,
    action_items: `You are an expert at extracting actionable items from meetings and conversations. Identify tasks, assignments, priorities, and effort estimates. Only return valid JSON without any additional text.`,
    decisions: `You are an expert at identifying decisions made during meetings. Extract decisions, decision makers, impact levels, and rationale. Only return valid JSON without any additional text.`,
    risks: `You are an expert at risk analysis and identification. Identify potential risks, assess severity and probability, and suggest mitigation strategies. Only return valid JSON without any additional text.`,
    opportunities: `You are an expert at opportunity identification and business analysis. Identify potential opportunities, assess value and effort required. Only return valid JSON without any additional text.`,
    compliance: `You are an expert at compliance and regulatory analysis. Identify potential compliance issues and provide recommendations. Only return valid JSON without any additional text.`,
    meeting_quality: `You are an expert at meeting effectiveness analysis. Evaluate meeting quality, participation, agenda adherence, and provide improvement recommendations. Only return valid JSON without any additional text.`
  };

  const userPrompts = {
    sentiment: `Analyze the sentiment of this transcript and return a JSON response with detailed emotional analysis:
    {
      "overall": "positive|negative|neutral",
      "confidence": 0.0-1.0,
      "details": "detailed explanation",
      "emotional_tone": "description of emotional tone",
      "engagement_level": 0.0-1.0
    }`,
    emotions: `Identify emotions in this transcript and return a JSON response:
    [
      {
        "emotion": "emotion name",
        "intensity": 0.0-1.0,
        "context": "contextual explanation"
      }
    ]`,
    topics: `Extract topics from this transcript and return a JSON response:
    [
      {
        "topic": "topic name",
        "relevance": 0.0-1.0,
        "mentions": number,
        "sentiment": "positive|negative|neutral",
        "keywords": ["keyword1", "keyword2"]
      }
    ]`,
    speakers: `Analyze speakers in this transcript and return a JSON response:
    [
      {
        "speaker": "speaker identifier",
        "segments": number,
        "speaking_time": percentage,
        "keyPoints": ["point1", "point2"],
        "communication_style": "description",
        "engagement_score": 0.0-1.0
      }
    ]`,
    action_items: `Extract action items and return a JSON response:
    [
      {
        "item": "action description",
        "assignee": "person responsible",
        "priority": "critical|high|medium|low",
        "deadline": "deadline if mentioned",
        "category": "category type",
        "estimated_effort": "effort estimate"
      }
    ]`,
    decisions: `Identify decisions made and return a JSON response:
    [
      {
        "decision": "decision description",
        "decision_maker": "person who decided",
        "impact_level": "high|medium|low",
        "rationale": "reasoning behind decision",
        "follow_up_required": true|false
      }
    ]`,
    risks: `Identify risks and return a JSON response:
    [
      {
        "risk": "risk description",
        "severity": "critical|high|medium|low",
        "probability": 0.0-1.0,
        "mitigation_suggestions": ["suggestion1", "suggestion2"]
      }
    ]`,
    opportunities: `Identify opportunities and return a JSON response:
    [
      {
        "opportunity": "opportunity description",
        "potential_value": "high|medium|low",
        "effort_required": "effort description",
        "timeline": "estimated timeline"
      }
    ]`,
    compliance: `Analyze compliance aspects and return a JSON response:
    {
      "issues_identified": ["issue1", "issue2"],
      "recommendations": ["rec1", "rec2"],
      "risk_level": "high|medium|low"
    }`,
    meeting_quality: `Evaluate meeting quality and return a JSON response:
    {
      "overall_score": 0.0-1.0,
      "participation_balance": 0.0-1.0,
      "agenda_adherence": 0.0-1.0,
      "outcome_clarity": 0.0-1.0,
      "recommendations": ["rec1", "rec2"]
    }`
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openAIKey()}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompts[analysisType as keyof typeof systemPrompts] },
        { role: "user", content: `${userPrompts[analysisType as keyof typeof userPrompts]}\n\nTranscript: ${transcript}` }
      ],
      temperature: 0.3,
      max_tokens: 2000
    }),
  });

  if (!response.ok) {
    throw new Error(`Analysis API error: ${response.status}`);
  }

  const result = await response.json();
  const analysisText = result.choices[0]?.message?.content;
  
  if (!analysisText) {
    throw new Error("No analysis result received");
  }

  let parsedResult: any;
  try {
    parsedResult = JSON.parse(analysisText);
  } catch {
    const match = analysisText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) throw new Error("Invalid JSON in analysis result");
    parsedResult = JSON.parse(match[0]);
  }
  
  return parsedResult;
}

async function performCustomAnalysis(transcript: string, customPrompt: { name: string; prompt: string }) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openAIKey()}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert analyst. Provide detailed analysis based on the custom prompt provided. Only return the analysis text." },
        { role: "user", content: `${customPrompt.prompt}\n\nTranscript: ${transcript}` }
      ],
      temperature: 0.3,
      max_tokens: 1000
    }),
  });

  if (!response.ok) {
    throw new Error(`Custom analysis API error: ${response.status}`);
  }

  const result = await response.json();
  return {
    name: customPrompt.name,
    result: result.choices[0]?.message?.content || "No result generated"
  };
}

async function generateComprehensiveInsights(transcript: string, analysis: any) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openAIKey()}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are an expert at synthesizing meeting analysis into actionable insights. Generate comprehensive insights including key takeaways, next steps, follow-up meetings, and stakeholder actions. Only return valid JSON without any extra text." 
        },
        { 
          role: "user", 
          content: `Based on this transcript and analysis, generate comprehensive insights in JSON format:
          {
            "key_takeaways": ["takeaway1", "takeaway2"],
            "next_steps": ["step1", "step2"],
            "follow_up_meetings": ["meeting1", "meeting2"],
            "stakeholder_actions": [
              {
                "stakeholder": "person name",
                "actions": ["action1", "action2"]
              }
            ]
          }
          
          Transcript: ${transcript}
          Analysis: ${JSON.stringify(analysis)}` 
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    }),
  });

  if (!response.ok) {
    return {
      key_takeaways: [],
      next_steps: [],
      follow_up_meetings: [],
      stakeholder_actions: []
    };
  }

  const result = await response.json();
  const insightsText = result.choices[0]?.message?.content;
  
  try {
    return JSON.parse(insightsText || "{}");
  } catch {
    return {
      key_takeaways: [],
      next_steps: [],
      follow_up_meetings: [],
      stakeholder_actions: []
    };
  }
}

function calculateConfidenceScore(analysis: any): number {
  let totalScore = 0;
  let count = 0;

  // Calculate confidence based on available analysis
  Object.values(analysis).forEach((result: any) => {
    if (result && typeof result === 'object') {
      if (result.confidence) {
        totalScore += result.confidence;
        count++;
      } else if (Array.isArray(result) && result.length > 0) {
        totalScore += 0.8; // High confidence for successful array results
        count++;
      } else if (result.overall_score) {
        totalScore += result.overall_score;
        count++;
      }
    }
  });

  return count > 0 ? totalScore / count : 0.7;
}
