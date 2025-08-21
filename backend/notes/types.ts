export interface Note {
  id: number;
  title: string;
  transcript: string;
  summary: string;
  duration: number;
  originalLanguage?: string;
  translated?: boolean;
  userId: string;
  organizationId?: string;
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

export interface ListNotesRequest {
  search?: string;
  limit?: number;
  offset?: number;
  tags?: string;
  organizationOnly?: boolean;
  projectId?: number;
}

export interface ListNotesResponse {
  notes: Note[];
  total: number;
}

export interface TranscribeRequest {
  audioBase64: string;
}

export interface TranscribeResponse {
  transcript: string;
  originalLanguage?: string;
  translated?: boolean;
}

export interface SummarizeRequest {
  transcript: string;
  length?: "short" | "medium" | "long";
  format?: "paragraph" | "bullets";
}

export interface SummarizeResponse {
  summary: string;
}

export interface ChatRequest {
  message: string;
  context?: string;
  chatHistory?: Array<{ role: "USER" | "CHATBOT"; message: string }>;
}

export interface ChatResponse {
  response: string;
}
