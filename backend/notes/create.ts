import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { notesDB } from "./db";
import type { CreateNoteRequest, Note } from "./types";

// Creates a new note with transcript and summary.
export const create = api<CreateNoteRequest, Note>(
  { expose: true, method: "POST", path: "/notes", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    const row = await notesDB.queryRow<{
      id: number;
      title: string;
      transcript: string;
      summary: string;
      duration: number;
      original_language: string | null;
      translated: boolean | null;
      user_id: string;
      organization_id: string | null;
      is_public: boolean;
      tags: string[];
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO notes (title, transcript, summary, duration, original_language, translated, user_id, organization_id, is_public, tags)
      VALUES (${req.title}, ${req.transcript}, ${req.summary}, ${req.duration}, ${req.originalLanguage || null}, ${req.translated || false}, ${auth.userID}, ${auth.organizationId || null}, ${req.isPublic || false}, ${req.tags || []})
      RETURNING id, title, transcript, summary, duration, original_language, translated, user_id, organization_id, is_public, tags, created_at, updated_at
    `;

    if (!row) {
      throw new Error("Failed to create note");
    }

    return {
      id: row.id,
      title: row.title,
      transcript: row.transcript,
      summary: row.summary,
      duration: row.duration,
      originalLanguage: row.original_language || undefined,
      translated: row.translated || undefined,
      userId: row.user_id,
      organizationId: row.organization_id || undefined,
      isPublic: row.is_public,
      tags: row.tags,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
);
