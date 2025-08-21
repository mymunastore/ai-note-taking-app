import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { notesDB } from "./db";
import type { CreateNoteRequest, Note } from "./types";

// Creates a new note with transcript and summary.
export const createNote = api<CreateNoteRequest, Note>(
  { auth: true, expose: true, method: "POST", path: "/notes" },
  async (req) => {
    const auth = getAuthData()!;
    
    try {
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

      if (req.tags && !Array.isArray(req.tags)) {
        throw APIError.invalidArgument("Tags must be an array");
      }

      // Check usage limits for free plan
      if (auth.plan === "free") {
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        
        const usage = await notesDB.queryRow<{ count: number; minutes: number }>`
          SELECT 
            COUNT(*) as count,
            COALESCE(SUM(duration), 0) / 60 as minutes
          FROM notes 
          WHERE user_id = ${auth.userID} AND created_at >= ${currentMonth}
        `;
        
        if (usage && usage.count >= 10) {
          throw APIError.resourceExhausted("Free plan limit reached. Upgrade to Pro for unlimited recordings.");
        }
        
        if (usage && usage.minutes + (req.duration / 60) > 60) {
          throw APIError.resourceExhausted("Free plan transcription limit reached. Upgrade to Pro for unlimited transcription.");
        }
      }

      const sanitizedTags = req.tags ? req.tags
        .filter(tag => tag && typeof tag === 'string' && tag.trim().length > 0)
        .map(tag => tag.trim())
        .slice(0, 20)
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
        user_id: string;
        created_at: Date;
        updated_at: Date;
      }>`
        INSERT INTO notes (title, transcript, summary, duration, original_language, translated, is_public, tags, project_id, user_id)
        VALUES (${req.title.trim()}, ${req.transcript.trim()}, ${req.summary.trim()}, ${req.duration}, ${req.originalLanguage || null}, ${req.translated || false}, ${req.isPublic || false}, ${sanitizedTags}, ${req.projectId || null}, ${auth.userID})
        RETURNING id, title, transcript, summary, duration, original_language, translated, is_public, tags, project_id, user_id, created_at, updated_at
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
        userId: row.user_id,
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
