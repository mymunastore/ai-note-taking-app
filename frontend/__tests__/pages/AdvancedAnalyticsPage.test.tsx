import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdvancedAnalyticsPage from '../../pages/AdvancedAnalyticsPage';
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
      ],
      action_item_completion_rate: 0.8,
      decision_velocity: 0.7,
    },
    recommendations: [],
    predictions: {
      next_week_meetings: 6,
      upcoming_busy_periods: [],
      potential_bottlenecks: [],
    },
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

describe('AdvancedAnalyticsPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    const backend = require('~backend/client').default;
    backend.notes.getAnalytics.mockResolvedValue(mockAnalytics);
    backend.ai.generateSmartInsights.mockResolvedValue(mockInsights);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders advanced analytics page header', () => {
    render(
      <TestWrapper>
        <AdvancedAnalyticsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered')).toBeInTheDocument();
    expect(screen.getByText(/Deep insights, predictive analytics/)).toBeInTheDocument();
  });

  it('shows timeframe selector', () => {
    render(
      <TestWrapper>
        <AdvancedAnalyticsPage />
      </TestWrapper>
    );

    expect(screen.getByDisplayValue('This Month')).toBeInTheDocument();
  });

  it('displays export button', () => {
    render(
      <TestWrapper>
        <AdvancedAnalyticsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('shows analytics tabs', () => {
    render(
      <TestWrapper>
        <AdvancedAnalyticsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  it('changes timeframe when selector is used', async () => {
    render(
      <TestWrapper>
        <AdvancedAnalyticsPage />
      </TestWrapper>
    );

    const timeframeSelect = screen.getByDisplayValue('This Month');
    await user.click(timeframeSelect);

    const weekOption = screen.getByText('This Week');
    await user.click(weekOption);

    expect(screen.getByDisplayValue('This Week')).toBeInTheDocument();
  });

  it('switches between tabs', async () => {
    render(
      <TestWrapper>
        <AdvancedAnalyticsPage />
      </TestWrapper>
    );

    const aiInsightsTab = screen.getByText('AI Insights');
    await user.click(aiInsightsTab);

    // The AI Insights tab content should be visible
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
  });

  it('shows trends tab content', async () => {
    render(
      <TestWrapper>
        <AdvancedAnalyticsPage />
      </TestWrapper>
    );

    const trendsTab = screen.getByText('Trends');
    await user.click(trendsTab);

    expect(screen.getByText('Usage Trends')).toBeInTheDocument();
  });

  it('shows performance tab content', async () => {
    render(
      <TestWrapper>
        <AdvancedAnalyticsPage />
      </TestWrapper>
    );

    const performanceTab = screen.getByText('Performance');
    await user.click(performanceTab);

    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
  });

  it('loads analytics data on mount', async () => {
    render(
      <TestWrapper>
        <AdvancedAnalyticsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      const backend = require('~backend/client').default;
      expect(backend.notes.getAnalytics).toHaveBeenCalled();
    });
  });

  it('loads insights data with correct timeframe', async () => {
    render(
      <TestWrapper>
        <AdvancedAnalyticsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      const backend = require('~backend/client').default;
      expect(backend.ai.generateSmartInsights).toHaveBeenCalledWith({
        timeframe: 'month',
        includeComparisons: true,
      });
    });
  });
});
