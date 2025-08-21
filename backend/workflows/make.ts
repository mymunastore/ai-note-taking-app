import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

const makeApiKey = secret("MakeApiKey");
const makeTeamId = secret("MakeTeamId");

interface TriggerWorkflowRequest {
  scenarioId: string;
  data: Record<string, any>;
}

interface TriggerWorkflowResponse {
  executionId: string;
  status: string;
}

interface GetExecutionRequest {
  executionId: string;
}

interface GetExecutionResponse {
  executionId: string;
  status: string;
  result?: Record<string, any>;
  error?: string;
}

interface CreateWebhookRequest {
  scenarioId: string;
  name: string;
  url: string;
}

interface CreateWebhookResponse {
  webhookId: string;
  url: string;
}

// Triggers a Make.com workflow scenario.
export const triggerWorkflow = api<TriggerWorkflowRequest, TriggerWorkflowResponse>(
  { expose: true, method: "POST", path: "/workflows/make/trigger" },
  async (req) => {
    try {
      const response = await fetch(`https://hook.integromat.com/${makeTeamId()}/${req.scenarioId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${makeApiKey()}`,
        },
        body: JSON.stringify(req.data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw APIError.internal(`Make.com API error: ${error}`);
      }

      const result = await response.json();
      
      return {
        executionId: result.executionId || Date.now().toString(),
        status: "triggered",
      };
    } catch (error) {
      console.error("Make.com trigger workflow error:", error);
      throw APIError.internal("Failed to trigger Make.com workflow");
    }
  }
);

// Gets the status and result of a workflow execution.
export const getExecution = api<GetExecutionRequest, GetExecutionResponse>(
  { expose: true, method: "GET", path: "/workflows/make/executions/:executionId" },
  async (req) => {
    try {
      const response = await fetch(`https://www.make.com/api/v2/executions/${req.executionId}`, {
        method: "GET",
        headers: {
          "Authorization": `Token ${makeApiKey()}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw APIError.internal(`Make.com API error: ${error}`);
      }

      const execution = await response.json();
      
      return {
        executionId: execution.id,
        status: execution.status,
        result: execution.result,
        error: execution.error,
      };
    } catch (error) {
      console.error("Make.com get execution error:", error);
      throw APIError.internal("Failed to get Make.com execution");
    }
  }
);

// Creates a webhook for Make.com integration.
export const createWebhook = api<CreateWebhookRequest, CreateWebhookResponse>(
  { expose: true, method: "POST", path: "/workflows/make/webhooks" },
  async (req) => {
    try {
      const response = await fetch(`https://www.make.com/api/v2/scenarios/${req.scenarioId}/webhooks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${makeApiKey()}`,
        },
        body: JSON.stringify({
          name: req.name,
          url: req.url,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw APIError.internal(`Make.com API error: ${error}`);
      }

      const webhook = await response.json();
      
      return {
        webhookId: webhook.id,
        url: webhook.url,
      };
    } catch (error) {
      console.error("Make.com create webhook error:", error);
      throw APIError.internal("Failed to create Make.com webhook");
    }
  }
);
