import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { notesDB } from "./db";
import type { Note } from "./types";

interface SearchNotesParams {
  query: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
  filters?: Query<string>; // JSON string of filters
}

interface SearchNotesResponse {
  notes: Note[];
  total: number;
  suggestions: string[];
}

function buildWhereClause(
  query: string,
  filters: any,
  paramStart: number
) {
  const conditions: string[] = ["1=1"];
  const params: any[] = [];
  let idx = paramStart;

  if (filters.dateFrom) {
    conditions.push(`created_at >= $${idx}`);
    params.push(new Date(filters.dateFrom));
    idx++;
  }

  if (filters.dateTo) {
    conditions.push(`created_at <= $${idx}`);
    params.push(new Date(filters.dateTo));
    idx++;
  }

  if (filters.minDuration) {
    conditions.push(`duration >= $${idx}`);
    params.push(filters.minDuration);
    idx++;
  }

  if (filters.maxDuration) {
    conditions.push(`duration <= $${idx}`);
    params.push(filters.maxDuration);
    idx++;
  }

  if (filters.language) {
    conditions.push(`original_language = $${idx}`);
    params.push(filters.language);
    idx++;
  }

  if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
    conditions.push(`tags && $${idx}`);
    params.push(filters.tags);
    idx++;
  }

  const plainQueryPos = idx;
  const likeQueryPos = idx + 1;

  const searchCondition = `
    (
      to_tsvector('english', title || ' ' || transcript || ' ' || summary) @@ plainto_tsquery('english', $${plainQueryPos})
      OR title ILIKE $${likeQueryPos}
      OR transcript ILIKE $${likeQueryPos}
      OR summary ILIKE $${likeQueryPos}
    )
  `;

  conditions.push(searchCondition);
  params.push(query);
  params.push(`%${query}%`);

  return {
    clause: `WHERE ${conditions.join(" AND ")}`,
    params,
    plainQueryPos,
  };
}

// Advanced search across notes with semantic search capabilities.
export const searchNotes = api<SearchNotesParams, SearchNotesResponse>(
  { expose: true, method: "GET", path: "/notes/search" },
  async (params) => {
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    const query = params.query?.trim();
    
    if (!query) {
      return { notes: [], total: 0, suggestions: [] };
    }

    try {
      // Parse filters if provided
      let filters: any = {};
      if (params.filters) {
        try {
          filters = JSON.parse(params.filters);
        } catch (e) {
          // Ignore invalid filter JSON
        }
      }

      const countWhere = buildWhereClause(query, filters, 1);
      const listWhere = buildWhereClause(query, filters, 3);

      const searchQuery = `
        SELECT 
          id, title, transcript, summary, duration, original_language, translated,
          is_public, tags, project_id, created_at, updated_at,
          ts_rank(
            to_tsvector('english', title || ' ' || transcript || ' ' || summary),
            plainto_tsquery('english', $${listWhere.params.length - 1})
          ) as rank
        FROM notes ${listWhere.clause}
        ORDER BY rank DESC, created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const countQuery = `SELECT COUNT(*) as total FROM notes ${countWhere.clause}`;

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
          created_at: Date;
          updated_at: Date;
          rank: number;
        }>(searchQuery, limit, offset, ...listWhere.params),
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
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      // Generate search suggestions based on existing content
      const suggestionsQuery = `
        SELECT DISTINCT t.tag as suggestion
        FROM notes, unnest(tags) as t(tag)
        WHERE t.tag ILIKE $1
        LIMIT 5
      `;

      const suggestionsResult = await notesDB.rawQueryAll<{ suggestion: string }>(
        suggestionsQuery,
        `%${query}%`
      );

      const suggestions = suggestionsResult.map(row => row.suggestion);

      return { notes, total, suggestions };

    } catch (error) {
      console.error("Search error:", error);
      return { notes: [], total: 0, suggestions: [] };
    }
  }
);
