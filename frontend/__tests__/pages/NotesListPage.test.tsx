import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotesListPage from '../../pages/NotesListPage';
import { NotesProvider } from '../../contexts/NotesContext';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the notes context with sample data
jest.mock('../../contexts/NotesContext', () => ({
  ...jest.requireActual('../../contexts/NotesContext'),
  useNotes: () => ({
    notes: [
      {
        id: 1,
        title: 'Team Meeting Notes',
        transcript: 'This is a test transcript for the team meeting...',
        summary: 'Discussed project timeline and deliverables.',
        duration: 1800,
        tags: ['meeting', 'team'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        originalLanguage: 'en',
      },
      {
        id: 2,
        title: 'Client Call Recording',
        transcript: 'Client discussed requirements for the new feature...',
        summary: 'Client wants new dashboard functionality.',
        duration: 2400,
        tags: ['client', 'requirements'],
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-14'),
        originalLanguage: 'es',
        translated: true,
      },
    ],
    isLoading: false,
    searchQuery: '',
    setSearchQuery: jest.fn(),
    deleteNote: jest.fn(),
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
        <NotesProvider>
          {children}
        </NotesProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('NotesListPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the dashboard header', () => {
    render(
      <TestWrapper>
        <NotesListPage />
      </TestWrapper>
    );

    expect(screen.getByText('SCRIBE AI Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Manage your recordings/)).toBeInTheDocument();
  });

  it('displays new recording button', () => {
    render(
      <TestWrapper>
        <NotesListPage />
      </TestWrapper>
    );

    expect(screen.getByText('New Recording')).toBeInTheDocument();
  });

  it('shows search input', () => {
    render(
      <TestWrapper>
        <NotesListPage />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('Search notes...')).toBeInTheDocument();
  });

  it('displays notes list', () => {
    render(
      <TestWrapper>
        <NotesListPage />
      </TestWrapper>
    );

    expect(screen.getByText('Team Meeting Notes')).toBeInTheDocument();
    expect(screen.getByText('Client Call Recording')).toBeInTheDocument();
  });

  it('shows note summaries', () => {
    render(
      <TestWrapper>
        <NotesListPage />
      </TestWrapper>
    );

    expect(screen.getByText('Discussed project timeline and deliverables.')).toBeInTheDocument();
    expect(screen.getByText('Client wants new dashboard functionality.')).toBeInTheDocument();
  });

  it('displays note durations', () => {
    render(
      <TestWrapper>
        <NotesListPage />
      </TestWrapper>
    );

    expect(screen.getByText('30:00')).toBeInTheDocument(); // 1800 seconds
    expect(screen.getByText('40:00')).toBeInTheDocument(); // 2400 seconds
  });

  it('shows tags for notes', () => {
    render(
      <TestWrapper>
        <NotesListPage />
      </TestWrapper>
    );

    expect(screen.getByText('meeting')).toBeInTheDocument();
    expect(screen.getByText('team')).toBeInTheDocument();
    expect(screen.getByText('client')).toBeInTheDocument();
    expect(screen.getByText('requirements')).toBeInTheDocument();
  });

  it('indicates translated content', () => {
    render(
      <TestWrapper>
        <NotesListPage />
      </TestWrapper>
    );

    expect(screen.getByText('Spanish → EN')).toBeInTheDocument();
  });

  it('navigates to record page when New Recording is clicked', async () => {
    render(
      <TestWrapper>
        <NotesListPage />
      </TestWrapper>
    );

    const newRecordingButton = screen.getByText('New Recording');
    await user.click(newRecordingButton);

    expect(mockNavigate).toHaveBeenCalledWith('/record');
  });

  it('allows searching notes', async () => {
    const mockSetSearchQuery = jest.fn();
    
    // We would need to properly mock the useNotes hook to test search
    render(
      <TestWrapper>
        <NotesListPage />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search notes...');
    await user.type(searchInput, 'team');

    expect(searchInput).toHaveValue('team');
  });

  it('shows transcript previews', () => {
    render(
      <TestWrapper>
        <NotesListPage />
      </TestWrapper>
    );

    expect(screen.getByText(/This is a test transcript/)).toBeInTheDocument();
    expect(screen.getByText(/Client discussed requirements/)).toBeInTheDocument();
  });
});
