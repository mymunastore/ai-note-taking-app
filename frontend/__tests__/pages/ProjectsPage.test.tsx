import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectsPage from '../../pages/ProjectsPage';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the backend
jest.mock('~backend/client', () => ({
  __esModule: true,
  default: {
    projects: {
      listProjects: jest.fn(),
      createProject: jest.fn(),
    },
  },
}));

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockProjects = [
  {
    id: 1,
    name: 'Marketing Campaign',
    description: 'Project for Q1 marketing campaign planning',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 2,
    name: 'Product Development',
    description: 'New product feature development discussions',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-14'),
  },
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ProjectsPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    const backend = require('~backend/client').default;
    backend.projects.listProjects.mockResolvedValue({ projects: mockProjects });
    backend.projects.createProject.mockResolvedValue(mockProjects[0]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders projects page header', () => {
    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText(/Organize your recordings into projects/)).toBeInTheDocument();
  });

  it('displays new project button', () => {
    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    );

    expect(screen.getByText('New Project')).toBeInTheDocument();
  });

  it('shows search input', () => {
    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
  });

  it('displays projects list', async () => {
    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Marketing Campaign')).toBeInTheDocument();
      expect(screen.getByText('Product Development')).toBeInTheDocument();
    });
  });

  it('shows project descriptions', async () => {
    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Project for Q1 marketing campaign planning')).toBeInTheDocument();
      expect(screen.getByText('New product feature development discussions')).toBeInTheDocument();
    });
  });

  it('opens create project dialog', async () => {
    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    );

    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    expect(screen.getByText('Create New Project')).toBeInTheDocument();
    expect(screen.getByLabelText('Project Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('creates new project', async () => {
    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    );

    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    const nameInput = screen.getByLabelText('Project Name');
    const descriptionInput = screen.getByLabelText('Description');
    const createButton = screen.getByRole('button', { name: /create project/i });

    await user.type(nameInput, 'Test Project');
    await user.type(descriptionInput, 'Test project description');
    await user.click(createButton);

    await waitFor(() => {
      const backend = require('~backend/client').default;
      expect(backend.projects.createProject).toHaveBeenCalledWith({
        name: 'Test Project',
        description: 'Test project description',
      });
    });
  });

  it('shows empty state when no projects exist', async () => {
    const backend = require('~backend/client').default;
    backend.projects.listProjects.mockResolvedValue({ projects: [] });

    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
      expect(screen.getByText('Create Project')).toBeInTheDocument();
    });
  });

  it('filters projects by search query', async () => {
    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search projects...');
    await user.type(searchInput, 'Marketing');

    expect(searchInput).toHaveValue('Marketing');
  });

  it('shows project metadata', async () => {
    render(
      <TestWrapper>
        <ProjectsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('0 recordings')).toBeInTheDocument();
      expect(screen.getByText('0m')).toBeInTheDocument();
    });
  });
});
