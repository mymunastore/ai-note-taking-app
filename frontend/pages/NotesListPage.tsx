import React from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Clock, FileText, Trash2, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useNotes } from "../contexts/NotesContext";
import { formatDuration, formatDate } from "../utils/formatters";

export default function NotesListPage() {
  const { notes, isLoading, searchQuery, setSearchQuery, deleteNote } = useNotes();
  const { toast } = useToast();

  const handleDelete = async (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteNote(id);
        toast({
          title: "Note Deleted",
          description: "The note has been successfully deleted.",
        });
      } catch (error) {
        console.error("Failed to delete note:", error);
        toast({
          title: "Delete Error",
          description: "Failed to delete the note. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Notes</h1>
            <p className="text-gray-600 mt-1">
              {notes.length} {notes.length === 1 ? "recording" : "recordings"}
            </p>
          </div>
          <Link to="/record">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Recording
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search notes and transcripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "No notes found" : "No recordings yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Start by recording your first meeting or phone call"}
            </p>
            {!searchQuery && (
              <Link to="/record">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        to={`/note/${note.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {note.title}
                      </Link>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDuration(note.duration)}
                        </div>
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(note.id, note.title)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        Summary
                      </Badge>
                      <p className="text-gray-700 text-sm line-clamp-3">
                        {note.summary}
                      </p>
                    </div>
                    {note.transcript && (
                      <div>
                        <Badge variant="outline" className="mb-2">
                          Transcript Preview
                        </Badge>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {note.transcript.substring(0, 200)}
                          {note.transcript.length > 200 && "..."}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
