import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

const openAIKey = secret("OpenAIKey");

interface WorkflowTrigger {
  type: "keyword" | "sentiment" | "speaker" | "duration" | "topic" | "action_item";
  condition: string;
  value?: string | number;
}

interface WorkflowAction {
  type: "email" | "slack" | "calendar" | "task" | "webhook" | "ai_analysis";
  config: Record<string, any>;
}

interface CreateWorkflowRequest {
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  enabled: boolean;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  enabled: boolean;
  created_at: Date;
  last_triggered?: Date;
  execution_count: number;
}

interface ExecuteWorkflowRequest {
  workflowId: string;
  context: {
    transcript: string;
    summary: string;
    metadata: Record<string, any>;
  };
}

interface WorkflowExecutionResult {
  success: boolean;
  triggered_workflows: string[];
  actions_executed: Array<{
    action_type: string;
    success: boolean;
    result?: any;
    error?: string;
  }>;
}

interface SmartTemplateRequest {
  type: "email" | "summary" | "action_plan" | "follow_up" | "report";
  context: {
    transcript: string;
    summary: string;
    participants?: string[];
    meeting_type?: string;
    custom_instructions?: string;
  };
  tone?: "professional" | "casual" | "urgent" | "friendly";
  length?: "brief" | "detailed" | "comprehensive";
}

interface SmartTemplateResponse {
  content: string;
  subject?: string;
  metadata: {
    word_count: number;
    estimated_reading_time: number;
    tone_analysis: string;
  };
}

// In-memory storage for demo (in production, use database)
const workflows: Map<string, Workflow> = new Map();

// Creates a new automated workflow with triggers and actions.
export const createWorkflow = api<CreateWorkflowRequest, Workflow>(
  { expose: true, method: "POST", path: "/ai/workflows" },
  async (req) => {
    try {
      const workflow: Workflow = {
        id: `workflow_${Date.now()}`,
        name: req.name,
        description: req.description,
        triggers: req.triggers,
        actions: req.actions,
        enabled: req.enabled,
        created_at: new Date(),
        execution_count: 0
      };

      workflows.set(workflow.id, workflow);
      return workflow;

    } catch (error) {
      console.error("Create workflow error:", error);
      throw APIError.internal("Failed to create workflow");
    }
  }
);

// Executes workflows based on meeting content and triggers.
export const executeWorkflows = api<ExecuteWorkflowRequest, WorkflowExecutionResult>(
  { expose: true, method: "POST", path: "/ai/workflows/execute" },
  async (req) => {
    try {
      const triggeredWorkflows: string[] = [];
      const actionsExecuted: Array<{
        action_type: string;
        success: boolean;
        result?: any;
        error?: string;
      }> = [];

      // Check all enabled workflows
      for (const [workflowId, workflow] of workflows) {
        if (!workflow.enabled) continue;

        const shouldTrigger = await evaluateWorkflowTriggers(workflow.triggers, req.context);
        
        if (shouldTrigger) {
          triggeredWorkflows.push(workflow.name);
          
          // Execute workflow actions
          for (const action of workflow.actions) {
            try {
              const result = await executeWorkflowAction(action, req.context);
              actionsExecuted.push({
                action_type: action.type,
                success: true,
                result
              });
            } catch (error) {
              actionsExecuted.push({
                action_type: action.type,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
              });
            }
          }

          // Update workflow execution count
          workflow.execution_count++;
          workflow.last_triggered = new Date();
          workflows.set(workflowId, workflow);
        }
      }

      return {
        success: true,
        triggered_workflows: triggeredWorkflows,
        actions_executed: actionsExecuted
      };

    } catch (error) {
      console.error("Execute workflows error:", error);
      throw APIError.internal("Failed to execute workflows");
    }
  }
);

// Generates smart templates for various communication needs.
export const generateSmartTemplate = api<SmartTemplateRequest, SmartTemplateResponse>(
  { expose: true, method: "POST", path: "/ai/smart-template" },
  async (req) => {
    try {
      const templates = {
        email: {
          system: "You are an expert at writing professional emails based on meeting content. Create clear, actionable emails that summarize key points and next steps.",
          prompt: `Generate a professional email based on this meeting content. Include a clear subject line and well-structured body.`
        },
        summary: {
          system: "You are an expert at creating executive summaries. Create concise, high-level summaries that highlight the most important information for leadership.",
          prompt: `Create an executive summary that captures the key decisions, outcomes, and next steps from this meeting.`
        },
        action_plan: {
          system: "You are an expert project manager. Create detailed action plans with clear tasks, owners, and timelines.",
          prompt: `Generate a comprehensive action plan based on the decisions and commitments made in this meeting.`
        },
        follow_up: {
          system: "You are an expert at creating follow-up communications. Generate messages that ensure accountability and progress tracking.",
          prompt: `Create a follow-up message that tracks progress on action items and maintains momentum from the meeting.`
        },
        report: {
          system: "You are an expert at creating detailed reports. Generate comprehensive reports that document all aspects of the meeting.",
          prompt: `Create a detailed meeting report that documents all discussions, decisions, and outcomes.`
        }
      };

      const template = templates[req.type];
      if (!template) {
        throw APIError.invalidArgument("Invalid template type");
      }

      const toneInstructions = {
        professional: "Use a professional, formal tone appropriate for business communications.",
        casual: "Use a casual, friendly tone while maintaining professionalism.",
        urgent: "Use an urgent tone that conveys importance and need for quick action.",
        friendly: "Use a warm, friendly tone that builds rapport and collaboration."
      };

      const lengthInstructions = {
        brief: "Keep the content concise and to the point, focusing only on essential information.",
        detailed: "Provide comprehensive details while maintaining clarity and structure.",
        comprehensive: "Include all relevant information with thorough explanations and context."
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
              content: `${template.system} ${toneInstructions[req.tone || "professional"]} ${lengthInstructions[req.length || "detailed"]}` 
            },
            { 
              role: "user", 
              content: `${template.prompt}

              Meeting Context:
              - Type: ${req.context.meeting_type || "General Meeting"}
              - Participants: ${req.context.participants?.join(", ") || "Not specified"}
              
              Summary: ${req.context.summary}
              
              Transcript: ${req.context.transcript}
              
              ${req.context.custom_instructions ? `Additional Instructions: ${req.context.custom_instructions}` : ""}
              
              ${req.type === "email" ? "Format as: Subject: [subject line]\n\n[email body]" : ""}` 
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw APIError.internal("Failed to generate template");
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content || "";
      
      let subject: string | undefined;
      let body = content;

      // Extract subject line for emails
      if (req.type === "email" && content.includes("Subject:")) {
        const lines = content.split("\n");
        const subjectLine = lines.find(line => line.startsWith("Subject:"));
        if (subjectLine) {
          subject = subjectLine.replace("Subject:", "").trim();
          body = lines.slice(lines.indexOf(subjectLine) + 1).join("\n").trim();
        }
      }

      const wordCount = body.split(/\s+/).length;
      const estimatedReadingTime = Math.ceil(wordCount / 200);

      return {
        content: body,
        subject,
        metadata: {
          word_count: wordCount,
          estimated_reading_time: estimatedReadingTime,
          tone_analysis: req.tone || "professional"
        }
      };

    } catch (error) {
      console.error("Generate smart template error:", error);
      throw APIError.internal("Failed to generate smart template");
    }
  }
);

// Lists all workflows.
export const listWorkflows = api<void, { workflows: Workflow[] }>(
  { expose: true, method: "GET", path: "/ai/workflows" },
  async () => {
    return {
      workflows: Array.from(workflows.values())
    };
  }
);

async function evaluateWorkflowTriggers(triggers: WorkflowTrigger[], context: any): Promise<boolean> {
  for (const trigger of triggers) {
    const matches = await evaluateSingleTrigger(trigger, context);
    if (matches) return true; // OR logic - any trigger can activate workflow
  }
  return false;
}

async function evaluateSingleTrigger(trigger: WorkflowTrigger, context: any): Promise<boolean> {
  switch (trigger.type) {
    case "keyword":
      return context.transcript.toLowerCase().includes(trigger.condition.toLowerCase());
    
    case "duration":
      const duration = context.metadata?.duration || 0;
      return evaluateNumericCondition(duration, trigger.condition, trigger.value as number);
    
    case "sentiment":
      // Would integrate with sentiment analysis
      return context.metadata?.sentiment === trigger.condition;
    
    case "speaker":
      return context.transcript.toLowerCase().includes(trigger.condition.toLowerCase());
    
    case "topic":
      return context.summary.toLowerCase().includes(trigger.condition.toLowerCase());
    
    case "action_item":
      return context.summary.toLowerCase().includes("action") || 
             context.summary.toLowerCase().includes("todo") ||
             context.summary.toLowerCase().includes("follow up");
    
    default:
      return false;
  }
}

function evaluateNumericCondition(value: number, condition: string, threshold: number): boolean {
  switch (condition) {
    case "greater_than": return value > threshold;
    case "less_than": return value < threshold;
    case "equals": return value === threshold;
    default: return false;
  }
}

async function executeWorkflowAction(action: WorkflowAction, context: any): Promise<any> {
  switch (action.type) {
    case "email":
      return await executeEmailAction(action.config, context);
    
    case "slack":
      return await executeSlackAction(action.config, context);
    
    case "calendar":
      return await executeCalendarAction(action.config, context);
    
    case "task":
      return await executeTaskAction(action.config, context);
    
    case "webhook":
      return await executeWebhookAction(action.config, context);
    
    case "ai_analysis":
      return await executeAIAnalysisAction(action.config, context);
    
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

async function executeEmailAction(config: any, context: any): Promise<any> {
  // In a real implementation, this would integrate with email service
  return {
    action: "email_sent",
    recipient: config.recipient,
    subject: config.subject || "Meeting Follow-up",
    preview: `Email would be sent to ${config.recipient} with meeting summary`
  };
}

async function executeSlackAction(config: any, context: any): Promise<any> {
  // In a real implementation, this would integrate with Slack API
  return {
    action: "slack_message_sent",
    channel: config.channel,
    preview: `Message would be sent to ${config.channel} with meeting highlights`
  };
}

async function executeCalendarAction(config: any, context: any): Promise<any> {
  // In a real implementation, this would integrate with calendar service
  return {
    action: "calendar_event_created",
    title: config.title || "Follow-up Meeting",
    preview: "Follow-up meeting would be scheduled based on action items"
  };
}

async function executeTaskAction(config: any, context: any): Promise<any> {
  // In a real implementation, this would integrate with task management system
  return {
    action: "task_created",
    title: config.title || "Meeting Follow-up",
    assignee: config.assignee,
    preview: `Task would be created and assigned to ${config.assignee}`
  };
}

async function executeWebhookAction(config: any, context: any): Promise<any> {
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.headers || {})
      },
      body: JSON.stringify({
        event: "meeting_processed",
        context,
        timestamp: new Date().toISOString()
      })
    });

    return {
      action: "webhook_called",
      status: response.status,
      success: response.ok
    };
  } catch (error) {
    throw new Error(`Webhook failed: ${error}`);
  }
}

async function executeAIAnalysisAction(config: any, context: any): Promise<any> {
  // Trigger additional AI analysis
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
          content: config.analysis_prompt || "Analyze this meeting content and provide insights." 
        },
        { 
          role: "user", 
          content: `Summary: ${context.summary}\n\nTranscript: ${context.transcript}` 
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error("AI analysis failed");
  }

  const result = await response.json();
  return {
    action: "ai_analysis_completed",
    analysis: result.choices[0]?.message?.content || "No analysis generated"
  };
}
