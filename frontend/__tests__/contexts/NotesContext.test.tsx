import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotesProvider, useNotes } from '../../contexts/NotesContext';

// Mock backend
jest.mock('~backend/client', () => ({
  __esModule: true,
  default: {
    notes: {
      listNotes: jest.fn(),
      createNote: jest.fn(),
      updateNote: jest.fn(),
      deleteNote: jest.fn(),
    },
  },
}));

const mockNotes = [
  {
    id: 1,
    title: 'Test Note 1',
    transcript: 'Test transcript 1',
    summary: 'Test summary 1',
    duration: 120,
    tags: ['test', 'meeting'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    title: 'Test Note 2',
    transcript: 'Test transcript 2',
    summary: 'Test summary 2',
    duration: 180,
    tags: ['test', 'call'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Test component that uses the notes context
const TestComponent: React.FC = () => {
  const {
    notes,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedTags,
    setSelectedTags,
    createNote,
    updateNote,
    deleteNote,
  } = useNotes();

  return (
    <div>
      <div data-testid="notes-count">{notes.length}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="search-query">{searchQuery}</div>
      <div data-testid="selected-tags">{selectedTags.join(',')}</div>
      <button onClick={() => setSearchQuery('test')}>Set Search</button>
      <button onClick={() => setSelectedTags(['meeting'])}>Set Tags</button>
      <button onClick={() => createNote({
        title: 'New Note',
        transcript: 'New transcript',
        summary: 'New summary',
        duration: 60,
      })}>
        Create Note
      </button>
      <button onClick={() => updateNote({
        id: 1,
        title: 'Updated Note',
      })}>
        Update Note
      </button>
      <button onClick={() => deleteNote(1)}>Delete Note</button>
      {notes.map(note => (
        <div key={note.id} data-testid={`note-${note.id}`}>
          {note.title}
        </div>
      ))}
    </div>
  );
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <NotesProvider>
        {children}
      </NotesProvider>
    </QueryClientProvider>
  );
};

describe('NotesContext', () => {
  beforeEach(() => {
    const backend = require('~backend/client').default;
    backend.notes.listNotes.mockResolvedValue({ notes: mockNotes });
    backend.notes.createNote.mockResolvedValue(mockNotes[0]);
    backend.notes.updateNote.mockResolvedValue(mockNotes[0]);
    backend.notes.deleteNote.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('provides notes data', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notes-count')).toHaveTextContent('2');
      expect(screen.getByTestId('note-1')).toHaveTextContent('Test Note 1');
      expect(screen.getByTestId('note-2')).toHaveTextContent('Test Note 2');
    });
  });

  it('handles search query updates', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const setSearchButton = screen.getByText('Set Search');
    setSearchButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('search-query')).toHaveTextContent('test');
    });
  });

  it('handles selected tags updates', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const setTagsButton = screen.getByText('Set Tags');
    setTagsButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('selected-tags')).toHaveTextContent('meeting');
    });
  });

  it('creates new notes', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const createButton = screen.getByText('Create Note');
    createButton.click();

    await waitFor(() => {
      const backend = require('~backend/client').default;
      expect(backend.notes.createNote).toHaveBeenCalledWith({
        title: 'New Note',
        transcript: 'New transcript',
        summary: 'New summary',
        duration: 60,
      });
    });
  });

  it('updates existing notes', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const updateButton = screen.getByText('Update Note');
    updateButton.click();

    await waitFor(() => {
      const backend = require('~backend/client').default;
      expect(backend.notes.updateNote).toHaveBeenCalledWith({
        id: 1,
        title: 'Updated Note',
      });
    });
  });

  it('deletes notes', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const deleteButton = screen.getByText('Delete Note');
    deleteButton.click();

    await waitFor(() => {
      const backend = require('~backend/client').default;
      expect(backend.notes.deleteNote).toHaveBeenCalledWith({ id: 1 });
    });
  });

  it('shows loading state', () => {
    const backend = require('~backend/client').default;
    backend.notes.listNotes.mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
  });
});
