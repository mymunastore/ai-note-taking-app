import { api, APIError } from "encore.dev/api";
import { notesDB } from "./db";
import type { CreateNoteRequest, Note } from "./types";

// Creates a new note with transcript and summary.
export const create = api<CreateNoteRequest, Note>(
  { expose: true, method: "POST", path: "/notes" },
  async (req) => {
    try {
      // Validate required fields
      if (!req.title || req.title.trim().length === 0) {
        throw APIError.invalidArgument("Title is required");
      }

      if (!req.transcript || req.transcript.trim().length === 0) {
        throw APIError.invalidArgument("Transcript is required");
      }

      if (!req.summary || req.summary.trim().length === 0) {
        throw APIError.invalidArgument("Summary is required");
      }

      if (req.duration === undefined || req.duration < 0) {
        throw APIError.invalidArgument("Duration must be a non-negative number");
      }

      // Validate optional fields
      if (req.tags && !Array.isArray(req.tags)) {
        throw APIError.invalidArgument("Tags must be an array");
      }

      // Sanitize and validate tags
      const sanitizedTags = req.tags ? req.tags
        .filter(tag => tag && typeof tag === 'string' && tag.trim().length > 0)
        .map(tag => tag.trim())
        .slice(0, 20) // Limit to 20 tags
        : [];

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
        INSERT INTO notes (title, transcript, summary, duration, original_language, translated, is_public, tags, project_id)
        VALUES (${req.title.trim()}, ${req.transcript.trim()}, ${req.summary.trim()}, ${req.duration}, ${req.originalLanguage || null}, ${req.translated || false}, ${req.isPublic || false}, ${sanitizedTags}, ${req.projectId || null})
        RETURNING id, title, transcript, summary, duration, original_language, translated, is_public, tags, project_id, created_at, updated_at
      `;

      if (!row) {
        throw APIError.internal("Failed to create note");
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
        tags: row.tags || [],
        projectId: row.project_id || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error("Create note error:", error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw APIError.internal("Failed to create note");
    }
  }
);
