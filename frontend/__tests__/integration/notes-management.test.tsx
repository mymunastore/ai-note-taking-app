import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotesListPage from '../../pages/NotesListPage';
import NoteDetailPage from '../../pages/NoteDetailPage';
import { NotesProvider } from '../../contexts/NotesContext';

// Mock the backend
jest.mock('~backend/client', () => ({
  __esModule: true,
  default: {
    notes: {
      listNotes: jest.fn(),
      getNote: jest.fn(),
      updateNote: jest.fn(),
      deleteNote: jest.fn(),
    },
  },
}));

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockNotes = [
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
    isPublic: false,
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
    isPublic: false,
  },
];

const TestWrapper: React.FC<{ children: React.ReactNode; route?: string }> = ({ 
  children, 
  route = '/' 
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Router = route === '/' ? BrowserRouter : MemoryRouter;
  const routerProps = route === '/' ? {} : { initialEntries: [route] };

  return (
    <QueryClientProvider client={queryClient}>
      <Router {...routerProps}>
        <NotesProvider>
          {children}
        </NotesProvider>
      </Router>
    </QueryClientProvider>
  );
};

describe('Notes Management Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    const backend = require('~backend/client').default;
    backend.notes.listNotes.mockResolvedValue({ notes: mockNotes });
    backend.notes.getNote.mockResolvedValue(mockNotes[0]);
    backend.notes.updateNote.mockResolvedValue(mockNotes[0]);
    backend.notes.deleteNote.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays notes list and allows navigation to detail', async () => {
    render(
      <TestWrapper>
        <NotesListPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Team Meeting Notes')).toBeInTheDocument();
      expect(screen.getByText('Client Call Recording')).toBeInTheDocument();
    });

    // Test that notes are displayed with proper metadata
    expect(screen.getByText('30:00')).toBeInTheDocument(); // Duration
    expect(screen.getByText('40:00')).toBeInTheDocument(); // Duration
    expect(screen.getByText('Spanish → EN')).toBeInTheDocument(); // Translation indicator
  });

  it('shows note details when navigating to detail page', async () => {
    render(
      <TestWrapper route="/note/1">
        <NoteDetailPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Team Meeting Notes')).toBeInTheDocument();
      expect(screen.getByText('Discussed project timeline and deliverables.')).toBeInTheDocument();
      expect(screen.getByText(/This is a test transcript/)).toBeInTheDocument();
    });
  });

  it('allows editing note details', async () => {
    render(
      <TestWrapper route="/note/1">
        <NoteDetailPage />
      </TestWrapper>
    );

    await waitFor(() => {
      const editButton = screen.getByText('Edit');
      user.click(editButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('handles note deletion', async () => {
    render(
      <TestWrapper route="/note/1">
        <NoteDetailPage />
      </TestWrapper>
    );

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    await waitFor(() => {
      const deleteButton = screen.getByText('Delete');
      user.click(deleteButton);
    });

    await waitFor(() => {
      const backend = require('~backend/client').default;
      expect(backend.notes.deleteNote).toHaveBeenCalledWith({ id: 1 });
    });
  });

  it('searches notes by query', async () => {
    render(
      <TestWrapper>
        <NotesListPage />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search notes...');
    await user.type(searchInput, 'team');

    expect(searchInput).toHaveValue('team');
    
    // The actual filtering would be handled by the backend
    // This test verifies the UI interaction
  });

  it('displays empty state when no notes exist', async () => {
    const backend = require('~backend/client').default;
    backend.notes.listNotes.mockResolvedValue({ notes: [] });

    render(
      <TestWrapper>
        <NotesListPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No recordings yet')).toBeInTheDocument();
      expect(screen.getByText('Start Recording')).toBeInTheDocument();
    });
  });

  it('handles note loading errors', async () => {
    const backend = require('~backend/client').default;
    backend.notes.getNote.mockRejectedValue(new Error('Note not found'));

    render(
      <TestWrapper route="/note/999">
        <NoteDetailPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Note Not Found')).toBeInTheDocument();
    });
  });
});
