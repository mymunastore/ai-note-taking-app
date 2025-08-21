CREATE TABLE workflows (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE workflow_triggers (
  id BIGSERIAL PRIMARY KEY,
  workflow_id BIGINT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  condition TEXT NOT NULL,
  value_text TEXT,
  value_number DOUBLE PRECISION
);

CREATE TABLE workflow_actions (
  id BIGSERIAL PRIMARY KEY,
  workflow_id BIGINT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_workflows_enabled ON workflows(enabled);
CREATE INDEX idx_workflows_last_triggered ON workflows(last_triggered);
CREATE INDEX idx_workflow_triggers_workflow_id ON workflow_triggers(workflow_id);
CREATE INDEX idx_workflow_actions_workflow_id ON workflow_actions(workflow_id);
