import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { projectsDB } from "./db";
import type { Project } from "./types";

interface GetProjectParams {
  id: number;
}

// Retrieves a specific project by ID.
export const get = api<GetProjectParams, Project>(
  { expose: true, method: "GET", path: "/projects/:id", auth: true },
  async (params) => {
    const auth = getAuthData()!;
    
    const row = await projectsDB.queryRow<Project>`
      SELECT id, name, description, user_id, organization_id, created_at, updated_at
      FROM projects
      WHERE id = ${params.id} AND (user_id = ${auth.userID} OR organization_id = ${auth.organizationId})
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
