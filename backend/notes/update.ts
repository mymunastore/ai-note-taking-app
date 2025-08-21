import { api, APIError } from "encore.dev/api";
import { notesDB } from "./db";
import type { UpdateNoteRequest, Note } from "./types";

// Updates an existing note.
export const update = api<UpdateNoteRequest, Note>(
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

    if (updates.length === 0) {
      throw APIError.invalidArgument("no fields to update");
    }

    updates.push(`updated_at = NOW()`);
    params.push(req.id);

    const query = `
      UPDATE notes 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, title, transcript, summary, duration, created_at, updated_at
    `;

    const row = await notesDB.rawQueryRow<{
      id: number;
      title: string;
      transcript: string;
      summary: string;
      duration: number;
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
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
);
