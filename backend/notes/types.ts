export interface DiarizedSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

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
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  diarizationData?: DiarizedSegment[];
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
  diarizationData?: DiarizedSegment[];
}

export interface UpdateNoteRequest {
  id: number;
  title?: string;
  transcript?: string;
  summary?: string;
  tags?: string[];
  isPublic?: boolean;
  projectId?: number;
  diarizationData?: DiarizedSegment[];
}

export interface ListNotesResponse {
  notes: Note[];
  total: number;
}
