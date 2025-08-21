export interface Project {
  id: number;
  name: string;
  description?: string;
  userId: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  id: number;
  name?: string;
  description?: string;
}

export interface ListProjectsResponse {
  projects: Project[];
}
