import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { notesDB } from "./db";
import type { UpdateNoteRequest, Note } from "./types";

// Updates an existing note.
export const updateNote = api<UpdateNoteRequest, Note>(
  { auth: true, expose: true, method: "PUT", path: "/notes/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    // Verify ownership
    const existingNote = await notesDB.queryRow<{ user_id: string }>`
      SELECT user_id FROM notes WHERE id = ${req.id}
    `;
    
    if (!existingNote) {
      throw APIError.notFound("Note not found");
    }
    
    if (existingNote.user_id !== auth.userID) {
      throw APIError.permissionDenied("You can only update your own notes");
    }
    
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

    if (req.diarizationData !== undefined) {
      updates.push(`diarization_data = $${paramIndex++}`);
      params.push(JSON.stringify(req.diarizationData));
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
                is_public, tags, project_id, user_id, created_at, updated_at, diarization_data
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
      user_id: string;
      created_at: Date;
      updated_at: Date;
      diarization_data: any;
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
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      diarizationData: row.diarization_data,
    };
  }
);
