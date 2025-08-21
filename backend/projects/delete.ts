import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { projectsDB } from "./db";

interface DeleteProjectParams {
  id: number;
}

// Deletes a project.
export const deleteProject = api<DeleteProjectParams, void>(
  { expose: true, method: "DELETE", path: "/projects/:id", auth: true },
  async (params) => {
    const auth = getAuthData()!;
    
    await projectsDB.exec`
      DELETE FROM projects WHERE id = ${params.id} AND user_id = ${auth.userID}
    `;
  }
);
