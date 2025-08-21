import { api, APIError } from "encore.dev/api";
import { notesDB } from "./db";
import type { Note } from "./types";

interface GetNoteParams {
  id: number;
}

// Retrieves a specific note by ID.
export const get = api<GetNoteParams, Note>(
  { expose: true, method: "GET", path: "/notes/:id" },
  async (params) => {
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
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, title, transcript, summary, duration, original_language, translated, 
             is_public, tags, project_id, created_at, updated_at
      FROM notes
      WHERE id = ${params.id}
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
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
);
