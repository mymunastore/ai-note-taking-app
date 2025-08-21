export interface Note {
  id: number;
  title: string;
  transcript: string;
  summary: string;
  duration: number;
  originalLanguage?: string;
  translated?: boolean;
  isPublic: boolean;
  tags: string[];
  projectId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteRequest {
  title: string;
  transcript: string;
  summary: string;
  duration: number;
  originalLanguage?: string;
  translated?: boolean;
  isPublic?: boolean;
  tags?: string[];
  projectId?: number;
}

export interface UpdateNoteRequest {
  id: number;
  title?: string;
  transcript?: string;
  summary?: string;
  tags?: string[];
  isPublic?: boolean;
  projectId?: number;
}

export interface ListNotesResponse {
  notes: Note[];
  total: number;
}
