import { api, APIError } from "encore.dev/api";
import { projectsDB } from "./db";
import type { Project } from "./types";

interface GetProjectParams {
  id: number;
}

// Retrieves a specific project by ID.
export const get = api<GetProjectParams, Project>(
  { expose: true, method: "GET", path: "/projects/:id" },
  async (params) => {
    const row = await projectsDB.queryRow<{
      id: number;
      name: string;
      description: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, name, description, created_at, updated_at
      FROM projects
      WHERE id = ${params.id}
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
