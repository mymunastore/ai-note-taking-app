import React from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Clock, FileText, Trash2, Mic, Sparkles } from "lucide-react";
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
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
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
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-600" />
              Your Notes
            </h1>
            <p className="text-muted-foreground mt-1">
              {notes.length} {notes.length === 1 ? "recording" : "recordings"}
            </p>
          </div>
          <Link to="/record">
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              New Recording
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search notes and transcripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border focus:border-emerald-500 focus:ring-emerald-500/20"
          />
        </div>

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? "No notes found" : "No recordings yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Start by recording your first meeting or phone call"}
            </p>
            {!searchQuery && (
              <Link to="/record">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id} className="hover:shadow-lg transition-all duration-200 border-border bg-card hover:border-emerald-200 dark:hover:border-emerald-800">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        to={`/note/${note.id}`}
                        className="text-lg font-semibold text-foreground hover:text-emerald-600 transition-colors"
                      >
                        {note.title}
                      </Link>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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
                      className="text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Badge variant="secondary" className="mb-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                        Summary
                      </Badge>
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {note.summary}
                      </p>
                    </div>
                    {note.transcript && (
                      <div>
                        <Badge variant="outline" className="mb-2 border-teal-200 text-teal-700 dark:border-teal-800 dark:text-teal-300">
                          Transcript Preview
                        </Badge>
                        <p className="text-muted-foreground text-sm line-clamp-2">
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
