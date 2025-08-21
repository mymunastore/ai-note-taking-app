ALTER TABLE notes 
ADD COLUMN user_id TEXT,
ADD COLUMN organization_id TEXT,
ADD COLUMN is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN tags TEXT[] DEFAULT '{}';

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_organization_id ON notes(organization_id);
CREATE INDEX idx_notes_tags ON notes USING gin(tags);
