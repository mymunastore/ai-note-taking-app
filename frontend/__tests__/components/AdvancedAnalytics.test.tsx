import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import AdvancedAnalytics from '../../components/AdvancedAnalytics';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the backend
jest.mock('~backend/client', () => ({
  __esModule: true,
  default: {
    ai: {
      generateSmartInsights: jest.fn(),
    },
    notes: {
      getAnalytics: jest.fn(),
    },
  },
}));

const mockInsights = {
  insights: {
    productivity_trends: {
      meeting_frequency: 5,
      average_duration: 1800,
      efficiency_score: 0.85,
      trend_direction: 'increasing' as const,
    },
    communication_patterns: {
      most_active_times: ['10:00', '14:00', '16:00'],
      preferred_meeting_types: ['standup', 'review'],
      collaboration_score: 0.75,
    },
    content_analysis: {
      top_topics: [
        { topic: 'project planning', frequency: 10, sentiment_trend: 'positive' as const },
        { topic: 'budget review', frequency: 8, sentiment_trend: 'neutral' as const },
      ],
      action_item_completion_rate: 0.8,
      decision_velocity: 0.7,
    },
    recommendations: [
      {
        category: 'productivity' as const,
        title: 'Optimize meeting length',
        description: 'Consider shorter meetings',
        impact: 'high' as const,
        effort: 'low' as const,
      },
    ],
    predictions: {
      next_week_meetings: 6,
      upcoming_busy_periods: ['Next Tuesday'],
      potential_bottlenecks: ['Resource allocation'],
    },
  },
};

const mockAnalytics = {
  totalRecordings: 25,
  totalDuration: 45000,
  averageDuration: 1800,
  languageBreakdown: [
    { language: 'en', count: 20, percentage: 80 },
    { language: 'es', count: 5, percentage: 20 },
  ],
  tagsBreakdown: [
    { tag: 'meeting', count: 15 },
    { tag: 'planning', count: 10 },
  ],
  monthlyActivity: [
    { month: '2024-01', recordings: 10, duration: 18000 },
    { month: '2024-02', recordings: 15, duration: 27000 },
  ],
  recentActivity: {
    thisWeek: 5,
    thisMonth: 15,
    lastMonth: 10,
  },
};

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

describe('AdvancedAnalytics', () => {
  beforeEach(() => {
    const backend = require('~backend/client').default;
    backend.ai.generateSmartInsights.mockResolvedValue(mockInsights);
    backend.notes.getAnalytics.mockResolvedValue(mockAnalytics);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders advanced analytics dashboard', async () => {
    render(
      <TestWrapper>
        <AdvancedAnalytics />
      </TestWrapper>
    );

    expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered')).toBeInTheDocument();
  });

  it('displays productivity metrics', async () => {
    render(
      <TestWrapper>
        <AdvancedAnalytics />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Productivity Score')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  it('shows meeting frequency data', async () => {
    render(
      <TestWrapper>
        <AdvancedAnalytics />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Meeting Frequency')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('displays AI recommendations', async () => {
    render(
      <TestWrapper>
        <AdvancedAnalytics />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Optimize meeting length')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    const backend = require('~backend/client').default;
    backend.ai.generateSmartInsights.mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <AdvancedAnalytics />
      </TestWrapper>
    );

    expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
  });

  it('handles empty data state', async () => {
    const backend = require('~backend/client').default;
    backend.ai.generateSmartInsights.mockResolvedValue(null);
    backend.notes.getAnalytics.mockResolvedValue(null);

    render(
      <TestWrapper>
        <AdvancedAnalytics />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No Data Available')).toBeInTheDocument();
    });
  });
});
