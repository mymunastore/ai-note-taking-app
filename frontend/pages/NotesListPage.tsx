import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Clock, FileText, Mic, Sparkles, Languages, MoreVertical, Tag, BarChart3, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useNotes } from "../contexts/NotesContext";
import { useAnalytics } from "../contexts/AnalyticsContext";
import { usePageTracking } from "../hooks/usePageTracking";
import { formatDuration, formatDate } from "../utils/formatters";
import ChatBot from "../components/ChatBot";
import AdvancedAnalytics from "../components/AdvancedAnalytics";
import SmartInsights from "../components/SmartInsights";
import ExportDialog from "../components/ExportDialog";
import SearchFilters from "../components/SearchFilters";
import VoiceCommands from "../components/VoiceCommands";
import KeyboardShortcuts from "../components/KeyboardShortcuts";
import PerformanceMonitor from "../components/PerformanceMonitor";

export default function NotesListPage() {
  const { notes, isLoading, searchQuery, setSearchQuery, deleteNote } = useNotes();
  const { trackEvent } = useAnalytics();
  const { toast } = useToast();
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
  const [searchFilters, setSearchFilters] = useState<any>({});
  const [activeTab, setActiveTab] = useState("notes");

  // Track page view
  usePageTracking();

  const handleDelete = async (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteNote(id);
        setSelectedNotes(prev => prev.filter(noteId => noteId !== id));
        trackEvent("note_deleted", { noteId: id, title });
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

  const handleBulkDelete = async () => {
    if (selectedNotes.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedNotes.length} selected notes?`)) {
      try {
        await Promise.all(selectedNotes.map(id => deleteNote(id)));
        trackEvent("notes_bulk_deleted", { count: selectedNotes.length });
        setSelectedNotes([]);
        toast({
          title: "Notes Deleted",
          description: `Successfully deleted ${selectedNotes.length} notes.`,
        });
      } catch (error) {
        console.error("Failed to delete notes:", error);
        toast({
          title: "Delete Error",
          description: "Failed to delete some notes. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const toggleNoteSelection = (noteId: number) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const selectAllNotes = () => {
    if (selectedNotes.length === filteredAndSortedNotes.length) {
      setSelectedNotes([]);
    } else {
      setSelectedNotes(filteredAndSortedNotes.map(note => note.id));
    }
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

  const filteredAndSortedNotes = React.useMemo(() => {
    let filtered = notes;

    // Apply search filters
    if (searchFilters.dateFrom) {
      filtered = filtered.filter(note => new Date(note.createdAt) >= searchFilters.dateFrom);
    }
    if (searchFilters.dateTo) {
      filtered = filtered.filter(note => new Date(note.createdAt) <= searchFilters.dateTo);
    }
    if (searchFilters.minDuration) {
      filtered = filtered.filter(note => note.duration >= searchFilters.minDuration);
    }
    if (searchFilters.maxDuration) {
      filtered = filtered.filter(note => note.duration <= searchFilters.maxDuration);
    }
    if (searchFilters.language) {
      filtered = filtered.filter(note => note.originalLanguage === searchFilters.language);
    }
    if (searchFilters.tags && searchFilters.tags.length > 0) {
      filtered = filtered.filter(note => 
        searchFilters.tags.some((tag: string) => note.tags?.includes(tag))
      );
    }

    return filtered.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notes, searchFilters]);

  // Get available tags and languages for filters
  const availableTags = React.useMemo(() => {
    const allTags = notes.flatMap(note => note.tags || []);
    return [...new Set(allTags)].sort();
  }, [notes]);

  const availableLanguages = React.useMemo(() => {
    const allLanguages = notes
      .map(note => note.originalLanguage)
      .filter(Boolean)
      .map(lang => getLanguageName(lang!));
    return [...new Set(allLanguages)].sort();
  }, [notes]);

  // Track tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    trackEvent("dashboard_tab_changed", { tab });
  };

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
          <div className="flex items-center gap-2">
            {selectedNotes.length > 0 && (
              <>
                <ExportDialog 
                  selectedNotes={selectedNotes}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export ({selectedNotes.length})
                    </Button>
                  }
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700 hover:border-red-500"
                >
                  Delete ({selectedNotes.length})
                </Button>
              </>
            )}
            <Link to="/record" onClick={() => trackEvent("new_recording_clicked", { source: "dashboard" })}>
              <Button 
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Recording
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes ({filteredAndSortedNotes.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background border-border"
                    />
                  </div>
                </div>
                <SearchFilters
                  filters={searchFilters}
                  onFiltersChange={setSearchFilters}
                  availableTags={availableTags}
                  availableLanguages={availableLanguages}
                />
                <ExportDialog />
              </div>

              {filteredAndSortedNotes.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedNotes.length === filteredAndSortedNotes.length}
                    onCheckedChange={selectAllNotes}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedNotes.length > 0 
                      ? `${selectedNotes.length} of ${filteredAndSortedNotes.length} selected`
                      : `Select all ${filteredAndSortedNotes.length} notes`
                    }
                  </span>
                </div>
              )}
            </div>

            {filteredAndSortedNotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchQuery || Object.keys(searchFilters).length > 0 ? "No notes found" : "No recordings yet"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || Object.keys(searchFilters).length > 0
                    ? "Try adjusting your search terms or filters"
                    : "Start by recording your first meeting or phone call"}
                </p>
                {!searchQuery && Object.keys(searchFilters).length === 0 && (
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
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={selectedNotes.includes(note.id)}
                            onCheckedChange={() => toggleNoteSelection(note.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Link
                                to={`/note/${note.id}`}
                                className="text-lg font-semibold text-foreground hover:text-emerald-600 transition-colors"
                              >
                                {note.title}
                              </Link>
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
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent value="insights">
            <SmartInsights />
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <VoiceCommands />
              <KeyboardShortcuts />
            </div>
          </TabsContent>
        </Tabs>

        <ChatBot context={allNotesContext} />
        <PerformanceMonitor />
      </div>
    </div>
  );
}
