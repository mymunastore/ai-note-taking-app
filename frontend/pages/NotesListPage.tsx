import React from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Clock, FileText, Trash2, Mic, Sparkles, Languages, Filter, Download, MoreVertical, Tag, Users, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useNotes } from "../contexts/NotesContext";
import { useAuth } from "../contexts/AuthContext";
import { formatDuration, formatDate } from "../utils/formatters";
import ChatBot from "../components/ChatBot";

export default function NotesListPage() {
  const { notes, isLoading, searchQuery, setSearchQuery, selectedTags, setSelectedTags, organizationOnly, setOrganizationOnly, deleteNote } = useNotes();
  const { organization } = useAuth();
  const { toast } = useToast();
  const [sortBy, setSortBy] = React.useState("newest");
  const [filterBy, setFilterBy] = React.useState("all");

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

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Get all unique tags from notes
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  // Filter and sort notes
  const filteredAndSortedNotes = React.useMemo(() => {
    let filtered = notes;

    // Apply filters
    if (filterBy === "translated") {
      filtered = notes.filter(note => note.translated);
    } else if (filterBy === "english") {
      filtered = notes.filter(note => !note.translated);
    } else if (filterBy === "public") {
      filtered = notes.filter(note => note.isPublic);
    } else if (filterBy === "private") {
      filtered = notes.filter(note => !note.isPublic);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "duration":
          return b.duration - a.duration;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [notes, filterBy, sortBy]);

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

  const allNotesContext = notes.length > 0 
    ? `User's notes collection:\n${notes.map(note => `- ${note.title}: ${note.summary.substring(0, 200)}...`).join('\n')}`
    : undefined;

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
              {filteredAndSortedNotes.length} {filteredAndSortedNotes.length === 1 ? "recording" : "recordings"}
              {(filterBy !== "all" || selectedTags.length > 0 || organizationOnly) && ` (filtered)`}
            </p>
          </div>
          <Link to="/record">
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              New Recording
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search notes and transcripts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-40 bg-background border-border">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Notes</SelectItem>
                  <SelectItem value="translated">Translated</SelectItem>
                  <SelectItem value="english">English Only</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Organization Filter */}
          {organization && (
            <div className="flex items-center gap-2">
              <Switch
                id="organization-only"
                checked={organizationOnly}
                onCheckedChange={setOrganizationOnly}
              />
              <Label htmlFor="organization-only" className="text-sm text-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Show only {organization.name} notes
              </Label>
            </div>
          )}

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div>
              <Label className="text-sm text-foreground mb-2 block">Filter by tags:</Label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notes List */}
        {filteredAndSortedNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery || filterBy !== "all" || selectedTags.length > 0 || organizationOnly ? "No notes found" : "No recordings yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || filterBy !== "all" || selectedTags.length > 0 || organizationOnly
                ? "Try adjusting your search terms or filters"
                : "Start by recording your first meeting or phone call"}
            </p>
            {!searchQuery && filterBy === "all" && selectedTags.length === 0 && !organizationOnly && (
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
                      {note.tags.length > 0 && (
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

        {/* ChatBot with context */}
        <ChatBot context={allNotesContext} />
      </div>
    </div>
  );
}
