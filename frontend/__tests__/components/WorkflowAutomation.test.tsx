import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import WorkflowAutomation from '../../components/WorkflowAutomation';
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

const mockWorkflows = [
  {
    id: 'workflow_1',
    name: 'Email Summary Workflow',
    description: 'Send email summaries after meetings',
    triggers: [
      { type: 'duration', condition: 'greater_than', value: 30 },
    ],
    actions: [
      { type: 'email', config: { recipient: 'test@example.com' } },
    ],
    enabled: true,
    created_at: new Date(),
    execution_count: 5,
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
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('WorkflowAutomation', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    const backend = require('~backend/client').default;
    backend.ai.listWorkflows.mockResolvedValue({ workflows: mockWorkflows });
    backend.ai.createWorkflow.mockResolvedValue(mockWorkflows[0]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders workflow automation interface', async () => {
    render(
      <TestWrapper>
        <WorkflowAutomation />
      </TestWrapper>
    );

    expect(screen.getByText('Workflow Automation')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('Create Workflow')).toBeInTheDocument();
  });

  it('displays existing workflows', async () => {
    render(
      <TestWrapper>
        <WorkflowAutomation />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Email Summary Workflow')).toBeInTheDocument();
      expect(screen.getByText('Send email summaries after meetings')).toBeInTheDocument();
    });
  });

  it('opens create workflow dialog', async () => {
    render(
      <TestWrapper>
        <WorkflowAutomation />
      </TestWrapper>
    );

    const createButton = screen.getByText('Create Workflow');
    await user.click(createButton);

    expect(screen.getByText('Create Automation Workflow')).toBeInTheDocument();
    expect(screen.getByLabelText('Workflow Name')).toBeInTheDocument();
  });

  it('creates new workflow with triggers and actions', async () => {
    render(
      <TestWrapper>
        <WorkflowAutomation />
      </TestWrapper>
    );

    const createButton = screen.getByText('Create Workflow');
    await user.click(createButton);

    // Fill in workflow details
    const nameInput = screen.getByLabelText('Workflow Name');
    await user.type(nameInput, 'Test Workflow');

    const descriptionInput = screen.getByLabelText('Description');
    await user.type(descriptionInput, 'Test workflow description');

    // Add trigger
    const addTriggerButton = screen.getByText('Add Trigger');
    await user.click(addTriggerButton);

    // Add action
    const addActionButton = screen.getByText('Add Action');
    await user.click(addActionButton);

    // Submit workflow
    const submitButton = screen.getByText('Create Workflow');
    await user.click(submitButton);

    await waitFor(() => {
      const backend = require('~backend/client').default;
      expect(backend.ai.createWorkflow).toHaveBeenCalled();
    });
  });

  it('validates required fields', async () => {
    render(
      <TestWrapper>
        <WorkflowAutomation />
      </TestWrapper>
    );

    const createButton = screen.getByText('Create Workflow');
    await user.click(createButton);

    // Try to submit without required fields
    const submitButton = screen.getByText('Create Workflow');
    await user.click(submitButton);

    // Should show validation error
    expect(screen.getByText('Create Automation Workflow')).toBeInTheDocument();
  });

  it('shows empty state when no workflows exist', async () => {
    const backend = require('~backend/client').default;
    backend.ai.listWorkflows.mockResolvedValue({ workflows: [] });

    render(
      <TestWrapper>
        <WorkflowAutomation />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No Workflows Yet')).toBeInTheDocument();
      expect(screen.getByText('Create Your First Workflow')).toBeInTheDocument();
    });
  });

  it('displays workflow execution count', async () => {
    render(
      <TestWrapper>
        <WorkflowAutomation />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Executed 5 times')).toBeInTheDocument();
    });
  });

  it('shows workflow status badge', async () => {
    render(
      <TestWrapper>
        <WorkflowAutomation />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });
});
