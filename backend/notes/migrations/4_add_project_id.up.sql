ALTER TABLE notes ADD COLUMN project_id BIGINT;
CREATE INDEX idx_notes_project_id ON notes(project_id);
