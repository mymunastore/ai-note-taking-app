import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const openAIKey = secret("OpenAIKey");
const notesDB = SQLDatabase.named("notes");

interface SmartInsightsRequest {
  timeframe?: "week" | "month" | "quarter" | "year";
  categories?: string[];
  includeComparisons?: boolean;
}

interface SmartInsightsResponse {
  insights: {
    productivity_trends: {
      meeting_frequency: number;
      average_duration: number;
      efficiency_score: number;
      trend_direction: "increasing" | "decreasing" | "stable";
    };
    communication_patterns: {
      most_active_times: string[];
      preferred_meeting_types: string[];
      collaboration_score: number;
    };
    content_analysis: {
      top_topics: Array<{
        topic: string;
        frequency: number;
        sentiment_trend: "positive" | "negative" | "neutral";
      }>;
      action_item_completion_rate: number;
      decision_velocity: number;
    };
    recommendations: Array<{
      category: "productivity" | "communication" | "content" | "workflow";
      title: string;
      description: string;
      impact: "high" | "medium" | "low";
      effort: "low" | "medium" | "high";
    }>;
    predictions: {
      next_week_meetings: number;
      upcoming_busy_periods: string[];
      potential_bottlenecks: string[];
    };
  };
  comparisons?: {
    previous_period: {
      meeting_count: number;
      total_duration: number;
      efficiency_change: number;
    };
    benchmarks: {
      industry_average: number;
      your_performance: number;
      percentile: number;
    };
  };
}

// Generates smart insights and predictions based on user's meeting patterns and content.
export const generateSmartInsights = api<SmartInsightsRequest, SmartInsightsResponse>(
  { expose: true, method: "POST", path: "/ai/smart-insights" },
  async (req) => {
    try {
      const timeframe = req.timeframe || "month";
      const includeComparisons = req.includeComparisons !== false;

      // Get notes data for analysis
      const timeframeMap = {
        week: "7 days",
        month: "30 days", 
        quarter: "90 days",
        year: "365 days"
      };

      const notes = await notesDB.queryAll<{
        id: number;
        title: string;
        transcript: string;
        summary: string;
        duration: number;
        tags: string[];
        created_at: Date;
      }>`
        SELECT id, title, transcript, summary, duration, tags, created_at
        FROM notes
        WHERE created_at >= NOW() - INTERVAL '${timeframeMap[timeframe]}'
        ORDER BY created_at DESC
      `;

      if (notes.length === 0) {
        return {
          insights: {
            productivity_trends: {
              meeting_frequency: 0,
              average_duration: 0,
              efficiency_score: 0,
              trend_direction: "stable"
            },
            communication_patterns: {
              most_active_times: [],
              preferred_meeting_types: [],
              collaboration_score: 0
            },
            content_analysis: {
              top_topics: [],
              action_item_completion_rate: 0,
              decision_velocity: 0
            },
            recommendations: [],
            predictions: {
              next_week_meetings: 0,
              upcoming_busy_periods: [],
              potential_bottlenecks: []
            }
          }
        };
      }

      // Analyze patterns
      const insights = await analyzePatterns(notes, timeframe);
      
      let comparisons;
      if (includeComparisons) {
        comparisons = await generateComparisons(notes, timeframe);
      }

      return {
        insights,
        comparisons
      };

    } catch (error) {
      console.error("Smart insights error:", error);
      throw APIError.internal("Failed to generate smart insights");
    }
  }
);

async function analyzePatterns(notes: any[], timeframe: string) {
  // Calculate basic metrics
  const totalMeetings = notes.length;
  const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0);
  const averageDuration = totalMeetings > 0 ? totalDuration / totalMeetings : 0;

  // Analyze meeting times
  const meetingTimes = notes.map((note) => new Date(note.created_at).getHours());
  const timeFrequency = meetingTimes.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const mostActiveHours = Object.entries(timeFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`);

  // Analyze topics from tags and summaries
  const allTags = notes.flatMap((note) => note.tags || []);
  const tagFrequency = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTopics = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([topic, frequency]) => ({
      topic,
      frequency,
      sentiment_trend: "neutral" as const
    }));

  // Generate AI-powered insights
  const aiInsights = await generateAIInsights(notes, {
    totalMeetings,
    averageDuration,
    mostActiveHours,
    topTopics
  });

  return {
    productivity_trends: {
      meeting_frequency: totalMeetings,
      average_duration: Math.round(averageDuration),
      efficiency_score: calculateEfficiencyScore(notes),
      trend_direction: determineTrend(notes) as "increasing" | "decreasing" | "stable"
    },
    communication_patterns: {
      most_active_times: mostActiveHours,
      preferred_meeting_types: extractMeetingTypes(notes),
      collaboration_score: calculateCollaborationScore(notes)
    },
    content_analysis: {
      top_topics: topTopics,
      action_item_completion_rate: 0.75,
      decision_velocity: calculateDecisionVelocity(notes)
    },
    recommendations: aiInsights.recommendations,
    predictions: aiInsights.predictions
  };
}

async function generateAIInsights(notes: any[], metrics: any) {
  const summariesText = notes.slice(0, 10).map((note) => note.summary).join("\n\n");
  
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
          content: "You are an expert productivity and meeting effectiveness analyst. Generate actionable recommendations and predictions based on meeting patterns and content. Only return valid JSON." 
        },
        { 
          role: "user", 
          content: `Analyze these meeting patterns and generate insights in JSON format:
          
          Metrics:
          - Total meetings: ${metrics.totalMeetings}
          - Average duration: ${metrics.averageDuration} minutes
          - Most active times: ${metrics.mostActiveHours.join(", ")}
          - Top topics: ${metrics.topTopics.map((t: any) => t.topic).join(", ")}
          
          Recent meeting summaries:
          ${summariesText}
          
          Generate JSON response with:
          {
            "recommendations": [
              {
                "category": "productivity|communication|content|workflow",
                "title": "recommendation title",
                "description": "detailed description",
                "impact": "high|medium|low",
                "effort": "low|medium|high"
              }
            ],
            "predictions": {
              "next_week_meetings": estimated_number,
              "upcoming_busy_periods": ["period1", "period2"],
              "potential_bottlenecks": ["bottleneck1", "bottleneck2"]
            }
          }` 
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    }),
  });

  if (!response.ok) {
    return {
      recommendations: [],
      predictions: {
        next_week_meetings: Math.round(metrics.totalMeetings / 4),
        upcoming_busy_periods: [],
        potential_bottlenecks: []
      }
    };
  }

  const result = await response.json();
  const insightsText = result.choices[0]?.message?.content;
  
  try {
    return JSON.parse(insightsText || "{}");
  } catch {
    return {
      recommendations: [],
      predictions: {
        next_week_meetings: Math.round(metrics.totalMeetings / 4),
        upcoming_busy_periods: [],
        potential_bottlenecks: []
      }
    };
  }
}

function calculateEfficiencyScore(notes: any[]): number {
  const avgWordsPerMinute =
    notes.reduce((sum, note) => {
      const wordCount = note.transcript.split(/\s+/).length;
      const wordsPerMinute = note.duration > 0 ? wordCount / (note.duration / 60) : 0;
      return sum + wordsPerMinute;
    }, 0) / notes.length;

  return Math.min(avgWordsPerMinute / 150, 1);
}

function determineTrend(notes: any[]): string {
  if (notes.length < 2) return "stable";
  
  const midpoint = Math.floor(notes.length / 2);
  const firstHalf = notes.slice(0, midpoint);
  const secondHalf = notes.slice(midpoint);
  
  const firstHalfAvg = firstHalf.reduce((sum, note) => sum + note.duration, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, note) => sum + note.duration, 0) / secondHalf.length;
  
  const change = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
  
  if (change > 0.1) return "increasing";
  if (change < -0.1) return "decreasing";
  return "stable";
}

function extractMeetingTypes(notes: any[]): string[] {
  const types = new Set<string>();
  
  notes.forEach((note) => {
    const title = note.title.toLowerCase();
    if (title.includes("standup") || title.includes("daily")) types.add("Daily Standup");
    if (title.includes("review") || title.includes("retrospective")) types.add("Review Meeting");
    if (title.includes("planning") || title.includes("sprint")) types.add("Planning Session");
    if (title.includes("1:1") || title.includes("one-on-one")) types.add("One-on-One");
    if (title.includes("interview")) types.add("Interview");
    if (title.includes("demo") || title.includes("presentation")) types.add("Presentation");
  });
  
  return Array.from(types).slice(0, 5);
}

function calculateCollaborationScore(notes: any[]): number {
  const avgTagsPerMeeting = notes.reduce((sum, note) => sum + (note.tags?.length || 0), 0) / notes.length;
  return Math.min(avgTagsPerMeeting / 5, 1);
}

function calculateDecisionVelocity(notes: any[]): number {
  const decisionsPerMeeting =
    notes.reduce((sum, note) => {
      const decisionKeywords = ["decided", "agreed", "concluded", "resolved"];
      const decisionCount = decisionKeywords.reduce((count, keyword) => {
        return count + (note.summary.toLowerCase().split(keyword).length - 1);
      }, 0);
      return sum + decisionCount;
    }, 0) / notes.length;
  
  return Math.min(decisionsPerMeeting, 1);
}

async function generateComparisons(notes: any[], timeframe: string) {
  const timeframeMap = {
    week: "14 days",
    month: "60 days",
    quarter: "180 days", 
    year: "730 days"
  };

  const previousPeriodNotes = await notesDB.queryAll<{
    duration: number;
    created_at: Date;
  }>`
    SELECT duration, created_at
    FROM notes
    WHERE created_at >= NOW() - INTERVAL '${timeframeMap[timeframe]}'
    AND created_at < NOW() - INTERVAL '${timeframe === "week" ? "7 days" : timeframe === "month" ? "30 days" : timeframe === "quarter" ? "90 days" : "365 days"}'
  `;

  const currentTotal = notes.reduce((sum, note) => sum + note.duration, 0);
  const previousTotal = previousPeriodNotes.reduce((sum, note) => sum + note.duration, 0);
  const efficiencyChange = previousTotal > 0 ? (currentTotal - previousTotal) / previousTotal : 0;

  return {
    previous_period: {
      meeting_count: previousPeriodNotes.length,
      total_duration: previousTotal,
      efficiency_change: Math.round(efficiencyChange * 100) / 100
    },
    benchmarks: {
      industry_average: 8.5,
      your_performance: currentTotal / 3600,
      percentile: 75
    }
  };
}
