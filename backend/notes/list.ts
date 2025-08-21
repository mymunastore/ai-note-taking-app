import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { notesDB } from "./db";
import type { ListNotesResponse } from "./types";

interface ListNotesParams {
  search?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
}

// Retrieves all notes with optional search and pagination.
export const list = api<ListNotesParams, ListNotesResponse>(
  { expose: true, method: "GET", path: "/notes" },
  async (params) => {
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    const search = params.search?.trim();

    let whereClause = "";
    let searchParam: string | undefined;

    if (search) {
      whereClause = "WHERE to_tsvector('english', title || ' ' || transcript) @@ plainto_tsquery('english', $3)";
      searchParam = search;
    }

    const countQuery = search
      ? `SELECT COUNT(*) as total FROM notes ${whereClause}`
      : `SELECT COUNT(*) as total FROM notes`;

    const notesQuery = search
      ? `SELECT id, title, transcript, summary, duration, original_language, translated, created_at, updated_at 
         FROM notes ${whereClause}
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`
      : `SELECT id, title, transcript, summary, duration, original_language, translated, created_at, updated_at 
         FROM notes 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`;

    const [countResult, notesResult] = await Promise.all([
      search
        ? notesDB.rawQueryRow<{ total: number }>(countQuery, searchParam!)
        : notesDB.rawQueryRow<{ total: number }>(countQuery),
      search
        ? notesDB.rawQueryAll<{
            id: number;
            title: string;
            transcript: string;
            summary: string;
            duration: number;
            original_language: string | null;
            translated: boolean | null;
            created_at: Date;
            updated_at: Date;
          }>(notesQuery, limit, offset, searchParam!)
        : notesDB.rawQueryAll<{
            id: number;
            title: string;
            transcript: string;
            summary: string;
            duration: number;
            original_language: string | null;
            translated: boolean | null;
            created_at: Date;
            updated_at: Date;
          }>(notesQuery, limit, offset),
    ]);

    const total = countResult?.total || 0;
    const notes = notesResult.map((row) => ({
      id: row.id,
      title: row.title,
      transcript: row.transcript,
      summary: row.summary,
      duration: row.duration,
      originalLanguage: row.original_language || undefined,
      translated: row.translated || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { notes, total };
  }
);
