import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Calendar, Edit3, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import { useNotes } from "../contexts/NotesContext";
import { formatDuration, formatDate } from "../utils/formatters";

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateNote, deleteNote } = useNotes();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState("");
  const [editSummary, setEditSummary] = React.useState("");

  const { data: note, isLoading, error } = useQuery({
    queryKey: ["note", id],
    queryFn: () => backend.notes.get({ id: parseInt(id!) }),
    enabled: !!id,
  });

  React.useEffect(() => {
    if (note) {
      setEditTitle(note.title);
      setEditSummary(note.summary);
    }
  }, [note]);

  const handleSave = async () => {
    if (!note) return;
    
    try {
      await updateNote({
        id: note.id,
        title: editTitle,
        summary: editSummary,
      });
      setIsEditing(false);
      toast({
        title: "Note Updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error("Failed to update note:", error);
      toast({
        title: "Update Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    
    if (window.confirm(`Are you sure you want to delete "${note.title}"?`)) {
      try {
        await deleteNote(note.id);
        navigate("/");
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

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: `${type} copied to clipboard.`,
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Copy Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Note Not Found</h1>
          <p className="text-gray-600 mb-6">The note you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Notes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link to="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-2xl font-bold border-none p-0 h-auto"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{note.title}</h1>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDuration(note.duration)}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(note.createdAt)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Badge className="mr-2">Summary</Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(note.summary, "Summary")}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                rows={6}
                className="resize-none"
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">{note.summary}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transcript */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Badge variant="outline" className="mr-2">Full Transcript</Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(note.transcript, "Transcript")}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {note.transcript}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
