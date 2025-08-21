import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const openAIKey = secret("OpenAIKey");
const notesDB = SQLDatabase.named("notes");

interface MeetingPreparationRequest {
  participants?: string[];
  topics?: string[];
  meetingType?: string;
  duration?: number;
  previousMeetingIds?: number[];
  customContext?: string;
}

interface AgendaItem {
  title: string;
  description: string;
  estimatedDuration: number;
  priority: "high" | "medium" | "low";
  category: "discussion" | "decision" | "update" | "action_review";
  suggestedOwner?: string;
  backgroundInfo?: string;
}

interface BriefingPoint {
  topic: string;
  summary: string;
  keyPoints: string[];
  lastDiscussed?: Date;
  actionItemsFromPrevious?: string[];
  relevantQuotes?: string[];
}

interface DiscussionPoint {
  question: string;
  context: string;
  expectedOutcome: "decision" | "alignment" | "brainstorm" | "update";
  difficulty: "easy" | "medium" | "complex";
  stakeholders: string[];
}

interface MeetingPreparationResponse {
  suggestedAgenda: AgendaItem[];
  briefingDocument: {
    executiveSummary: string;
    keyTopics: BriefingPoint[];
    previousMeetingInsights: {
      totalMeetings: number;
      commonTopics: string[];
      outstandingActionItems: string[];
      recurringIssues: string[];
    };
    participantContext: Array<{
      participant: string;
      recentContributions: string[];
      expertise: string[];
      preferredCommunicationStyle: string;
    }>;
  };
  discussionPoints: DiscussionPoint[];
  recommendations: {
    meetingStructure: string;
    timeAllocation: Record<string, number>;
    preparationTasks: Array<{
      task: string;
      assignee?: string;
      deadline: string;
    }>;
    potentialChallenges: string[];
    successMetrics: string[];
  };
  metadata: {
    analysisBasedOn: {
      previousMeetings: number;
      participantHistory: number;
      topicRelevance: number;
    };
    confidenceScore: number;
    generatedAt: Date;
  };
}

interface AnalyzeMeetingPatternsRequest {
  participants?: string[];
  topics?: string[];
  timeframe?: "week" | "month" | "quarter" | "year";
  includeOutcomes?: boolean;
}

interface MeetingPattern {
  pattern: string;
  frequency: number;
  participants: string[];
  averageDuration: number;
  commonOutcomes: string[];
  successRate: number;
  recommendations: string[];
}

interface AnalyzeMeetingPatternsResponse {
  patterns: MeetingPattern[];
  insights: {
    mostProductiveMeetingTypes: string[];
    optimalMeetingLength: number;
    bestTimeSlots: string[];
    participantEngagement: Record<string, number>;
    topicEffectiveness: Record<string, number>;
  };
  recommendations: string[];
}

// Generates comprehensive meeting preparation materials using AI analysis of previous meetings.
export const prepareMeeting = api<MeetingPreparationRequest, MeetingPreparationResponse>(
  { expose: true, method: "POST", path: "/ai/prepare-meeting" },
  async (req) => {
    try {
      // Get relevant previous meetings
      const previousMeetings = await findRelevantMeetings(req);
      
      // Analyze participant history
      const participantAnalysis = await analyzeParticipantHistory(req.participants || []);
      
      // Generate agenda suggestions
      const suggestedAgenda = await generateAgendaSuggestions(req, previousMeetings);
      
      // Create briefing document
      const briefingDocument = await generateBriefingDocument(req, previousMeetings, participantAnalysis);
      
      // Generate discussion points
      const discussionPoints = await generateDiscussionPoints(req, previousMeetings);
      
      // Create recommendations
      const recommendations = await generateMeetingRecommendations(req, previousMeetings);
      
      return {
        suggestedAgenda,
        briefingDocument,
        discussionPoints,
        recommendations,
        metadata: {
          analysisBasedOn: {
            previousMeetings: previousMeetings.length,
            participantHistory: participantAnalysis.length,
            topicRelevance: calculateTopicRelevance(req.topics || [], previousMeetings),
          },
          confidenceScore: calculateConfidenceScore(previousMeetings.length, req),
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      console.error("Meeting preparation error:", error);
      throw APIError.internal("Failed to prepare meeting materials");
    }
  }
);

// Analyzes meeting patterns and provides insights for better meeting planning.
export const analyzeMeetingPatterns = api<AnalyzeMeetingPatternsRequest, AnalyzeMeetingPatternsResponse>(
  { expose: true, method: "POST", path: "/ai/analyze-meeting-patterns" },
  async (req) => {
    try {
      const timeframeMap = {
        week: "7 days",
        month: "30 days",
        quarter: "90 days",
        year: "365 days"
      };

      const timeframe = req.timeframe || "month";
      
      // Get meetings within timeframe
      let query = `
        SELECT id, title, transcript, summary, duration, tags, created_at
        FROM notes
        WHERE created_at >= NOW() - INTERVAL '${timeframeMap[timeframe]}'
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      if (req.participants && req.participants.length > 0) {
        const participantConditions = req.participants.map(() => {
          return `(transcript ILIKE $${paramIndex++} OR summary ILIKE $${paramIndex++})`;
        }).join(' OR ');
        
        query += ` AND (${participantConditions})`;
        
        req.participants.forEach(participant => {
          params.push(`%${participant}%`, `%${participant}%`);
        });
      }
      
      if (req.topics && req.topics.length > 0) {
        const topicConditions = req.topics.map(() => {
          return `(transcript ILIKE $${paramIndex++} OR summary ILIKE $${paramIndex++} OR tags && $${paramIndex++})`;
        }).join(' OR ');
        
        query += ` AND (${topicConditions})`;
        
        req.topics.forEach(topic => {
          params.push(`%${topic}%`, `%${topic}%`, [topic]);
        });
      }
      
      query += ` ORDER BY created_at DESC`;
      
      const meetings = await notesDB.rawQueryAll<{
        id: number;
        title: string;
        transcript: string;
        summary: string;
        duration: number;
        tags: string[];
        created_at: Date;
      }>(query, ...params);
      
      if (meetings.length === 0) {
        return {
          patterns: [],
          insights: {
            mostProductiveMeetingTypes: [],
            optimalMeetingLength: 30,
            bestTimeSlots: [],
            participantEngagement: {},
            topicEffectiveness: {},
          },
          recommendations: ["Insufficient data for pattern analysis. Record more meetings to get insights."],
        };
      }
      
      // Analyze patterns using AI
      const patterns = await identifyMeetingPatterns(meetings);
      const insights = await generateMeetingInsights(meetings);
      const recommendations = await generatePatternRecommendations(patterns, insights);
      
      return {
        patterns,
        insights,
        recommendations,
      };
    } catch (error) {
      console.error("Meeting pattern analysis error:", error);
      throw APIError.internal("Failed to analyze meeting patterns");
    }
  }
);

async function findRelevantMeetings(req: MeetingPreparationRequest) {
  let query = `
    SELECT id, title, transcript, summary, duration, tags, created_at
    FROM notes
    WHERE 1=1
  `;
  
  const params: any[] = [];
  let paramIndex = 1;
  
  // If specific meeting IDs are provided
  if (req.previousMeetingIds && req.previousMeetingIds.length > 0) {
    query += ` AND id = ANY($${paramIndex++})`;
    params.push(req.previousMeetingIds);
  } else {
    // Search by participants and topics
    const conditions: string[] = [];
    
    if (req.participants && req.participants.length > 0) {
      const participantConditions = req.participants.map(() => {
        return `(transcript ILIKE $${paramIndex++} OR summary ILIKE $${paramIndex++})`;
      }).join(' OR ');
      
      conditions.push(`(${participantConditions})`);
      
      req.participants.forEach(participant => {
        params.push(`%${participant}%`, `%${participant}%`);
      });
    }
    
    if (req.topics && req.topics.length > 0) {
      const topicConditions = req.topics.map(() => {
        return `(transcript ILIKE $${paramIndex++} OR summary ILIKE $${paramIndex++} OR tags && $${paramIndex++})`;
      }).join(' OR ');
      
      conditions.push(`(${topicConditions})`);
      
      req.topics.forEach(topic => {
        params.push(`%${topic}%`, `%${topic}%`, [topic]);
      });
    }
    
    if (conditions.length > 0) {
      query += ` AND (${conditions.join(' OR ')})`;
    }
    
    // Limit to recent meetings if no specific criteria
    query += ` AND created_at >= NOW() - INTERVAL '90 days'`;
  }
  
  query += ` ORDER BY created_at DESC LIMIT 20`;
  
  return await notesDB.rawQueryAll<{
    id: number;
    title: string;
    transcript: string;
    summary: string;
    duration: number;
    tags: string[];
    created_at: Date;
  }>(query, ...params);
}

async function analyzeParticipantHistory(participants: string[]) {
  if (participants.length === 0) return [];
  
  const participantData = [];
  
  for (const participant of participants) {
    const meetings = await notesDB.rawQueryAll<{
      transcript: string;
      summary: string;
      tags: string[];
    }>(
      `SELECT transcript, summary, tags
       FROM notes
       WHERE (transcript ILIKE $1 OR summary ILIKE $2)
       AND created_at >= NOW() - INTERVAL '90 days'
       ORDER BY created_at DESC
       LIMIT 10`,
      `%${participant}%`,
      `%${participant}%`
    );
    
    participantData.push({
      participant,
      meetings,
    });
  }
  
  return participantData;
}

async function generateAgendaSuggestions(req: MeetingPreparationRequest, previousMeetings: any[]): Promise<AgendaItem[]> {
  const context = {
    participants: req.participants || [],
    topics: req.topics || [],
    meetingType: req.meetingType || "general",
    duration: req.duration || 60,
    previousMeetings: previousMeetings.slice(0, 5).map(m => ({
      title: m.title,
      summary: m.summary,
      tags: m.tags,
    })),
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
        {
          role: "system",
          content: `You are an expert meeting facilitator and agenda planner. Generate a comprehensive agenda based on previous meeting context and participant history. Focus on actionable items, clear outcomes, and efficient time management. Return only valid JSON.`,
        },
        {
          role: "user",
          content: `Generate an agenda for a ${context.meetingType} meeting with ${context.duration} minutes duration.
          
          Participants: ${context.participants.join(", ")}
          Topics: ${context.topics.join(", ")}
          
          Previous meeting context:
          ${context.previousMeetings.map(m => `- ${m.title}: ${m.summary.substring(0, 200)}...`).join('\n')}
          
          Return JSON array of agenda items with this structure:
          [
            {
              "title": "agenda item title",
              "description": "detailed description",
              "estimatedDuration": minutes_as_number,
              "priority": "high|medium|low",
              "category": "discussion|decision|update|action_review",
              "suggestedOwner": "participant name or null",
              "backgroundInfo": "relevant context from previous meetings"
            }
          ]`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });
  
  if (!response.ok) {
    return [];
  }
  
  const result = await response.json();
  const agendaText = result.choices[0]?.message?.content;
  
  try {
    return JSON.parse(agendaText || "[]");
  } catch {
    return [];
  }
}

async function generateBriefingDocument(req: MeetingPreparationRequest, previousMeetings: any[], participantAnalysis: any[]) {
  const context = {
    participants: req.participants || [],
    topics: req.topics || [],
    meetingType: req.meetingType || "general",
    previousMeetings: previousMeetings.slice(0, 10),
    participantAnalysis,
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
        {
          role: "system",
          content: `You are an expert executive assistant creating comprehensive briefing documents. Analyze previous meetings to provide context, identify patterns, and highlight important information for upcoming meetings. Return only valid JSON.`,
        },
        {
          role: "user",
          content: `Create a briefing document for an upcoming ${context.meetingType} meeting.
          
          Participants: ${context.participants.join(", ")}
          Topics: ${context.topics.join(", ")}
          
          Previous meetings data:
          ${context.previousMeetings.map(m => `
          Title: ${m.title}
          Date: ${m.created_at}
          Summary: ${m.summary}
          Tags: ${m.tags.join(", ")}
          `).join('\n---\n')}
          
          Generate a comprehensive briefing document in JSON format:
          {
            "executiveSummary": "high-level overview of meeting context and objectives",
            "keyTopics": [
              {
                "topic": "topic name",
                "summary": "topic summary from previous discussions",
                "keyPoints": ["point1", "point2"],
                "lastDiscussed": "date or null",
                "actionItemsFromPrevious": ["action1", "action2"],
                "relevantQuotes": ["quote1", "quote2"]
              }
            ],
            "previousMeetingInsights": {
              "totalMeetings": ${context.previousMeetings.length},
              "commonTopics": ["topic1", "topic2"],
              "outstandingActionItems": ["item1", "item2"],
              "recurringIssues": ["issue1", "issue2"]
            },
            "participantContext": [
              {
                "participant": "name",
                "recentContributions": ["contribution1", "contribution2"],
                "expertise": ["area1", "area2"],
                "preferredCommunicationStyle": "style description"
              }
            ]
          }`,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    }),
  });
  
  if (!response.ok) {
    return {
      executiveSummary: "Unable to generate briefing document",
      keyTopics: [],
      previousMeetingInsights: {
        totalMeetings: previousMeetings.length,
        commonTopics: [],
        outstandingActionItems: [],
        recurringIssues: [],
      },
      participantContext: [],
    };
  }
  
  const result = await response.json();
  const briefingText = result.choices[0]?.message?.content;
  
  try {
    return JSON.parse(briefingText || "{}");
  } catch {
    return {
      executiveSummary: "Unable to generate briefing document",
      keyTopics: [],
      previousMeetingInsights: {
        totalMeetings: previousMeetings.length,
        commonTopics: [],
        outstandingActionItems: [],
        recurringIssues: [],
      },
      participantContext: [],
    };
  }
}

async function generateDiscussionPoints(req: MeetingPreparationRequest, previousMeetings: any[]): Promise<DiscussionPoint[]> {
  const context = {
    participants: req.participants || [],
    topics: req.topics || [],
    meetingType: req.meetingType || "general",
    previousMeetings: previousMeetings.slice(0, 5),
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
        {
          role: "system",
          content: `You are an expert meeting facilitator. Generate thoughtful discussion points and questions that will drive productive conversations based on previous meeting context. Focus on unresolved issues, follow-ups, and strategic discussions. Return only valid JSON.`,
        },
        {
          role: "user",
          content: `Generate discussion points for a ${context.meetingType} meeting.
          
          Participants: ${context.participants.join(", ")}
          Topics: ${context.topics.join(", ")}
          
          Previous meeting context:
          ${context.previousMeetings.map(m => `- ${m.title}: ${m.summary}`).join('\n')}
          
          Generate JSON array of discussion points:
          [
            {
              "question": "specific question or discussion prompt",
              "context": "background information and why this is important",
              "expectedOutcome": "decision|alignment|brainstorm|update",
              "difficulty": "easy|medium|complex",
              "stakeholders": ["participant1", "participant2"]
            }
          ]`,
        },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    }),
  });
  
  if (!response.ok) {
    return [];
  }
  
  const result = await response.json();
  const discussionText = result.choices[0]?.message?.content;
  
  try {
    return JSON.parse(discussionText || "[]");
  } catch {
    return [];
  }
}

async function generateMeetingRecommendations(req: MeetingPreparationRequest, previousMeetings: any[]) {
  const context = {
    participants: req.participants || [],
    topics: req.topics || [],
    meetingType: req.meetingType || "general",
    duration: req.duration || 60,
    previousMeetings: previousMeetings.slice(0, 5),
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
        {
          role: "system",
          content: `You are an expert meeting consultant. Provide strategic recommendations for meeting structure, time management, and success metrics based on previous meeting patterns and best practices. Return only valid JSON.`,
        },
        {
          role: "user",
          content: `Provide meeting recommendations for a ${context.duration}-minute ${context.meetingType} meeting.
          
          Participants: ${context.participants.join(", ")}
          Topics: ${context.topics.join(", ")}
          
          Previous meeting patterns:
          ${context.previousMeetings.map(m => `- ${m.title} (${m.duration}min): ${m.summary.substring(0, 150)}...`).join('\n')}
          
          Generate recommendations in JSON format:
          {
            "meetingStructure": "recommended meeting flow and structure",
            "timeAllocation": {
              "opening": minutes,
              "main_discussion": minutes,
              "decisions": minutes,
              "next_steps": minutes,
              "buffer": minutes
            },
            "preparationTasks": [
              {
                "task": "task description",
                "assignee": "person or null",
                "deadline": "relative deadline like 'day before meeting'"
              }
            ],
            "potentialChallenges": ["challenge1", "challenge2"],
            "successMetrics": ["metric1", "metric2"]
          }`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    }),
  });
  
  if (!response.ok) {
    return {
      meetingStructure: "Standard meeting structure recommended",
      timeAllocation: {
        opening: 5,
        main_discussion: Math.floor((req.duration || 60) * 0.7),
        decisions: Math.floor((req.duration || 60) * 0.15),
        next_steps: Math.floor((req.duration || 60) * 0.1),
        buffer: 5,
      },
      preparationTasks: [],
      potentialChallenges: [],
      successMetrics: [],
    };
  }
  
  const result = await response.json();
  const recommendationsText = result.choices[0]?.message?.content;
  
  try {
    return JSON.parse(recommendationsText || "{}");
  } catch {
    return {
      meetingStructure: "Standard meeting structure recommended",
      timeAllocation: {
        opening: 5,
        main_discussion: Math.floor((req.duration || 60) * 0.7),
        decisions: Math.floor((req.duration || 60) * 0.15),
        next_steps: Math.floor((req.duration || 60) * 0.1),
        buffer: 5,
      },
      preparationTasks: [],
      potentialChallenges: [],
      successMetrics: [],
    };
  }
}

async function identifyMeetingPatterns(meetings: any[]): Promise<MeetingPattern[]> {
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
          content: `You are an expert data analyst specializing in meeting effectiveness. Identify patterns in meeting data including recurring themes, participant behaviors, and outcome patterns. Return only valid JSON.`,
        },
        {
          role: "user",
          content: `Analyze these meetings to identify patterns:
          
          ${meetings.slice(0, 10).map(m => `
          Title: ${m.title}
          Duration: ${m.duration} minutes
          Summary: ${m.summary}
          Tags: ${m.tags.join(", ")}
          Date: ${m.created_at}
          `).join('\n---\n')}
          
          Identify patterns and return JSON array:
          [
            {
              "pattern": "description of the pattern",
              "frequency": number_of_occurrences,
              "participants": ["participant1", "participant2"],
              "averageDuration": average_minutes,
              "commonOutcomes": ["outcome1", "outcome2"],
              "successRate": 0.0_to_1.0,
              "recommendations": ["rec1", "rec2"]
            }
          ]`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });
  
  if (!response.ok) {
    return [];
  }
  
  const result = await response.json();
  const patternsText = result.choices[0]?.message?.content;
  
  try {
    return JSON.parse(patternsText || "[]");
  } catch {
    return [];
  }
}

async function generateMeetingInsights(meetings: any[]) {
  // Calculate basic insights
  const totalDuration = meetings.reduce((sum, m) => sum + m.duration, 0);
  const averageDuration = meetings.length > 0 ? totalDuration / meetings.length : 0;
  
  // Extract meeting types from titles
  const meetingTypes = meetings.map(m => {
    const title = m.title.toLowerCase();
    if (title.includes("standup") || title.includes("daily")) return "Daily Standup";
    if (title.includes("review") || title.includes("retrospective")) return "Review";
    if (title.includes("planning")) return "Planning";
    if (title.includes("1:1")) return "One-on-One";
    return "General Meeting";
  });
  
  const typeFrequency = meetingTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostProductiveMeetingTypes = Object.entries(typeFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type);
  
  // Analyze meeting times
  const meetingHours = meetings.map(m => new Date(m.created_at).getHours());
  const hourFrequency = meetingHours.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const bestTimeSlots = Object.entries(hourFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`);
  
  return {
    mostProductiveMeetingTypes,
    optimalMeetingLength: Math.round(averageDuration),
    bestTimeSlots,
    participantEngagement: {},
    topicEffectiveness: {},
  };
}

async function generatePatternRecommendations(patterns: MeetingPattern[], insights: any): Promise<string[]> {
  const recommendations = [
    `Optimal meeting length appears to be ${insights.optimalMeetingLength} minutes based on your history`,
    `Most productive meeting times: ${insights.bestTimeSlots.join(", ")}`,
    `Focus on ${insights.mostProductiveMeetingTypes.join(", ")} meeting formats for better outcomes`,
  ];
  
  patterns.forEach(pattern => {
    if (pattern.successRate < 0.7) {
      recommendations.push(`Consider restructuring meetings with pattern: "${pattern.pattern}" (${Math.round(pattern.successRate * 100)}% success rate)`);
    }
    
    pattern.recommendations.forEach(rec => {
      recommendations.push(rec);
    });
  });
  
  return recommendations;
}

function calculateTopicRelevance(topics: string[], meetings: any[]): number {
  if (topics.length === 0 || meetings.length === 0) return 0;
  
  let relevantMeetings = 0;
  
  meetings.forEach(meeting => {
    const content = `${meeting.title} ${meeting.summary} ${meeting.tags.join(" ")}`.toLowerCase();
    const hasRelevantTopic = topics.some(topic => content.includes(topic.toLowerCase()));
    if (hasRelevantTopic) relevantMeetings++;
  });
  
  return relevantMeetings / meetings.length;
}

function calculateConfidenceScore(meetingCount: number, req: MeetingPreparationRequest): number {
  let score = 0.5; // Base score
  
  // More meetings = higher confidence
  score += Math.min(meetingCount * 0.05, 0.3);
  
  // Having participants increases confidence
  if (req.participants && req.participants.length > 0) {
    score += 0.1;
  }
  
  // Having topics increases confidence
  if (req.topics && req.topics.length > 0) {
    score += 0.1;
  }
  
  // Having meeting type increases confidence
  if (req.meetingType) {
    score += 0.05;
  }
  
  return Math.min(score, 1.0);
}
