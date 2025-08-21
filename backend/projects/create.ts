import { api, APIError } from "encore.dev/api";
import { projectsDB } from "./db";
import type { CreateProjectRequest, Project } from "./types";

// Creates a new project.
export const create = api<CreateProjectRequest, Project>(
  { expose: true, method: "POST", path: "/projects" },
  async (req) => {
    if (!req.name || !req.name.trim()) {
      throw APIError.invalidArgument("name is required");
    }

    const row = await projectsDB.queryRow<{
      id: number;
      name: string;
      description: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO projects (name, description)
      VALUES (${req.name.trim()}, ${req.description || null})
      RETURNING id, name, description, created_at, updated_at
    `;

    if (!row) {
      throw APIError.internal("Failed to create project");
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
