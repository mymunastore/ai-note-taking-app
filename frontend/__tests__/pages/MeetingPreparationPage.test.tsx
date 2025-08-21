import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MeetingPreparationPage from '../../pages/MeetingPreparationPage';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the backend
jest.mock('~backend/client', () => ({
  __esModule: true,
  default: {
    ai: {
      prepareMeeting: jest.fn(),
      analyzeMeetingPatterns: jest.fn(),
      generateMeetingTemplate: jest.fn(),
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

describe('MeetingPreparationPage', () => {
  it('renders meeting preparation page header', () => {
    render(
      <TestWrapper>
        <MeetingPreparationPage />
      </TestWrapper>
    );

    expect(screen.getByText('Meeting Preparation Assistant')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered')).toBeInTheDocument();
    expect(screen.getByText(/Let AI analyze your meeting history/)).toBeInTheDocument();
  });

  it('displays feature overview cards', () => {
    render(
      <TestWrapper>
        <MeetingPreparationPage />
      </TestWrapper>
    );

    expect(screen.getByText('Smart Agenda Generation')).toBeInTheDocument();
    expect(screen.getByText('Participant Insights')).toBeInTheDocument();
    expect(screen.getByText('Discussion Points')).toBeInTheDocument();
  });

  it('shows feature descriptions', () => {
    render(
      <TestWrapper>
        <MeetingPreparationPage />
      </TestWrapper>
    );

    expect(screen.getByText(/AI analyzes previous meetings/)).toBeInTheDocument();
    expect(screen.getByText(/Get context on each participant/)).toBeInTheDocument();
    expect(screen.getByText(/Receive AI-generated questions/)).toBeInTheDocument();
  });

  it('displays the meeting preparation component', () => {
    render(
      <TestWrapper>
        <MeetingPreparationPage />
      </TestWrapper>
    );

    // The MeetingPreparation component should be rendered
    expect(screen.getByText('Meeting Preparation Assistant')).toBeInTheDocument();
  });
});
