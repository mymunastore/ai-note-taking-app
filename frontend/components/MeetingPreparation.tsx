import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, Users, Clock, Target, FileText, Lightbulb, TrendingUp, CheckCircle, AlertCircle, Plus, X, Sparkles, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../contexts/AuthContext";

interface MeetingPreparationProps {
  onPreparationComplete?: (data: any) => void;
}

export default function MeetingPreparation({ onPreparationComplete }: MeetingPreparationProps) {
  const backend = useBackend();
  const { toast } = useToast();
  
  const [meetingDetails, setMeetingDetails] = useState({
    participants: [] as string[],
    topics: [] as string[],
    meetingType: "",
    duration: 60,
    customContext: "",
  });
  
  const [newParticipant, setNewParticipant] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [activeTab, setActiveTab] = useState("setup");

  const prepareMeetingMutation = useMutation({
    mutationFn: (data: any) => backend.ai.prepareMeeting(data),
    onSuccess: (data) => {
      setActiveTab("results");
      onPreparationComplete?.(data);
      toast({
        title: "Meeting Preparation Complete",
        description: "AI has generated comprehensive meeting materials for you.",
      });
    },
    onError: (error) => {
      console.error("Meeting preparation error:", error);
      toast({
        title: "Preparation Failed",
        description: "Failed to prepare meeting materials. Please try again.",
        variant: "destructive",
      });
    }
  });

  const { data: patterns } = useQuery({
    queryKey: ["meeting-patterns", meetingDetails.participants, meetingDetails.topics],
    queryFn: () => backend.ai.analyzeMeetingPatterns({
      participants: meetingDetails.participants,
      topics: meetingDetails.topics,
      timeframe: "quarter",
      includeOutcomes: true,
    }),
    enabled: meetingDetails.participants.length > 0 || meetingDetails.topics.length > 0,
  });

  const addParticipant = () => {
    if (newParticipant.trim() && !meetingDetails.participants.includes(newParticipant.trim())) {
      setMeetingDetails(prev => ({
        ...prev,
        participants: [...prev.participants, newParticipant.trim()]
      }));
      setNewParticipant("");
    }
  };

  const removeParticipant = (participant: string) => {
    setMeetingDetails(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== participant)
    }));
  };

  const addTopic = () => {
    if (newTopic.trim() && !meetingDetails.topics.includes(newTopic.trim())) {
      setMeetingDetails(prev => ({
        ...prev,
        topics: [...prev.topics, newTopic.trim()]
      }));
      setNewTopic("");
    }
  };

  const removeTopic = (topic: string) => {
    setMeetingDetails(prev => ({
      ...prev,
      topics: prev.topics.filter(t => t !== topic)
    }));
  };

  const handlePrepareMeeting = () => {
    if (meetingDetails.participants.length === 0 && meetingDetails.topics.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add at least one participant or topic to prepare the meeting.",
        variant: "destructive",
      });
      return;
    }

    prepareMeetingMutation.mutate(meetingDetails);
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: "participant" | "topic") => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (type === "participant") {
        addParticipant();
      } else {
        addTopic();
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-950/50 dark:text-gray-300";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "discussion": return <Users className="w-4 h-4" />;
      case "decision": return <CheckCircle className="w-4 h-4" />;
      case "update": return <FileText className="w-4 h-4" />;
      case "action_review": return <Target className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <Brain className="w-6 h-6 text-emerald-600" />
          AI Meeting Preparation
          <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300">
            Smart Assistant
          </Badge>
        </h2>
        <p className="text-muted-foreground mt-2">
          Let AI analyze your meeting history to suggest agendas, prepare briefings, and recommend discussion points
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Meeting Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Participants */}
              <div>
                <Label className="text-foreground">Participants</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {meetingDetails.participants.map((participant) => (
                    <Badge key={participant} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                      <Users className="w-3 h-3 mr-1" />
                      {participant}
                      <button
                        onClick={() => removeParticipant(participant)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newParticipant}
                    onChange={(e) => setNewParticipant(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "participant")}
                    placeholder="Add participant name..."
                    className="bg-background border-border"
                  />
                  <Button
                    onClick={addParticipant}
                    variant="outline"
                    size="sm"
                    disabled={!newParticipant.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Topics */}
              <div>
                <Label className="text-foreground">Topics</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {meetingDetails.topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300">
                      <Target className="w-3 h-3 mr-1" />
                      {topic}
                      <button
                        onClick={() => removeTopic(topic)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "topic")}
                    placeholder="Add discussion topic..."
                    className="bg-background border-border"
                  />
                  <Button
                    onClick={addTopic}
                    variant="outline"
                    size="sm"
                    disabled={!newTopic.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Meeting Type and Duration */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground">Meeting Type</Label>
                  <Select 
                    value={meetingDetails.meetingType} 
                    onValueChange={(value) => setMeetingDetails(prev => ({ ...prev, meetingType: value }))}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select meeting type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standup">Daily Standup</SelectItem>
                      <SelectItem value="planning">Planning Session</SelectItem>
                      <SelectItem value="review">Review Meeting</SelectItem>
                      <SelectItem value="retrospective">Retrospective</SelectItem>
                      <SelectItem value="one-on-one">One-on-One</SelectItem>
                      <SelectItem value="brainstorm">Brainstorming</SelectItem>
                      <SelectItem value="decision">Decision Making</SelectItem>
                      <SelectItem value="update">Status Update</SelectItem>
                      <SelectItem value="general">General Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-foreground">Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={meetingDetails.duration}
                    onChange={(e) => setMeetingDetails(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                    min="15"
                    max="480"
                    className="bg-background border-border"
                  />
                </div>
              </div>

              {/* Custom Context */}
              <div>
                <Label className="text-foreground">Additional Context</Label>
                <Textarea
                  value={meetingDetails.customContext}
                  onChange={(e) => setMeetingDetails(prev => ({ ...prev, customContext: e.target.value }))}
                  placeholder="Any specific objectives, constraints, or context for this meeting..."
                  rows={3}
                  className="bg-background border-border resize-none"
                />
              </div>

              <Button
                onClick={handlePrepareMeeting}
                disabled={prepareMeetingMutation.isPending || (meetingDetails.participants.length === 0 && meetingDetails.topics.length === 0)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                size="lg"
              >
                {prepareMeetingMutation.isPending ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Meeting History...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-2" />
                    Prepare Meeting with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          {patterns ? (
            <div className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Meeting Patterns Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Key Insights</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">Optimal Meeting Length</span>
                          <Badge variant="secondary">{patterns.insights.optimalMeetingLength} min</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">Best Time Slots</span>
                          <div className="flex gap-1">
                            {patterns.insights.bestTimeSlots.slice(0, 2).map((time) => (
                              <Badge key={time} variant="outline" className="text-xs">{time}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">Most Productive Types</span>
                          <div className="flex gap-1">
                            {patterns.insights.mostProductiveMeetingTypes.slice(0, 2).map((type) => (
                              <Badge key={type} variant="outline" className="text-xs">{type}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Recommendations</h4>
                      <div className="space-y-2">
                        {patterns.recommendations.slice(0, 3).map((rec, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {patterns.patterns.length > 0 && (
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-foreground">Identified Patterns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {patterns.patterns.map((pattern, index) => (
                        <div key={index} className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-foreground">{pattern.pattern}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{pattern.frequency}x</Badge>
                              <Badge className={pattern.successRate > 0.7 ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300"}>
                                {Math.round(pattern.successRate * 100)}% success
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            Average duration: {pattern.averageDuration} min | Participants: {pattern.participants.join(", ")}
                          </div>
                          {pattern.recommendations.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium text-foreground">Recommendations: </span>
                              <span className="text-muted-foreground">{pattern.recommendations.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="border-border bg-card">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Add participants or topics to see meeting patterns analysis</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {prepareMeetingMutation.data ? (
            <div className="space-y-6">
              {/* Suggested Agenda */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    Suggested Agenda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {prepareMeetingMutation.data.suggestedAgenda.map((item: any, index: number) => (
                      <div key={index} className="p-4 bg-muted rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(item.category)}
                            <h4 className="font-medium text-foreground">{item.title}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" />
                              {item.estimatedDuration}m
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        {item.suggestedOwner && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Owner:</strong> {item.suggestedOwner}
                          </div>
                        )}
                        {item.backgroundInfo && (
                          <div className="text-xs text-muted-foreground mt-1">
                            <strong>Background:</strong> {item.backgroundInfo}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Briefing Document */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Briefing Document
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Executive Summary</h4>
                    <p className="text-sm text-muted-foreground">{prepareMeetingMutation.data.briefingDocument.executiveSummary}</p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Key Topics</h4>
                    <div className="space-y-3">
                      {prepareMeetingMutation.data.briefingDocument.keyTopics.map((topic: any, index: number) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <h5 className="font-medium text-foreground mb-1">{topic.topic}</h5>
                          <p className="text-sm text-muted-foreground mb-2">{topic.summary}</p>
                          {topic.keyPoints.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              <strong>Key Points:</strong> {topic.keyPoints.join(", ")}
                            </div>
                          )}
                          {topic.actionItemsFromPrevious && topic.actionItemsFromPrevious.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              <strong>Previous Action Items:</strong> {topic.actionItemsFromPrevious.join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Previous Meeting Insights</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Meetings:</span>
                          <span className="text-foreground">{prepareMeetingMutation.data.briefingDocument.previousMeetingInsights.totalMeetings}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Common Topics:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {prepareMeetingMutation.data.briefingDocument.previousMeetingInsights.commonTopics.map((topic: string) => (
                              <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
                            ))}
                          </div>
                        </div>
                        {prepareMeetingMutation.data.briefingDocument.previousMeetingInsights.outstandingActionItems.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">Outstanding Action Items:</span>
                            <ul className="list-disc list-inside text-xs text-muted-foreground mt-1">
                              {prepareMeetingMutation.data.briefingDocument.previousMeetingInsights.outstandingActionItems.map((item: string, idx: number) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Participant Context</h4>
                      <div className="space-y-2">
                        {prepareMeetingMutation.data.briefingDocument.participantContext.map((participant: any, index: number) => (
                          <div key={index} className="p-2 bg-muted rounded text-xs">
                            <div className="font-medium text-foreground">{participant.participant}</div>
                            <div className="text-muted-foreground">{participant.preferredCommunicationStyle}</div>
                            {participant.expertise.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {participant.expertise.map((exp: string) => (
                                  <Badge key={exp} variant="secondary" className="text-xs">{exp}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Discussion Points */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-emerald-600" />
                    Discussion Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {prepareMeetingMutation.data.discussionPoints.map((point: any, index: number) => (
                      <div key={index} className="p-4 bg-muted rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-foreground">{point.question}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{point.expectedOutcome}</Badge>
                            <Badge className={point.difficulty === "complex" ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300" : point.difficulty === "medium" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300" : "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300"}>
                              {point.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{point.context}</p>
                        {point.stakeholders.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Key Stakeholders:</strong> {point.stakeholders.join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-border bg-card">
              <CardContent className="pt-6 text-center">
                <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Complete the setup to see AI-generated meeting preparation materials</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {prepareMeetingMutation.data ? (
            <div className="space-y-6">
              {/* Recommendations */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Meeting Structure</h4>
                    <p className="text-sm text-muted-foreground">{prepareMeetingMutation.data.recommendations.meetingStructure}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Time Allocation</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(prepareMeetingMutation.data.recommendations.timeAllocation).map(([phase, minutes]) => (
                        <div key={phase} className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-bold text-emerald-600">{minutes as number}m</div>
                          <div className="text-xs text-muted-foreground capitalize">{phase.replace("_", " ")}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Preparation Tasks</h4>
                      <div className="space-y-2">
                        {prepareMeetingMutation.data.recommendations.preparationTasks.map((task: any, index: number) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-foreground">{task.task}</div>
                              <div className="text-xs text-muted-foreground">
                                {task.assignee && `Assignee: ${task.assignee} | `}
                                Deadline: {task.deadline}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Potential Challenges</h4>
                      <div className="space-y-2">
                        {prepareMeetingMutation.data.recommendations.potentialChallenges.map((challenge: string, index: number) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{challenge}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Success Metrics</h4>
                    <div className="grid md:grid-cols-2 gap-2">
                      {prepareMeetingMutation.data.recommendations.successMetrics.map((metric: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Target className="w-4 h-4 text-blue-600" />
                          <span className="text-muted-foreground">{metric}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Analysis Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{prepareMeetingMutation.data.metadata.analysisBasedOn.previousMeetings}</div>
                      <div className="text-xs text-muted-foreground">Previous Meetings</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-lg font-bold text-purple-600">{Math.round(prepareMeetingMutation.data.metadata.confidenceScore * 100)}%</div>
                      <div className="text-xs text-muted-foreground">Confidence Score</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-lg font-bold text-emerald-600">{Math.round(prepareMeetingMutation.data.metadata.analysisBasedOn.topicRelevance * 100)}%</div>
                      <div className="text-xs text-muted-foreground">Topic Relevance</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-border bg-card">
              <CardContent className="pt-6 text-center">
                <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Generate meeting preparation to see detailed insights and recommendations</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
