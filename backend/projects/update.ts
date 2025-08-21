import { api, APIError } from "encore.dev/api";
import { projectsDB } from "./db";
import type { UpdateProjectRequest, Project } from "./types";

// Updates a project.
export const update = api<UpdateProjectRequest, Project>(
  { expose: true, method: "PUT", path: "/projects/:id" },
  async (req) => {
    const row = await projectsDB.queryRow<Project>`
      UPDATE projects
      SET name = ${req.name}, description = ${req.description}, updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING id, name, description, created_at, updated_at
    `;

    if (!row) {
      throw APIError.notFound("project not found");
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
);
