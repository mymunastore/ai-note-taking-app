import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { projectsDB } from "./db";
import type { CreateProjectRequest, Project } from "./types";

// Creates a new project.
export const create = api<CreateProjectRequest, Project>(
  { expose: true, method: "POST", path: "/projects", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    const row = await projectsDB.queryRow<Project>`
      INSERT INTO projects (name, description, user_id, organization_id)
      VALUES (${req.name}, ${req.description || null}, ${auth.userID}, ${auth.organizationId || null})
      RETURNING id, name, description, user_id, organization_id, created_at, updated_at
    `;

    if (!row) {
      throw new Error("Failed to create project");
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
