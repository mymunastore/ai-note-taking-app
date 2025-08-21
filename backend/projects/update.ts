import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { projectsDB } from "./db";
import type { UpdateProjectRequest, Project } from "./types";

// Updates a project.
export const update = api<UpdateProjectRequest, Project>(
  { expose: true, method: "PUT", path: "/projects/:id", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    const row = await projectsDB.queryRow<Project>`
      UPDATE projects
      SET name = ${req.name}, description = ${req.description}, updated_at = NOW()
      WHERE id = ${req.id} AND user_id = ${auth.userID}
      RETURNING id, name, description, user_id, organization_id, created_at, updated_at
    `;

    if (!row) {
      throw APIError.notFound("project not found or access denied");
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      userId: row.user_id,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
);
