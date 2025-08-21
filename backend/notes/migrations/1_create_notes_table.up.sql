CREATE TABLE notes (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  transcript TEXT NOT NULL,
  summary TEXT NOT NULL,
  duration INTEGER NOT NULL,
  original_language TEXT,
  translated BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  project_id BIGINT,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_title ON notes USING gin(to_tsvector('english', title));
CREATE INDEX idx_notes_transcript ON notes USING gin(to_tsvector('english', transcript));
CREATE INDEX idx_notes_tags ON notes USING gin(tags);
CREATE INDEX idx_notes_project_id ON notes(project_id);
CREATE INDEX idx_notes_is_public ON notes(is_public);
