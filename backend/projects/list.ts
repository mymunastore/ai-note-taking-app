import { api } from "encore.dev/api";
import { projectsDB } from "./db";
import type { ListProjectsResponse, Project } from "./types";

// Lists all projects for the current user or organization.
export const list = api<void, ListProjectsResponse>(
  { expose: true, method: "GET", path: "/projects" },
  async () => {
    const projects = await projectsDB.queryAll<Project>`
      SELECT id, name, description, created_at, updated_at
      FROM projects
      ORDER BY created_at DESC
    `;

    return {
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
    };
  }
);
