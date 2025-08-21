import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WorkflowsPage from '../../pages/WorkflowsPage';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the backend
jest.mock('~backend/client', () => ({
  __esModule: true,
  default: {
    ai: {
      listWorkflows: jest.fn(),
      createWorkflow: jest.fn(),
    },
  },
}));

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

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

describe('WorkflowsPage', () => {
  beforeEach(() => {
    const backend = require('~backend/client').default;
    backend.ai.listWorkflows.mockResolvedValue({ workflows: [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders workflows page header', () => {
    render(
      <TestWrapper>
        <WorkflowsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Workflow Automation')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText(/Automate your meeting workflows/)).toBeInTheDocument();
  });

  it('displays the workflow automation component', () => {
    render(
      <TestWrapper>
        <WorkflowsPage />
      </TestWrapper>
    );

    // The WorkflowAutomation component should be rendered
    expect(screen.getByText('Workflow Automation')).toBeInTheDocument();
  });
});
