import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { notesDB } from "./db";

interface DeleteNoteParams {
  id: number;
}

// Deletes a note by ID.
export const deleteNote = api<DeleteNoteParams, void>(
  { auth: true, expose: true, method: "DELETE", path: "/notes/:id" },
  async (params) => {
    const auth = getAuthData()!;
    
    // Verify ownership
    const note = await notesDB.queryRow<{ user_id: string }>`
      SELECT user_id FROM notes WHERE id = ${params.id}
    `;
    
    if (!note) {
      throw APIError.notFound("Note not found");
    }
    
    if (note.user_id !== auth.userID) {
      throw APIError.permissionDenied("You can only delete your own notes");
    }
    
    await notesDB.exec`
      DELETE FROM notes WHERE id = ${params.id}
    `;
  }
);
