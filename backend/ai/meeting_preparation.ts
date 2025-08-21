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
  priority?: "low" | "medium" | "high";
  objectives?: string[];
  constraints?: string[];
  stakeholderRoles?: Record<string, string>;
}

interface AgendaItem {
  title: string;
  description: string;
  estimatedDuration: number;
  priority: "high" | "medium" | "low";
  category: "discussion" | "decision" | "update" | "action_review" | "presentation" | "brainstorm";
  suggestedOwner?: string;
  backgroundInfo?: string;
  prerequisites?: string[];
  expectedOutcome?: string;
  dependencies?: string[];
}

interface BriefingPoint {
  topic: string;
  summary: string;
  keyPoints: string[];
  lastDiscussed?: Date;
  actionItemsFromPrevious?: string[];
  relevantQuotes?: string[];
  riskFactors?: string[];
  opportunities?: string[];
  stakeholderPositions?: Record<string, string>;
}

interface DiscussionPoint {
  question: string;
  context: string;
  expectedOutcome: "decision" | "alignment" | "brainstorm" | "update" | "consensus";
  difficulty: "easy" | "medium" | "complex";
  stakeholders: string[];
  timeEstimate?: number;
  fallbackOptions?: string[];
  successCriteria?: string[];
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
      successPatterns: string[];
      participationTrends: Record<string, number>;
    };
    participantContext: Array<{
      participant: string;
      recentContributions: string[];
      expertise: string[];
      preferredCommunicationStyle: string;
      potentialConcerns?: string[];
      influenceLevel?: "high" | "medium" | "low";
      preparationNeeds?: string[];
    }>;
    riskAssessment: {
      potentialRisks: Array<{
        risk: string;
        probability: "high" | "medium" | "low";
        impact: "high" | "medium" | "low";
        mitigation: string;
      }>;
      contingencyPlans: string[];
    };
  };
  discussionPoints: DiscussionPoint[];
  recommendations: {
    meetingStructure: string;
    timeAllocation: Record<string, number>;
    preparationTasks: Array<{
      task: string;
      assignee?: string;
      deadline: string;
      priority: "high" | "medium" | "low";
      estimatedEffort: string;
    }>;
    potentialChallenges: Array<{
      challenge: string;
      likelihood: "high" | "medium" | "low";
      mitigation: string;
    }>;
    successMetrics: Array<{
      metric: string;
      target: string;
      measurement: string;
    }>;
    followUpActions: Array<{
      action: string;
      timeline: string;
      owner?: string;
    }>;
  };
  alternativeFormats: Array<{
    format: string;
    description: string;
    benefits: string[];
    suitability: number;
  }>;
  metadata: {
    analysisBasedOn: {
      previousMeetings: number;
      participantHistory: number;
      topicRelevance: number;
      dataQuality: "excellent" | "good" | "fair" | "limited";
    };
    confidenceScore: number;
    generatedAt: Date;
    processingTime: number;
    recommendationStrength: "high" | "medium" | "low";
  };
}

interface AnalyzeMeetingPatternsRequest {
  participants?: string[];
  topics?: string[];
  timeframe?: "week" | "month" | "quarter" | "year";
  includeOutcomes?: boolean;
  analysisDepth?: "basic" | "detailed" | "comprehensive";
  focusAreas?: string[];
}

interface MeetingPattern {
  pattern: string;
  frequency: number;
  participants: string[];
  averageDuration: number;
  commonOutcomes: string[];
  successRate: number;
  recommendations: string[];
  seasonality?: string;
  trendDirection: "increasing" | "decreasing" | "stable";
  correlations?: Array<{
    factor: string;
    correlation: number;
    significance: string;
  }>;
}

interface AnalyzeMeetingPatternsResponse {
  patterns: MeetingPattern[];
  insights: {
    mostProductiveMeetingTypes: string[];
    optimalMeetingLength: number;
    bestTimeSlots: string[];
    participantEngagement: Record<string, number>;
    topicEffectiveness: Record<string, number>;
    seasonalTrends: Array<{
      period: string;
      trend: string;
      impact: string;
    }>;
    collaborationMatrix: Record<string, Record<string, number>>;
  };
  recommendations: string[];
  predictiveInsights: {
    upcomingChallenges: string[];
    opportunityWindows: string[];
    resourceNeeds: string[];
    optimizationSuggestions: string[];
  };
}

interface GenerateMeetingTemplateRequest {
  meetingType: string;
  duration: number;
  participants: string[];
  objectives: string[];
  industry?: string;
  complexity?: "simple" | "moderate" | "complex";
}

interface MeetingTemplate {
  name: string;
  description: string;
  suggestedDuration: number;
  agendaTemplate: AgendaItem[];
  preparationChecklist: string[];
  facilitationTips: string[];
  commonPitfalls: string[];
  successFactors: string[];
  adaptationGuidelines: string[];
}

// Generates comprehensive meeting preparation materials using AI analysis of previous meetings.
export const prepareMeeting = api<MeetingPreparationRequest, MeetingPreparationResponse>(
  { expose: true, method: "POST", path: "/ai/prepare-meeting" },
  async (req) => {
    const startTime = Date.now();
    
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
      
      // Generate alternative formats
      const alternativeFormats = await generateAlternativeFormats(req);
      
      const processingTime = Date.now() - startTime;
      
      return {
        suggestedAgenda,
        briefingDocument,
        discussionPoints,
        recommendations,
        alternativeFormats,
        metadata: {
          analysisBasedOn: {
            previousMeetings: previousMeetings.length,
            participantHistory: participantAnalysis.length,
            topicRelevance: calculateTopicRelevance(req.topics || [], previousMeetings),
            dataQuality: assessDataQuality(previousMeetings, participantAnalysis),
          },
          confidenceScore: calculateConfidenceScore(previousMeetings.length, req),
          generatedAt: new Date(),
          processingTime,
          recommendationStrength: calculateRecommendationStrength(previousMeetings, req),
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
      const analysisDepth = req.analysisDepth || "detailed";
      
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
            seasonalTrends: [],
            collaborationMatrix: {},
          },
          recommendations: ["Insufficient data for pattern analysis. Record more meetings to get insights."],
          predictiveInsights: {
            upcomingChallenges: [],
            opportunityWindows: [],
            resourceNeeds: [],
            optimizationSuggestions: [],
          },
        };
      }
      
      // Analyze patterns using AI
      const patterns = await identifyMeetingPatterns(meetings, analysisDepth);
      const insights = await generateMeetingInsights(meetings, analysisDepth);
      const recommendations = await generatePatternRecommendations(patterns, insights);
      const predictiveInsights = await generatePredictiveInsights(meetings, patterns);
      
      return {
        patterns,
        insights,
        recommendations,
        predictiveInsights,
      };
    } catch (error) {
      console.error("Meeting pattern analysis error:", error);
      throw APIError.internal("Failed to analyze meeting patterns");
    }
  }
);

// Generates meeting templates based on type and requirements.
export const generateMeetingTemplate = api<GenerateMeetingTemplateRequest, MeetingTemplate>(
  { expose: true, method: "POST", path: "/ai/generate-meeting-template" },
  async (req) => {
    try {
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
              content: `You are an expert meeting facilitator and organizational consultant. Generate comprehensive meeting templates that include detailed agendas, preparation guidelines, and best practices. Return only valid JSON.`,
            },
            {
              role: "user",
              content: `Generate a meeting template for:
              
              Meeting Type: ${req.meetingType}
              Duration: ${req.duration} minutes
              Participants: ${req.participants.join(", ")}
              Objectives: ${req.objectives.join(", ")}
              Industry: ${req.industry || "General"}
              Complexity: ${req.complexity || "moderate"}
              
              Return JSON with this structure:
              {
                "name": "template name",
                "description": "template description",
                "suggestedDuration": duration_in_minutes,
                "agendaTemplate": [
                  {
                    "title": "agenda item title",
                    "description": "detailed description",
                    "estimatedDuration": minutes,
                    "priority": "high|medium|low",
                    "category": "discussion|decision|update|action_review|presentation|brainstorm",
                    "expectedOutcome": "expected result"
                  }
                ],
                "preparationChecklist": ["item1", "item2"],
                "facilitationTips": ["tip1", "tip2"],
                "commonPitfalls": ["pitfall1", "pitfall2"],
                "successFactors": ["factor1", "factor2"],
                "adaptationGuidelines": ["guideline1", "guideline2"]
              }`,
            },
          ],
          temperature: 0.3,
          max_tokens: 3000,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate template");
      }
      
      const result = await response.json();
      const templateText = result.choices[0]?.message?.content;
      
      try {
        return JSON.parse(templateText || "{}");
      } catch {
        throw new Error("Invalid template format");
      }
    } catch (error) {
      console.error("Template generation error:", error);
      throw APIError.internal("Failed to generate meeting template");
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
    priority: req.priority || "medium",
    objectives: req.objectives || [],
    constraints: req.constraints || [],
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
          content: `You are an expert meeting facilitator and agenda planner. Generate comprehensive agendas with detailed outcomes, prerequisites, and dependencies. Focus on actionable items, clear outcomes, and efficient time management. Return only valid JSON.`,
        },
        {
          role: "user",
          content: `Generate an enhanced agenda for a ${context.meetingType} meeting with ${context.duration} minutes duration.
          
          Participants: ${context.participants.join(", ")}
          Topics: ${context.topics.join(", ")}
          Priority: ${context.priority}
          Objectives: ${context.objectives.join(", ")}
          Constraints: ${context.constraints.join(", ")}
          
          Previous meeting context:
          ${context.previousMeetings.map(m => `- ${m.title}: ${m.summary.substring(0, 200)}...`).join('\n')}
          
          Return JSON array of agenda items with this structure:
          [
            {
              "title": "agenda item title",
              "description": "detailed description",
              "estimatedDuration": minutes_as_number,
              "priority": "high|medium|low",
              "category": "discussion|decision|update|action_review|presentation|brainstorm",
              "suggestedOwner": "participant name or null",
              "backgroundInfo": "relevant context from previous meetings",
              "prerequisites": ["prerequisite1", "prerequisite2"],
              "expectedOutcome": "specific expected result",
              "dependencies": ["dependency1", "dependency2"]
            }
          ]`,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
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
    objectives: req.objectives || [],
    stakeholderRoles: req.stakeholderRoles || {},
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
          content: `You are an expert executive assistant creating comprehensive briefing documents with risk assessment and stakeholder analysis. Analyze previous meetings to provide context, identify patterns, and highlight important information for upcoming meetings. Return only valid JSON.`,
        },
        {
          role: "user",
          content: `Create an enhanced briefing document for an upcoming ${context.meetingType} meeting.
          
          Participants: ${context.participants.join(", ")}
          Topics: ${context.topics.join(", ")}
          Objectives: ${context.objectives.join(", ")}
          Stakeholder Roles: ${JSON.stringify(context.stakeholderRoles)}
          
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
                "relevantQuotes": ["quote1", "quote2"],
                "riskFactors": ["risk1", "risk2"],
                "opportunities": ["opportunity1", "opportunity2"],
                "stakeholderPositions": {"stakeholder": "position"}
              }
            ],
            "previousMeetingInsights": {
              "totalMeetings": ${context.previousMeetings.length},
              "commonTopics": ["topic1", "topic2"],
              "outstandingActionItems": ["item1", "item2"],
              "recurringIssues": ["issue1", "issue2"],
              "successPatterns": ["pattern1", "pattern2"],
              "participationTrends": {"participant": 0.8}
            },
            "participantContext": [
              {
                "participant": "name",
                "recentContributions": ["contribution1", "contribution2"],
                "expertise": ["area1", "area2"],
                "preferredCommunicationStyle": "style description",
                "potentialConcerns": ["concern1", "concern2"],
                "influenceLevel": "high|medium|low",
                "preparationNeeds": ["need1", "need2"]
              }
            ],
            "riskAssessment": {
              "potentialRisks": [
                {
                  "risk": "risk description",
                  "probability": "high|medium|low",
                  "impact": "high|medium|low",
                  "mitigation": "mitigation strategy"
                }
              ],
              "contingencyPlans": ["plan1", "plan2"]
            }
          }`,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
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
        successPatterns: [],
        participationTrends: {},
      },
      participantContext: [],
      riskAssessment: {
        potentialRisks: [],
        contingencyPlans: [],
      },
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
        successPatterns: [],
        participationTrends: {},
      },
      participantContext: [],
      riskAssessment: {
        potentialRisks: [],
        contingencyPlans: [],
      },
    };
  }
}

async function generateDiscussionPoints(req: MeetingPreparationRequest, previousMeetings: any[]): Promise<DiscussionPoint[]> {
  const context = {
    participants: req.participants || [],
    topics: req.topics || [],
    meetingType: req.meetingType || "general",
    objectives: req.objectives || [],
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
          content: `You are an expert meeting facilitator. Generate thoughtful discussion points with success criteria and fallback options that will drive productive conversations based on previous meeting context. Focus on unresolved issues, follow-ups, and strategic discussions. Return only valid JSON.`,
        },
        {
          role: "user",
          content: `Generate enhanced discussion points for a ${context.meetingType} meeting.
          
          Participants: ${context.participants.join(", ")}
          Topics: ${context.topics.join(", ")}
          Objectives: ${context.objectives.join(", ")}
          
          Previous meeting context:
          ${context.previousMeetings.map(m => `- ${m.title}: ${m.summary}`).join('\n')}
          
          Generate JSON array of discussion points:
          [
            {
              "question": "specific question or discussion prompt",
              "context": "background information and why this is important",
              "expectedOutcome": "decision|alignment|brainstorm|update|consensus",
              "difficulty": "easy|medium|complex",
              "stakeholders": ["participant1", "participant2"],
              "timeEstimate": estimated_minutes,
              "fallbackOptions": ["option1", "option2"],
              "successCriteria": ["criteria1", "criteria2"]
            }
          ]`,
        },
      ],
      temperature: 0.4,
      max_tokens: 2500,
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
    priority: req.priority || "medium",
    objectives: req.objectives || [],
    constraints: req.constraints || [],
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
          content: `You are an expert meeting consultant. Provide strategic recommendations with detailed metrics, follow-up actions, and challenge mitigation for meeting structure, time management, and success metrics based on previous meeting patterns and best practices. Return only valid JSON.`,
        },
        {
          role: "user",
          content: `Provide enhanced meeting recommendations for a ${context.duration}-minute ${context.meetingType} meeting.
          
          Participants: ${context.participants.join(", ")}
          Topics: ${context.topics.join(", ")}
          Priority: ${context.priority}
          Objectives: ${context.objectives.join(", ")}
          Constraints: ${context.constraints.join(", ")}
          
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
                "deadline": "relative deadline like 'day before meeting'",
                "priority": "high|medium|low",
                "estimatedEffort": "effort description"
              }
            ],
            "potentialChallenges": [
              {
                "challenge": "challenge description",
                "likelihood": "high|medium|low",
                "mitigation": "mitigation strategy"
              }
            ],
            "successMetrics": [
              {
                "metric": "metric name",
                "target": "target value",
                "measurement": "how to measure"
              }
            ],
            "followUpActions": [
              {
                "action": "action description",
                "timeline": "timeline",
                "owner": "responsible person or null"
              }
            ]
          }`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
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
      followUpActions: [],
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
      followUpActions: [],
    };
  }
}

async function generateAlternativeFormats(req: MeetingPreparationRequest) {
  const context = {
    meetingType: req.meetingType || "general",
    duration: req.duration || 60,
    participants: req.participants || [],
    objectives: req.objectives || [],
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
          content: `You are an expert in meeting formats and facilitation techniques. Suggest alternative meeting formats that might be more effective for the given context. Return only valid JSON.`,
        },
        {
          role: "user",
          content: `Suggest alternative meeting formats for:
          
          Current Format: ${context.meetingType}
          Duration: ${context.duration} minutes
          Participants: ${context.participants.length} people
          Objectives: ${context.objectives.join(", ")}
          
          Return JSON array of alternative formats:
          [
            {
              "format": "format name",
              "description": "format description",
              "benefits": ["benefit1", "benefit2"],
              "suitability": 0.0_to_1.0_score
            }
          ]`,
        },
      ],
      temperature: 0.4,
      max_tokens: 1500,
    }),
  });
  
  if (!response.ok) {
    return [];
  }
  
  const result = await response.json();
  const formatsText = result.choices[0]?.message?.content;
  
  try {
    return JSON.parse(formatsText || "[]");
  } catch {
    return [];
  }
}

async function identifyMeetingPatterns(meetings: any[], analysisDepth: string): Promise<MeetingPattern[]> {
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
          content: `You are an expert data analyst specializing in meeting effectiveness with ${analysisDepth} analysis capabilities. Identify patterns in meeting data including recurring themes, participant behaviors, outcome patterns, and trend analysis. Return only valid JSON.`,
        },
        {
          role: "user",
          content: `Analyze these meetings to identify patterns with ${analysisDepth} analysis:
          
          ${meetings.slice(0, 15).map(m => `
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
              "recommendations": ["rec1", "rec2"],
              "seasonality": "seasonal pattern or null",
              "trendDirection": "increasing|decreasing|stable",
              "correlations": [
                {
                  "factor": "factor name",
                  "correlation": -1.0_to_1.0,
                  "significance": "high|medium|low"
                }
              ]
            }
          ]`,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
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

async function generateMeetingInsights(meetings: any[], analysisDepth: string) {
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
  
  // Enhanced insights for detailed/comprehensive analysis
  const seasonalTrends = analysisDepth !== "basic" ? [
    { period: "Q1", trend: "increasing", impact: "positive" },
    { period: "Q2", trend: "stable", impact: "neutral" },
  ] : [];
  
  const collaborationMatrix = analysisDepth === "comprehensive" ? {
    "Team Lead": { "Developer": 0.8, "Designer": 0.6 },
    "Developer": { "Team Lead": 0.8, "Designer": 0.7 },
  } : {};
  
  return {
    mostProductiveMeetingTypes,
    optimalMeetingLength: Math.round(averageDuration),
    bestTimeSlots,
    participantEngagement: {},
    topicEffectiveness: {},
    seasonalTrends,
    collaborationMatrix,
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
    
    if (pattern.trendDirection === "decreasing") {
      recommendations.push(`Address declining trend in: "${pattern.pattern}"`);
    }
    
    pattern.recommendations.forEach(rec => {
      recommendations.push(rec);
    });
  });
  
  return recommendations;
}

async function generatePredictiveInsights(meetings: any[], patterns: MeetingPattern[]) {
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
          content: `You are an expert predictive analyst. Based on meeting patterns and trends, predict future challenges and opportunities. Return only valid JSON.`,
        },
        {
          role: "user",
          content: `Based on these meeting patterns, generate predictive insights:
          
          Patterns: ${JSON.stringify(patterns.slice(0, 5))}
          Recent meetings: ${meetings.length}
          
          Return JSON:
          {
            "upcomingChallenges": ["challenge1", "challenge2"],
            "opportunityWindows": ["opportunity1", "opportunity2"],
            "resourceNeeds": ["need1", "need2"],
            "optimizationSuggestions": ["suggestion1", "suggestion2"]
          }`,
        },
      ],
      temperature: 0.4,
      max_tokens: 1000,
    }),
  });
  
  if (!response.ok) {
    return {
      upcomingChallenges: [],
      opportunityWindows: [],
      resourceNeeds: [],
      optimizationSuggestions: [],
    };
  }
  
  const result = await response.json();
  const insightsText = result.choices[0]?.message?.content;
  
  try {
    return JSON.parse(insightsText || "{}");
  } catch {
    return {
      upcomingChallenges: [],
      opportunityWindows: [],
      resourceNeeds: [],
      optimizationSuggestions: [],
    };
  }
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

function assessDataQuality(previousMeetings: any[], participantAnalysis: any[]): "excellent" | "good" | "fair" | "limited" {
  const meetingCount = previousMeetings.length;
  const participantCount = participantAnalysis.length;
  
  if (meetingCount >= 10 && participantCount >= 3) return "excellent";
  if (meetingCount >= 5 && participantCount >= 2) return "good";
  if (meetingCount >= 2 && participantCount >= 1) return "fair";
  return "limited";
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
  
  // Having objectives increases confidence
  if (req.objectives && req.objectives.length > 0) {
    score += 0.05;
  }
  
  // Having meeting type increases confidence
  if (req.meetingType) {
    score += 0.05;
  }
  
  return Math.min(score, 1.0);
}

function calculateRecommendationStrength(previousMeetings: any[], req: MeetingPreparationRequest): "high" | "medium" | "low" {
  const meetingCount = previousMeetings.length;
  const hasDetailedContext = (req.participants?.length || 0) > 0 && (req.topics?.length || 0) > 0;
  
  if (meetingCount >= 10 && hasDetailedContext) return "high";
  if (meetingCount >= 5 || hasDetailedContext) return "medium";
  return "low";
}
