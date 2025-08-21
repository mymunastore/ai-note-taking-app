import { api } from "encore.dev/api";
import { notesDB } from "./db";

interface DeleteNoteParams {
  id: number;
}

// Deletes a note by ID.
export const deleteNote = api<DeleteNoteParams, void>(
  { expose: true, method: "DELETE", path: "/notes/:id" },
  async (params) => {
    await notesDB.exec`
      DELETE FROM notes WHERE id = ${params.id}
    `;
  }
);
