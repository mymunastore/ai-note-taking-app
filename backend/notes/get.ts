import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { notesDB } from "./db";
import type { Note } from "./types";

interface GetNoteParams {
  id: number;
}

// Retrieves a specific note by ID.
export const getNote = api<GetNoteParams, Note>(
  { auth: true, expose: true, method: "GET", path: "/notes/:id" },
  async (params) => {
    const auth = getAuthData()!;
    
    const row = await notesDB.queryRow<{
      id: number;
      title: string;
      transcript: string;
      summary: string;
      duration: number;
      original_language: string | null;
      translated: boolean | null;
      is_public: boolean;
      tags: string[];
      project_id: number | null;
      user_id: string;
      created_at: Date;
      updated_at: Date;
      diarization_data: any;
    }>`
      SELECT id, title, transcript, summary, duration, original_language, translated, 
             is_public, tags, project_id, user_id, created_at, updated_at, diarization_data
      FROM notes
      WHERE id = ${params.id} AND (user_id = ${auth.userID} OR is_public = true)
    `;

    if (!row) {
      throw APIError.notFound("note not found");
    }

    return {
      id: row.id,
      title: row.title,
      transcript: row.transcript,
      summary: row.summary,
      duration: row.duration,
      originalLanguage: row.original_language || undefined,
      translated: row.translated || undefined,
      isPublic: row.is_public,
      tags: row.tags,
      projectId: row.project_id || undefined,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      diarizationData: row.diarization_data,
    };
  }
);
