import { api, APIError } from "encore.dev/api";
import { projectsDB } from "./db";

interface DeleteProjectParams {
  id: number;
}

// Deletes a project.
export const deleteProject = api<DeleteProjectParams, void>(
  { expose: true, method: "DELETE", path: "/projects/:id" },
  async (params) => {
    await projectsDB.exec`
      DELETE FROM projects WHERE id = ${params.id}
    `;
  }
);
