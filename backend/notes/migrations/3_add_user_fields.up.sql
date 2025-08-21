ALTER TABLE notes 
ADD COLUMN is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN tags TEXT[] DEFAULT '{}';

CREATE INDEX idx_notes_tags ON notes USING gin(tags);
