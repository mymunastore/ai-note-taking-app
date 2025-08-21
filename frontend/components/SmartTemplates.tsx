import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileText, Mail, Calendar, Target, MessageSquare, Download, Copy, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../contexts/AuthContext";

interface SmartTemplatesProps {
  transcript?: string;
  summary?: string;
}

export default function SmartTemplates({ transcript, summary }: SmartTemplatesProps) {
  const backend = useBackend();
  const { toast } = useToast();
  
  const [templateType, setTemplateType] = useState<"email" | "summary" | "action_plan" | "follow_up" | "report">("email");
  const [tone, setTone] = useState<"professional" | "casual" | "urgent" | "friendly">("professional");
  const [length, setLength] = useState<"brief" | "detailed" | "comprehensive">("detailed");
  const [customInstructions, setCustomInstructions] = useState("");
  const [participants, setParticipants] = useState("");
  const [meetingType, setMeetingType] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");

  const generateTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!transcript || !summary) {
        throw new Error("Transcript and summary are required");
      }

      return backend.ai.generateSmartTemplate({
        type: templateType,
        context: {
          transcript,
          summary,
          participants: participants.split(",").map(p => p.trim()).filter(Boolean),
          meeting_type: meetingType,
          custom_instructions: customInstructions
        },
        tone,
        length
      });
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      toast({
        title: "Template Generated",
        description: `Your ${templateType} template has been created successfully.`,
      });
    },
    onError: (error) => {
      console.error("Template generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate template. Please try again.",
        variant: "destructive",
      });
    }
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      toast({
        title: "Copied",
        description: "Template content copied to clipboard.",
      });
    } catch (error) {
      console.error("Copy failed:", error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([generatedContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateType}-template.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="w-4 h-4" />;
      case "summary": return <FileText className="w-4 h-4" />;
      case "action_plan": return <Target className="w-4 h-4" />;
      case "follow_up": return <Calendar className="w-4 h-4" />;
      case "report": return <MessageSquare className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Smart Template Generator
            <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300">
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Configuration */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-foreground">Template Type</Label>
              <Select value={templateType} onValueChange={(value) => setTemplateType(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="summary">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Executive Summary
                    </div>
                  </SelectItem>
                  <SelectItem value="action_plan">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Action Plan
                    </div>
                  </SelectItem>
                  <SelectItem value="follow_up">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Follow-up
                    </div>
                  </SelectItem>
                  <SelectItem value="report">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Meeting Report
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Tone</Label>
              <Select value={tone} onValueChange={(value) => setTone(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Length</Label>
              <Select value={length} onValueChange={(value) => setLength(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Context */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Participants (comma-separated)</Label>
              <Input
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="John Doe, Jane Smith, ..."
                className="bg-background border-border"
              />
            </div>
            <div>
              <Label className="text-foreground">Meeting Type</Label>
              <Input
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                placeholder="e.g., Team Standup, Client Review, ..."
                className="bg-background border-border"
              />
            </div>
          </div>

          <div>
            <Label className="text-foreground">Custom Instructions</Label>
            <Textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Any specific requirements or focus areas for the template..."
              rows={3}
              className="bg-background border-border resize-none"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={() => generateTemplateMutation.mutate()}
            disabled={generateTemplateMutation.isPending || !transcript || !summary}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          >
            {generateTemplateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Template...
              </>
            ) : (
              <>
                {getTemplateIcon(templateType)}
                <span className="ml-2">Generate {templateType.replace("_", " ")} Template</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Template */}
      {generatedContent && (
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                {getTemplateIcon(templateType)}
                Generated {templateType.replace("_", " ")} Template
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                {generatedContent}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
