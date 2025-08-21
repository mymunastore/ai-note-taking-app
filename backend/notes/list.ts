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
  organizationOnly?: Query<boolean>;
  projectId?: Query<number>;
}

// Retrieves all notes with optional search and pagination.
export const list = api<ListNotesParams, ListNotesResponse>(
  { expose: true, method: "GET", path: "/notes", auth: true },
  async (params) => {
    const auth = getAuthData()!;
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    const search = params.search?.trim();
    const tags = params.tags?.split(",").filter(Boolean) || [];
    const organizationOnly = params.organizationOnly || false;
    const projectId = params.projectId;

    let whereConditions = ["(user_id = $3 OR is_public = true)"];
    let queryParams: any[] = [limit, offset, auth.userID];
    let paramIndex = 4;

    // Add organization filter if requested and user has organization
    if (organizationOnly && auth.organizationId) {
      whereConditions = ["organization_id = $3"];
      queryParams = [limit, offset, auth.organizationId];
      paramIndex = 4;
    }

    // Add search condition
    if (search) {
      whereConditions.push(`to_tsvector('english', title || ' ' || transcript) @@ plainto_tsquery('english', $${paramIndex})`);
      queryParams.push(search);
      paramIndex++;
    }

    // Add tags filter
    if (tags.length > 0) {
      whereConditions.push(`tags && $${paramIndex}`);
      queryParams.push(tags);
      paramIndex++;
    }

    // Add project filter
    if (projectId) {
      whereConditions.push(`project_id = $${paramIndex}`);
      queryParams.push(projectId);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    const countQuery = `SELECT COUNT(*) as total FROM notes ${whereClause}`;
    const notesQuery = `
      SELECT id, title, transcript, summary, duration, original_language, translated, 
             user_id, organization_id, is_public, tags, project_id, created_at, updated_at 
      FROM notes ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;

    const [countResult, notesResult] = await Promise.all([
      notesDB.rawQueryRow<{ total: number }>(countQuery, ...queryParams.slice(2)),
      notesDB.rawQueryAll<{
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
        project_id: number | null;
        created_at: Date;
        updated_at: Date;
      }>(notesQuery, ...queryParams),
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
      userId: row.user_id,
      organizationId: row.organization_id || undefined,
      isPublic: row.is_public,
      tags: row.tags,
      projectId: row.project_id || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { notes, total };
  }
);
