import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { aiDB } from "./db";
import { openAIChat } from "./utils";

const openAIKey = secret("OpenAIKey"); // kept for other potential actions
const makeApiKey = secret("MakeApiKey");
const makeTeamId = secret("MakeTeamId");

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

type DBWorkflowRow = {
  id: number;
  name: string;
  description: string | null;
  enabled: boolean;
  execution_count: number;
  last_triggered: Date | null;
  created_at: Date;
  updated_at: Date;
};

type DBTriggerRow = {
  id: number;
  workflow_id: number;
  type: string;
  condition: string;
  value_text: string | null;
  value_number: number | null;
};

type DBActionRow = {
  id: number;
  workflow_id: number;
  type: string;
  config: any;
};

// Creates a new automated workflow with triggers and actions.
export const createWorkflow = api<CreateWorkflowRequest, Workflow>(
  { expose: true, method: "POST", path: "/ai/workflows" },
  async (req) => {
    try {
      if (!req.name?.trim()) {
        throw APIError.invalidArgument("name is required");
      }
      if (!Array.isArray(req.triggers) || req.triggers.length === 0) {
        throw APIError.invalidArgument("at least one trigger is required");
      }
      if (!Array.isArray(req.actions) || req.actions.length === 0) {
        throw APIError.invalidArgument("at least one action is required");
      }

      const tx = await aiDB.begin();
      try {
        const wf = await tx.rawQueryRow<DBWorkflowRow>(
          `INSERT INTO workflows (name, description, enabled)
           VALUES ($1, $2, $3)
           RETURNING id, name, description, enabled, execution_count, last_triggered, created_at, updated_at`,
          req.name.trim(),
          req.description || null,
          !!req.enabled
        );
        if (!wf) {
          throw APIError.internal("failed to create workflow");
        }

        for (const t of req.triggers) {
          const valueText = typeof t.value === "string" ? t.value : null;
          const valueNumber = typeof t.value === "number" ? t.value : null;
          await tx.rawExec(
            `INSERT INTO workflow_triggers (workflow_id, type, condition, value_text, value_number)
             VALUES ($1, $2, $3, $4, $5)`,
            wf.id,
            t.type,
            t.condition,
            valueText,
            valueNumber
          );
        }

        for (const a of req.actions) {
          await tx.rawExec(
            `INSERT INTO workflow_actions (workflow_id, type, config)
             VALUES ($1, $2, $3)`,
            wf.id,
            a.type,
            a.config || {}
          );
        }

        await tx.commit();

        return {
          id: `workflow_${wf.id}`,
          name: wf.name,
          description: wf.description || "",
          enabled: wf.enabled,
          created_at: wf.created_at,
          last_triggered: wf.last_triggered || undefined,
          execution_count: wf.execution_count,
          triggers: req.triggers,
          actions: req.actions,
        };
      } catch (err) {
        await tx.rollback();
        throw err;
      }
    } catch (error) {
      console.error("Create workflow error:", error);
      if (error instanceof APIError) throw error;
      throw APIError.internal("Failed to create workflow");
    }
  }
);

// Executes workflows based on meeting content and triggers.
export const executeWorkflows = api<ExecuteWorkflowRequest, WorkflowExecutionResult>(
  { expose: true, method: "POST", path: "/ai/workflows/execute" },
  async (req) => {
    try {
      const actionsExecuted: Array<{
        action_type: string;
        success: boolean;
        result?: any;
        error?: string;
      }> = [];
      const triggeredWorkflowNames: string[] = [];

      let workflowFilterId: number | null = null;
      if (req.workflowId && req.workflowId.startsWith("workflow_")) {
        const idNum = parseInt(req.workflowId.replace("workflow_", ""), 10);
        if (!Number.isNaN(idNum)) workflowFilterId = idNum;
      }

      const workflows = await loadWorkflows(workflowFilterId);

      for (const wf of workflows) {
        if (!wf.enabled) continue;

        const shouldTrigger = await evaluateWorkflowTriggers(wf.triggers, req.context);
        if (!shouldTrigger) continue;

        triggeredWorkflowNames.push(wf.name);

        for (const action of wf.actions) {
          try {
            const result = await executeWorkflowAction(action, req.context);
            actionsExecuted.push({
              action_type: action.type,
              success: true,
              result,
            });
          } catch (err: any) {
            actionsExecuted.push({
              action_type: action.type,
              success: false,
              error: err?.message || "Unknown error",
            });
          }
        }

        await aiDB.rawExec(
          `UPDATE workflows
           SET execution_count = execution_count + 1, last_triggered = NOW(), updated_at = NOW()
           WHERE id = $1`,
          parseInt(wf.id.replace("workflow_", ""), 10)
        );
      }

      return {
        success: true,
        triggered_workflows: triggeredWorkflowNames,
        actions_executed: actionsExecuted,
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
          system:
            "You are an expert at writing professional emails based on meeting content. Create clear, actionable emails that summarize key points and next steps.",
          prompt: `Generate a professional email based on this meeting content. Include a clear subject line and well-structured body.`,
        },
        summary: {
          system:
            "You are an expert at creating executive summaries. Create concise, high-level summaries that highlight the most important information for leadership.",
          prompt: `Create an executive summary that captures the key decisions, outcomes, and next steps from this meeting.`,
        },
        action_plan: {
          system:
            "You are an expert project manager. Create detailed action plans with clear tasks, owners, and timelines.",
          prompt: `Generate a comprehensive action plan based on the decisions and commitments made in this meeting.`,
        },
        follow_up: {
          system:
            "You are an expert at creating follow-up communications. Generate messages that ensure accountability and progress tracking.",
          prompt: `Create a follow-up message that tracks progress on action items and maintains momentum from the meeting.`,
        },
        report: {
          system:
            "You are an expert at creating detailed reports. Generate comprehensive reports that document all aspects of the meeting.",
          prompt: `Create a detailed meeting report that documents all discussions, decisions, and outcomes.`,
        },
      } as const;

      const template = templates[req.type];
      if (!template) {
        throw APIError.invalidArgument("Invalid template type");
      }

      const toneInstructions = {
        professional: "Use a professional, formal tone appropriate for business communications.",
        casual: "Use a casual, friendly tone while maintaining professionalism.",
        urgent: "Use an urgent tone that conveys importance and need for quick action.",
        friendly: "Use a warm, friendly tone that builds rapport and collaboration.",
      } as const;

      const lengthInstructions = {
        brief: "Keep the content concise and to the point, focusing only on essential information.",
        detailed: "Provide comprehensive details while maintaining clarity and structure.",
        comprehensive: "Include all relevant information with thorough explanations and context.",
      } as const;

      const content = await openAIChat(
        [
          {
            role: "system",
            content: `${template.system} ${toneInstructions[req.tone || "professional"]} ${
              lengthInstructions[req.length || "detailed"]
            }`,
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
              
${req.type === "email" ? "Format as: Subject: [subject line]\n\n[email body]" : ""}`,
          },
        ],
        { model: "gpt-4o", temperature: 0.3, max_tokens: 2000 }
      );

      let subject: string | undefined;
      let body = content || "";

      if (req.type === "email" && content.includes("Subject:")) {
        const lines = content.split("\n");
        const subjectLine = lines.find((line: string) => line.startsWith("Subject:"));
        if (subjectLine) {
          subject = subjectLine.replace("Subject:", "").trim();
          body = lines.slice(lines.indexOf(subjectLine) + 1).join("\n").trim();
        }
      }

      const wordCount = body.split(/\s+/).filter(Boolean).length;
      const estimatedReadingTime = Math.ceil(wordCount / 200);

      return {
        content: body,
        subject,
        metadata: {
          word_count: wordCount,
          estimated_reading_time: estimatedReadingTime,
          tone_analysis: req.tone || "professional",
        },
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
    const workflows = await loadWorkflows(null);
    return { workflows };
  }
);

async function loadWorkflows(filterId: number | null): Promise<Workflow[]> {
  const wfRows = await aiDB.rawQueryAll<DBWorkflowRow>(
    `SELECT id, name, description, enabled, execution_count, last_triggered, created_at, updated_at
     FROM workflows
     ${filterId ? "WHERE id = $1" : ""}
     ORDER BY created_at DESC`,
    ...(filterId ? ([filterId] as any) : [])
  );

  if (wfRows.length === 0) return [];

  const ids = wfRows.map((w) => w.id);
  const triggersRows = await aiDB.rawQueryAll<DBTriggerRow>(
    `SELECT id, workflow_id, type, condition, value_text, value_number
     FROM workflow_triggers
     WHERE workflow_id = ANY($1::bigint[])`,
    ids
  );

  const actionsRows = await aiDB.rawQueryAll<DBActionRow>(
    `SELECT id, workflow_id, type, config
     FROM workflow_actions
     WHERE workflow_id = ANY($1::bigint[])`,
    ids
  );

  const triggersByWf = new Map<number, WorkflowTrigger[]>();
  for (const tr of triggersRows) {
    const list = triggersByWf.get(tr.workflow_id) || [];
    list.push({
      type: tr.type as WorkflowTrigger["type"],
      condition: tr.condition,
      value: tr.value_number ?? tr.value_text ?? undefined,
    });
    triggersByWf.set(tr.workflow_id, list);
  }

  const actionsByWf = new Map<number, WorkflowAction[]>();
  for (const ar of actionsRows) {
    const list = actionsByWf.get(ar.workflow_id) || [];
    list.push({
      type: ar.type as WorkflowAction["type"],
      config: ar.config || {},
    });
    actionsByWf.set(ar.workflow_id, list);
  }

  return wfRows.map<Workflow>((w) => ({
    id: `workflow_${w.id}`,
    name: w.name,
    description: w.description || "",
    enabled: w.enabled,
    created_at: w.created_at,
    last_triggered: w.last_triggered || undefined,
    execution_count: w.execution_count,
    triggers: triggersByWf.get(w.id) || [],
    actions: actionsByWf.get(w.id) || [],
  }));
}

async function evaluateWorkflowTriggers(triggers: WorkflowTrigger[], context: any): Promise<boolean> {
  for (const trigger of triggers) {
    const matches = await evaluateSingleTrigger(trigger, context);
    if (matches) return true;
  }
  return false;
}

async function evaluateSingleTrigger(trigger: WorkflowTrigger, context: any): Promise<boolean> {
  switch (trigger.type) {
    case "keyword":
      return context.transcript?.toLowerCase?.().includes(trigger.condition.toLowerCase());

    case "duration":
      const duration = context.metadata?.duration || 0;
      return evaluateNumericCondition(duration, trigger.condition, Number(trigger.value || 0));

    case "sentiment":
      return context.metadata?.sentiment === trigger.condition;

    case "speaker":
      return context.transcript?.toLowerCase?.().includes(trigger.condition.toLowerCase());

    case "topic":
      return context.summary?.toLowerCase?.().includes(trigger.condition.toLowerCase());

    case "action_item":
      return (
        context.summary?.toLowerCase?.().includes("action") ||
        context.summary?.toLowerCase?.().includes("todo") ||
        context.summary?.toLowerCase?.().includes("follow up")
      );

    default:
      return false;
  }
}

function evaluateNumericCondition(value: number, condition: string, threshold: number): boolean {
  switch (condition) {
    case "greater_than":
      return value > threshold;
    case "less_than":
      return value < threshold;
    case "equals":
      return value === threshold;
    default:
      return false;
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
  return {
    action: "email_sent",
    recipient: config.recipient,
    subject: config.subject || "Meeting Follow-up",
    preview: `Email would be sent to ${config.recipient} with meeting summary`,
  };
}

async function executeSlackAction(config: any, context: any): Promise<any> {
  return {
    action: "slack_message_sent",
    channel: config.channel,
    preview: `Message would be sent to ${config.channel} with meeting highlights`,
  };
}

async function executeCalendarAction(config: any, context: any): Promise<any> {
  return {
    action: "calendar_event_created",
    title: config.title || "Follow-up Meeting",
  };
}

async function executeTaskAction(config: any, context: any): Promise<any> {
  return {
    action: "task_created",
    title: config.title || "Meeting Follow-up",
    assignee: config.assignee,
  };
}

async function executeWebhookAction(config: any, context: any): Promise<any> {
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.headers || {}),
      },
      body: JSON.stringify({
        event: "meeting_processed",
        context,
        timestamp: new Date().toISOString(),
      }),
    });

    return {
      action: "webhook_called",
      status: response.status,
      success: response.ok,
    };
  } catch (error) {
    throw new Error(`Webhook failed: ${error}`);
  }
}

async function executeAIAnalysisAction(config: any, context: any): Promise<any> {
  const content = await openAIChat(
    [
      {
        role: "system",
        content: config.analysis_prompt || "Analyze this meeting content and provide insights.",
      },
      {
        role: "user",
        content: `Summary: ${context.summary}\n\nTranscript: ${context.transcript}`,
      },
    ],
    { model: "gpt-4o-mini", temperature: 0.3, max_tokens: 500 }
  );

  return {
    action: "ai_analysis_completed",
    analysis: content || "No analysis generated",
  };
}
