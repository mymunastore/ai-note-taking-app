import { api } from "encore.dev/api";
import { notesDB } from "./db";
import type { CreateNoteRequest, Note } from "./types";

// Creates a new note with transcript and summary.
export const create = api<CreateNoteRequest, Note>(
  { expose: true, method: "POST", path: "/notes" },
  async (req) => {
    const row = await notesDB.queryRow<{
      id: number;
      title: string;
      transcript: string;
      summary: string;
      duration: number;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO notes (title, transcript, summary, duration)
      VALUES (${req.title}, ${req.transcript}, ${req.summary}, ${req.duration})
      RETURNING id, title, transcript, summary, duration, created_at, updated_at
    `;

    if (!row) {
      throw new Error("Failed to create note");
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
