import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NoteDetailPage from '../../pages/NoteDetailPage';
import { NotesProvider } from '../../contexts/NotesContext';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock backend
jest.mock('~backend/client', () => ({
  __esModule: true,
  default: {
    notes: {
      getNote: jest.fn(),
    },
  },
}));

// Mock the notes context
jest.mock('../../contexts/NotesContext', () => ({
  ...jest.requireActual('../../contexts/NotesContext'),
  useNotes: () => ({
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
  }),
}));

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockNote = {
  id: 1,
  title: 'Test Meeting Notes',
  transcript: 'This is a test transcript of the meeting discussion...',
  summary: 'Meeting covered project timeline, budget allocation, and team assignments.',
  duration: 1800,
  tags: ['meeting', 'project', 'planning'],
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
  originalLanguage: 'es',
  translated: true,
  isPublic: false,
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/note/1']}>
        <NotesProvider>
          {children}
        </NotesProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('NoteDetailPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    const backend = require('~backend/client').default;
    backend.notes.getNote.mockResolvedValue(mockNote);
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders note details', async () => {
    render(
      <TestWrapper>
        <NoteDetailPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Meeting Notes')).toBeInTheDocument();
      expect(screen.getByText('30:00')).toBeInTheDocument(); // Duration
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument(); // Date
    });
  });

  it('shows translation indicator', async () => {
    render(
      <TestWrapper>
        <NoteDetailPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Spanish → English/)).toBeInTheDocument();
      expect(screen.getByText(/Auto-translated/)).toBeInTheDocument();
    });
  });

  it('displays summary section', async () => {
    render(
      <TestWrapper>
        <NoteDetailPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText(/Meeting covered project timeline/)).toBeInTheDocument();
    });
  });

  it('displays transcript section', async () => {
    render(
      <TestWrapper>
        <NoteDetailPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Translated Transcript')).toBeInTheDocument();
      expect(screen.getByText(/This is a test transcript/)).toBeInTheDocument();
    });
  });

  it('shows edit and delete buttons', async () => {
    render(
      <TestWrapper>
        <NoteDetailPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('enables edit mode when edit button is clicked', async () => {
    render(
      <TestWrapper>
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

  it('shows copy buttons for content', async () => {
    render(
      <TestWrapper>
        <NoteDetailPage />
      </TestWrapper>
    );

    await waitFor(() => {
      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      expect(copyButtons).toHaveLength(2); // One for summary, one for transcript
    });
  });

  it('navigates back when back button is clicked', async () => {
    render(
      <TestWrapper>
        <NoteDetailPage />
      </TestWrapper>
    );

    await waitFor(() => {
      const backButton = screen.getByText('Back');
      user.click(backButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('handles note not found', async () => {
    const backend = require('~backend/client').default;
    backend.notes.getNote.mockRejectedValue(new Error('Not found'));

    render(
      <TestWrapper>
        <NoteDetailPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Note Not Found')).toBeInTheDocument();
      expect(screen.getByText(/The note you\'re looking for doesn\'t exist/)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    const backend = require('~backend/client').default;
    backend.notes.getNote.mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <NoteDetailPage />
      </TestWrapper>
    );

    // Loading state shows animated placeholders
    expect(screen.getByTestId('loading') || document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('copies content to clipboard', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    render(
      <TestWrapper>
        <NoteDetailPage />
      </TestWrapper>
    );

    await waitFor(() => {
      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      user.click(copyButtons[0]);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
