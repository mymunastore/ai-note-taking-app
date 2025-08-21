import { api } from "encore.dev/api";
import { projectsDB } from "./db";
import type { ListProjectsResponse } from "./types";

// Lists all projects for the current user or organization.
export const list = api<void, ListProjectsResponse>(
  { expose: true, method: "GET", path: "/projects" },
  async () => {
    const rows = await projectsDB.queryAll<{
      id: number;
      name: string;
      description: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, name, description, created_at, updated_at
      FROM projects
      ORDER BY created_at DESC
    `;

    return {
      projects: rows.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || undefined,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
    };
  }
);
