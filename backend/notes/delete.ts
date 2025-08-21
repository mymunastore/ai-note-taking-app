import { api, APIError } from "encore.dev/api";
import { notesDB } from "./db";

interface DeleteNoteParams {
  id: number;
}

// Deletes a note by ID.
export const deleteNote = api<DeleteNoteParams, void>(
  { expose: true, method: "DELETE", path: "/notes/:id" },
  async (params) => {
    const result = await notesDB.exec`
      DELETE FROM notes WHERE id = ${params.id}
    `;

    // Note: PostgreSQL doesn't return affected rows count in this context
    // We'll assume the delete was successful if no error was thrown
  }
);
