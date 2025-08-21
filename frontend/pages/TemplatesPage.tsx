import React, { useState } from "react";
import { FileText, Sparkles, BookOpen, ClipboardPaste } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SmartTemplates from "../components/SmartTemplates";
import { useNotes } from "../contexts/NotesContext";

export default function TemplatesPage() {
  const { notes, isLoading } = useNotes();
  const [source, setSource] = useState<'note' | 'paste'>('note');
  const [selectedNoteId, setSelectedNoteId] = useState<string>("");
  const [pastedTranscript, setPastedTranscript] = useState("");
  const [pastedSummary, setPastedSummary] = useState("");

  const selectedNote = notes.find(note => note.id === Number(selectedNoteId));

  const transcript = source === 'note' ? selectedNote?.transcript : pastedTranscript;
  const summary = source === 'note' ? selectedNote?.summary : pastedSummary;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-8 h-8 text-emerald-600" />
            Smart Templates
            <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300">
              AI-Powered
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate professional templates from your meeting content using AI
          </p>
        </div>

        {/* Context Source Selection */}
        <Card className="mb-6 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Template Context</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={source} onValueChange={(value) => setSource(value as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="note">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Use Existing Note
                </TabsTrigger>
                <TabsTrigger value="paste">
                  <ClipboardPaste className="w-4 h-4 mr-2" />
                  Paste Content
                </TabsTrigger>
              </TabsList>
              <TabsContent value="note" className="pt-4">
                {isLoading ? (
                  <p>Loading notes...</p>
                ) : notes.length > 0 ? (
                  <Select value={selectedNoteId} onValueChange={setSelectedNoteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a note to use as context..." />
                    </SelectTrigger>
                    <SelectContent>
                      {notes.map(note => (
                        <SelectItem key={note.id} value={String(note.id)}>
                          {note.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No notes available. Record a meeting or paste content to get started.
                  </p>
                )}
              </TabsContent>
              <TabsContent value="paste" className="pt-4 space-y-4">
                <div>
                  <Label htmlFor="pasted-summary">Summary</Label>
                  <Textarea
                    id="pasted-summary"
                    value={pastedSummary}
                    onChange={(e) => setPastedSummary(e.target.value)}
                    placeholder="Paste the meeting summary here..."
                    rows={4}
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="pasted-transcript">Transcript</Label>
                  <Textarea
                    id="pasted-transcript"
                    value={pastedTranscript}
                    onChange={(e) => setPastedTranscript(e.target.value)}
                    placeholder="Paste the full meeting transcript here..."
                    rows={8}
                    className="bg-background border-border"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Smart Templates Component */}
        <SmartTemplates transcript={transcript} summary={summary} />
      </div>
    </div>
  );
}
