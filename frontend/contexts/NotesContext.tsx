import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import backend from "~backend/client";
import type { Note, CreateNoteRequest, UpdateNoteRequest } from "~backend/notes/types";

interface NotesContextType {
  notes: Note[];
  isLoading: boolean;
  error: Error | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  createNote: (note: CreateNoteRequest) => Promise<Note>;
  updateNote: (note: UpdateNoteRequest) => Promise<Note>;
  deleteNote: (id: number) => Promise<void>;
  refetch: () => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

interface NotesProviderProps {
  children: ReactNode;
}

export function NotesProvider({ children }: NotesProviderProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const queryClient = useQueryClient();

  const {
    data: notesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notes", searchQuery, selectedTags],
    queryFn: async () => {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedTags.length > 0) params.tags = selectedTags.join(",");
      // @ts-expect-error generated client method
      return backend.notes.listNotes(params);
    },
  });

  const createNoteMutation = useMutation({
    // @ts-expect-error generated client method
    mutationFn: (note: CreateNoteRequest) => backend.notes.createNote(note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const updateNoteMutation = useMutation({
    // @ts-expect-error generated client method
    mutationFn: (note: UpdateNoteRequest) => backend.notes.updateNote(note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => backend.notes.deleteNote({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const value: NotesContextType = {
    notes: notesData?.notes || [],
    isLoading,
    error: error as Error | null,
    searchQuery,
    setSearchQuery,
    selectedTags,
    setSelectedTags,
    createNote: createNoteMutation.mutateAsync,
    updateNote: updateNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    refetch,
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}
