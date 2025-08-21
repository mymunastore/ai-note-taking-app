import React from "react";
import { Link } from "react-router-dom";
import { Plus, Clock, FileText, Mic, Sparkles, Languages, Download, MoreVertical, Tag, Users, Globe, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useNotes } from "../contexts/NotesContext";
import { useAuth } from "../contexts/AuthContext";
import { formatDuration, formatDate } from "../utils/formatters";
import ChatBot from "../components/ChatBot";
import AdvancedSearch from "../components/AdvancedSearch";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

export default function NotesListPage() {
  const { notes, isLoading, searchQuery, setSearchQuery, deleteNote } = useNotes();
  const { organization } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("notes");

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

  const handleExport = (note: any, format: string) => {
    // In a real app, this would generate and download the file
    toast({
      title: "Export Started",
      description: `Exporting "${note.title}" as ${format.toUpperCase()}...`,
    });
  };

  const handleAdvancedSearch = (query: string, filters: any) => {
    setSearchQuery(query);
    // Apply additional filters here
    console.log("Advanced search:", { query, filters });
  };

  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      ru: "Russian",
      ja: "Japanese",
      ko: "Korean",
      zh: "Chinese",
      ar: "Arabic",
      hi: "Hindi",
    };
    return languages[code] || code.toUpperCase();
  };

  // Get all unique tags from notes
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  // Filter and sort notes
  const filteredAndSortedNotes = React.useMemo(() => {
    return notes.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notes]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
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

  const allNotesContext = notes.length > 0 
    ? `User's notes collection:\n${notes.map(note => `- ${note.title}: ${note.summary.substring(0, 200)}...`).join('\n')}`
    : undefined;

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-600" />
              SCRIBE AI Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your recordings, analyze insights, and discover patterns
            </p>
          </div>
          <Link to="/record">
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              New Recording
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes ({filteredAndSortedNotes.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-6">
            {/* Advanced Search */}
            <AdvancedSearch
              onSearch={handleAdvancedSearch}
              availableTags={allTags}
              isLoading={isLoading}
            />

            {/* Organization Filter */}
            {organization && (
              <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Showing notes from <strong>{organization.name}</strong>
                </span>
              </div>
            )}

            {/* Notes List */}
            {filteredAndSortedNotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchQuery ? "No notes found" : "No recordings yet"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? "Try adjusting your search terms or filters"
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
              <div className="grid gap-4">
                {filteredAndSortedNotes.map((note) => (
                  <Card key={note.id} className="hover:shadow-lg transition-all duration-200 border-border bg-card hover:border-emerald-200 dark:hover:border-emerald-800 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Link
                              to={`/note/${note.id}`}
                              className="text-lg font-semibold text-foreground hover:text-emerald-600 transition-colors"
                            >
                              {note.title}
                            </Link>
                            {note.isPublic && (
                              <Badge variant="outline" className="text-xs">
                                <Globe className="w-3 h-3 mr-1" />
                                Public
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatDuration(note.duration)}
                            </div>
                            <span>{formatDate(note.createdAt)}</span>
                            {note.originalLanguage && note.originalLanguage !== "en" && (
                              <div className="flex items-center">
                                <Languages className="w-4 h-4 mr-1" />
                                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 px-2 py-1 rounded">
                                  {getLanguageName(note.originalLanguage)} → EN
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Tags */}
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {note.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleExport(note, "pdf")}>
                                Export as PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExport(note, "docx")}>
                                Export as DOCX
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExport(note, "txt")}>
                                Export as TXT
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Link to={`/note/${note.id}`} className="w-full">
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>Share Note</DropdownMenuItem>
                              <DropdownMenuItem>Add to Project</DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(note.id, note.title)}
                              >
                                Delete Note
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
                              {note.translated ? "Translated Preview" : "Transcript Preview"}
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
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>

        {/* ChatBot with context */}
        <ChatBot context={allNotesContext} />
      </div>
    </div>
  );
}
