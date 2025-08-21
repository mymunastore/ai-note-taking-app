export interface Note {
  id: number;
  title: string;
  transcript: string;
  summary: string;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteRequest {
  title: string;
  transcript: string;
  summary: string;
  duration: number;
}

export interface UpdateNoteRequest {
  id: number;
  title?: string;
  transcript?: string;
  summary?: string;
}

export interface ListNotesRequest {
  search?: string;
  limit?: number;
  offset?: number;
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
}

export interface SummarizeRequest {
  transcript: string;
}

export interface SummarizeResponse {
  summary: string;
}
