import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { projectsDB } from "./db";
import type { ListProjectsResponse, Project } from "./types";

// Lists all projects for the current user or organization.
export const list = api<void, ListProjectsResponse>(
  { expose: true, method: "GET", path: "/projects", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    const projects = await projectsDB.queryAll<Project>`
      SELECT id, name, description, user_id, organization_id, created_at, updated_at
      FROM projects
      WHERE user_id = ${auth.userID} OR organization_id = ${auth.organizationId}
      ORDER BY created_at DESC
    `;

    return {
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        userId: p.user_id,
        organizationId: p.organization_id,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
    };
  }
);
