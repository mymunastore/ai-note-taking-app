import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TemplatesPage from '../../pages/TemplatesPage';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the backend
jest.mock('~backend/client', () => ({
  __esModule: true,
  default: {
    ai: {
      generateSmartTemplate: jest.fn(),
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

describe('TemplatesPage', () => {
  it('renders templates page header', () => {
    render(
      <TestWrapper>
        <TemplatesPage />
      </TestWrapper>
    );

    expect(screen.getByText('Smart Templates')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered')).toBeInTheDocument();
    expect(screen.getByText(/Generate professional templates/)).toBeInTheDocument();
  });

  it('displays the smart templates component', () => {
    render(
      <TestWrapper>
        <TemplatesPage />
      </TestWrapper>
    );

    // The SmartTemplates component should be rendered
    expect(screen.getByText('Smart Templates')).toBeInTheDocument();
  });
});
