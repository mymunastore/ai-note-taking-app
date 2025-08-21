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

      let whereConditions = ["1=1"];
      let queryParams: any[] = [limit, offset];
      let paramIndex = 3;

      // Add date range filter
      if (filters.dateFrom) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        queryParams.push(new Date(filters.dateFrom));
        paramIndex++;
      }

      if (filters.dateTo) {
        whereConditions.push(`created_at <= $${paramIndex}`);
        queryParams.push(new Date(filters.dateTo));
        paramIndex++;
      }

      // Add duration filter
      if (filters.minDuration) {
        whereConditions.push(`duration >= $${paramIndex}`);
        queryParams.push(filters.minDuration);
        paramIndex++;
      }

      if (filters.maxDuration) {
        whereConditions.push(`duration <= $${paramIndex}`);
        queryParams.push(filters.maxDuration);
        paramIndex++;
      }

      // Add language filter
      if (filters.language) {
        whereConditions.push(`original_language = $${paramIndex}`);
        queryParams.push(filters.language);
        paramIndex++;
      }

      // Add tags filter
      if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
        whereConditions.push(`tags && $${paramIndex}`);
        queryParams.push(filters.tags);
        paramIndex++;
      }

      // Full-text search with ranking
      const searchCondition = `
        (
          to_tsvector('english', title || ' ' || transcript || ' ' || summary) @@ plainto_tsquery('english', $${paramIndex})
          OR title ILIKE $${paramIndex + 1}
          OR transcript ILIKE $${paramIndex + 1}
          OR summary ILIKE $${paramIndex + 1}
        )
      `;
      whereConditions.push(searchCondition);
      queryParams.push(query);
      queryParams.push(`%${query}%`);
      paramIndex += 2;

      const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

      // Search query with relevance ranking
      const searchQuery = `
        SELECT 
          id, title, transcript, summary, duration, original_language, translated,
          is_public, tags, project_id, created_at, updated_at,
          ts_rank(to_tsvector('english', title || ' ' || transcript || ' ' || summary), plainto_tsquery('english', $${queryParams.indexOf(query) + 1})) as rank
        FROM notes ${whereClause}
        ORDER BY rank DESC, created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const countQuery = `SELECT COUNT(*) as total FROM notes ${whereClause}`;

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
          is_public: boolean;
          tags: string[];
          project_id: number | null;
          created_at: Date;
          updated_at: Date;
          rank: number;
        }>(searchQuery, ...queryParams),
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
        SELECT DISTINCT unnest(tags) as suggestion
        FROM notes
        WHERE unnest(tags) ILIKE $1
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
