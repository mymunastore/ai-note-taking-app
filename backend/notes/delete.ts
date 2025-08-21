import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { notesDB } from "./db";

interface DeleteNoteParams {
  id: number;
}

// Deletes a note by ID.
export const deleteNote = api<DeleteNoteParams, void>(
  { expose: true, method: "DELETE", path: "/notes/:id", auth: true },
  async (params) => {
    const auth = getAuthData()!;
    
    await notesDB.exec`
      DELETE FROM notes WHERE id = ${params.id} AND user_id = ${auth.userID}
    `;
  }
);
