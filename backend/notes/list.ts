import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { notesDB } from "./db";
import type { ListNotesResponse } from "./types";

interface ListNotesParams {
  search?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
  tags?: Query<string>;
  projectId?: Query<number>;
}

function buildWhereClause(
  opts: {
    search?: string;
    tags: string[];
    projectId?: number;
    userId: string;
  },
  paramStart: number
) {
  const conditions: string[] = [`user_id = $${paramStart}`];
  const params: any[] = [opts.userId];
  let idx = paramStart + 1;

  if (opts.search) {
    conditions.push(
      `to_tsvector('english', title || ' ' || transcript) @@ plainto_tsquery('english', $${idx})`
    );
    params.push(opts.search);
    idx++;
  }

  if (opts.tags.length > 0) {
    conditions.push(`tags && $${idx}`);
    params.push(opts.tags);
    idx++;
  }

  if (opts.projectId) {
    conditions.push(`project_id = $${idx}`);
    params.push(opts.projectId);
    idx++;
  }

  return { clause: `WHERE ${conditions.join(" AND ")}`, params };
}

// Retrieves all notes with optional search and pagination.
export const listNotes = api<ListNotesParams, ListNotesResponse>(
  { auth: true, expose: true, method: "GET", path: "/notes" },
  async (params) => {
    const auth = getAuthData()!;
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    const search = params.search?.trim();
    const tags = params.tags?.split(",").filter(Boolean) || [];
    const projectId = params.projectId;

    // Build where clauses separately to ensure correct parameter indexing
    const countWhere = buildWhereClause({ search, tags, projectId, userId: auth.userID }, 1);
    const notesWhere = buildWhereClause({ search, tags, projectId, userId: auth.userID }, 3);

    const countQuery = `SELECT COUNT(*) as total FROM notes ${countWhere.clause}`;
    const notesQuery = `
      SELECT id, title, transcript, summary, duration, original_language, translated, 
             is_public, tags, project_id, user_id, created_at, updated_at, diarization_data
      FROM notes ${notesWhere.clause}
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;

    const [countResult, notesResult] = await Promise.all([
      notesDB.rawQueryRow<{ total: number }>(countQuery, ...countWhere.params),
      notesDB.rawQueryAll<{
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
      }>(notesQuery, limit, offset, ...notesWhere.params),
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
      isPublic: row.is_public,
      tags: row.tags,
      projectId: row.project_id || undefined,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      diarizationData: row.diarization_data,
    }));

    return { notes, total };
  }
);
