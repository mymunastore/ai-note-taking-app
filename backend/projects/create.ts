import { api } from "encore.dev/api";
import { projectsDB } from "./db";
import type { CreateProjectRequest, Project } from "./types";

// Creates a new project.
export const create = api<CreateProjectRequest, Project>(
  { expose: true, method: "POST", path: "/projects" },
  async (req) => {
    const row = await projectsDB.queryRow<Project>`
      INSERT INTO projects (name, description)
      VALUES (${req.name}, ${req.description || null})
      RETURNING id, name, description, created_at, updated_at
    `;

    if (!row) {
      throw new Error("Failed to create project");
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
