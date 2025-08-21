import { api, APIError } from "encore.dev/api";
import { notesDB } from "./db";
import type { UpdateNoteRequest, Note } from "./types";

// Updates an existing note.
export const updateNote = api<UpdateNoteRequest, Note>(
  { expose: true, method: "PUT", path: "/notes/:id" },
  async (req) => {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (req.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(req.title);
    }

    if (req.transcript !== undefined) {
      updates.push(`transcript = $${paramIndex++}`);
      params.push(req.transcript);
    }

    if (req.summary !== undefined) {
      updates.push(`summary = $${paramIndex++}`);
      params.push(req.summary);
    }

    if (req.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      params.push(req.tags);
    }

    if (req.isPublic !== undefined) {
      updates.push(`is_public = $${paramIndex++}`);
      params.push(req.isPublic);
    }

    if (req.projectId !== undefined) {
      updates.push(`project_id = $${paramIndex++}`);
      params.push(req.projectId);
    }

    if (updates.length === 0) {
      throw APIError.invalidArgument("no fields to update");
    }

    updates.push(`updated_at = NOW()`);
    params.push(req.id);

    const query = `
      UPDATE notes 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, title, transcript, summary, duration, original_language, translated,
                is_public, tags, project_id, created_at, updated_at
    `;

    const row = await notesDB.rawQueryRow<{
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
    }>(query, ...params);

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
