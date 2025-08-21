import { api, APIError } from "encore.dev/api";
import { projectsDB } from "./db";
import type { UpdateProjectRequest, Project } from "./types";

// Updates a project.
export const updateProject = api<UpdateProjectRequest, Project>(
  { expose: true, method: "PUT", path: "/projects/:id" },
  async (req) => {
    if (!req.id) {
      throw APIError.invalidArgument("id is required");
    }

    const row = await projectsDB.queryRow<{
      id: number;
      name: string;
      description: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      UPDATE projects
      SET 
        name = COALESCE(${req.name}, name), 
        description = COALESCE(${req.description}, description), 
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING id, name, description, created_at, updated_at
    `;

    if (!row) {
      throw APIError.notFound("project not found");
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
);
