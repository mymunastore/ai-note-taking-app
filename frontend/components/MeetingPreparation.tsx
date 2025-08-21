import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, Users, Clock, Target, FileText, Lightbulb, TrendingUp, CheckCircle, AlertCircle, Plus, X, Sparkles, Brain, Zap, Shield, Settings, BarChart3, Layers, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
    priority: "medium" as "low" | "medium" | "high",
    objectives: [] as string[],
    constraints: [] as string[],
    stakeholderRoles: {} as Record<string, string>,
  });
  
  const [newParticipant, setNewParticipant] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [newConstraint, setNewConstraint] = useState("");
  const [activeTab, setActiveTab] = useState("setup");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const prepareMeetingMutation = useMutation({
    mutationFn: (data: any) => backend.ai.prepareMeeting(data),
    onSuccess: (data) => {
      setActiveTab("results");
      onPreparationComplete?.(data);
      toast({
        title: "Meeting Preparation Complete",
        description: `AI has generated comprehensive meeting materials with ${data.metadata.confidenceScore > 0.8 ? 'high' : data.metadata.confidenceScore > 0.6 ? 'medium' : 'basic'} confidence.`,
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
      analysisDepth: "detailed",
    }),
    enabled: meetingDetails.participants.length > 0 || meetingDetails.topics.length > 0,
  });

  const { data: template } = useQuery({
    queryKey: ["meeting-template", meetingDetails.meetingType, meetingDetails.duration],
    queryFn: () => backend.ai.generateMeetingTemplate({
      meetingType: meetingDetails.meetingType,
      duration: meetingDetails.duration,
      participants: meetingDetails.participants,
      objectives: meetingDetails.objectives,
      complexity: "moderate",
    }),
    enabled: !!meetingDetails.meetingType && meetingDetails.participants.length > 0,
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

  const addObjective = () => {
    if (newObjective.trim() && !meetingDetails.objectives.includes(newObjective.trim())) {
      setMeetingDetails(prev => ({
        ...prev,
        objectives: [...prev.objectives, newObjective.trim()]
      }));
      setNewObjective("");
    }
  };

  const removeObjective = (objective: string) => {
    setMeetingDetails(prev => ({
      ...prev,
      objectives: prev.objectives.filter(o => o !== objective)
    }));
  };

  const addConstraint = () => {
    if (newConstraint.trim() && !meetingDetails.constraints.includes(newConstraint.trim())) {
      setMeetingDetails(prev => ({
        ...prev,
        constraints: [...prev.constraints, newConstraint.trim()]
      }));
      setNewConstraint("");
    }
  };

  const removeConstraint = (constraint: string) => {
    setMeetingDetails(prev => ({
      ...prev,
      constraints: prev.constraints.filter(c => c !== constraint)
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

  const handleKeyPress = (e: React.KeyboardEvent, type: "participant" | "topic" | "objective" | "constraint") => {
    if (e.key === "Enter") {
      e.preventDefault();
      switch (type) {
        case "participant": addParticipant(); break;
        case "topic": addTopic(); break;
        case "objective": addObjective(); break;
        case "constraint": addConstraint(); break;
      }
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
      case "presentation": return <BarChart3 className="w-4 h-4" />;
      case "brainstorm": return <Lightbulb className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <Brain className="w-6 h-6 text-emerald-600" />
          AI Meeting Preparation
          <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300">
            Enhanced
          </Badge>
        </h2>
        <p className="text-muted-foreground mt-2">
          Advanced AI analysis with risk assessment, stakeholder insights, and predictive recommendations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                Enhanced Meeting Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Details */}
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
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="general">General Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-foreground">Priority Level</Label>
                  <Select 
                    value={meetingDetails.priority} 
                    onValueChange={(value: any) => setMeetingDetails(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                <Label className="text-foreground">Discussion Topics</Label>
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

              {/* Objectives */}
              <div>
                <Label className="text-foreground">Meeting Objectives</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {meetingDetails.objectives.map((objective) => (
                    <Badge key={objective} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {objective}
                      <button
                        onClick={() => removeObjective(objective)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "objective")}
                    placeholder="Add meeting objective..."
                    className="bg-background border-border"
                  />
                  <Button
                    onClick={addObjective}
                    variant="outline"
                    size="sm"
                    disabled={!newObjective.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Constraints */}
              <div>
                <Label className="text-foreground">Constraints & Limitations</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {meetingDetails.constraints.map((constraint) => (
                    <Badge key={constraint} variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {constraint}
                      <button
                        onClick={() => removeConstraint(constraint)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newConstraint}
                    onChange={(e) => setNewConstraint(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "constraint")}
                    placeholder="Add constraint or limitation..."
                    className="bg-background border-border"
                  />
                  <Button
                    onClick={addConstraint}
                    variant="outline"
                    size="sm"
                    disabled={!newConstraint.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Custom Context */}
              <div>
                <Label className="text-foreground">Additional Context</Label>
                <Textarea
                  value={meetingDetails.customContext}
                  onChange={(e) => setMeetingDetails(prev => ({ ...prev, customContext: e.target.value }))}
                  placeholder="Any specific objectives, background information, or context for this meeting..."
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
                    Generate Enhanced Preparation
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
                    Advanced Pattern Analysis
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
                      <h4 className="font-semibold text-foreground mb-3">Predictive Insights</h4>
                      <div className="space-y-2">
                        {patterns.predictiveInsights.optimizationSuggestions.slice(0, 3).map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {patterns.insights.seasonalTrends.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-foreground mb-3">Seasonal Trends</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        {patterns.insights.seasonalTrends.map((trend, index) => (
                          <div key={index} className="p-3 bg-muted rounded-lg">
                            <div className="font-medium text-foreground">{trend.period}</div>
                            <div className="text-sm text-muted-foreground">{trend.trend} - {trend.impact}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {patterns.patterns.length > 0 && (
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-foreground">Enhanced Pattern Analysis</CardTitle>
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
                              <Badge variant="outline" className={
                                pattern.trendDirection === "increasing" ? "border-green-500 text-green-700" :
                                pattern.trendDirection === "decreasing" ? "border-red-500 text-red-700" :
                                "border-gray-500 text-gray-700"
                              }>
                                {pattern.trendDirection}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            Average duration: {pattern.averageDuration} min | Participants: {pattern.participants.join(", ")}
                          </div>
                          {pattern.seasonality && (
                            <div className="text-xs text-muted-foreground mb-2">
                              <strong>Seasonality:</strong> {pattern.seasonality}
                            </div>
                          )}
                          {pattern.correlations && pattern.correlations.length > 0 && (
                            <div className="text-xs text-muted-foreground mb-2">
                              <strong>Key Correlations:</strong> {pattern.correlations.map(c => `${c.factor} (${c.significance})`).join(", ")}
                            </div>
                          )}
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
                <p className="text-muted-foreground">Add participants or topics to see advanced pattern analysis</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="template" className="space-y-6">
          {template ? (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  {template.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">{template.description}</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Preparation Checklist</h4>
                    <div className="space-y-2">
                      {template.preparationChecklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Success Factors</h4>
                    <div className="space-y-2">
                      {template.successFactors.map((factor, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Target className="w-4 h-4 text-blue-600" />
                          <span className="text-muted-foreground">{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3">Template Agenda</h4>
                  <div className="space-y-3">
                    {template.agendaTemplate.map((item, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium text-foreground">{item.title}</h5>
                          <Badge variant="outline">{item.estimatedDuration}m</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{item.description}</p>
                        {item.expectedOutcome && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Expected Outcome:</strong> {item.expectedOutcome}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      View Facilitation Tips & Common Pitfalls
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Facilitation Tips</h4>
                      <div className="space-y-2">
                        {template.facilitationTips.map((tip, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Common Pitfalls</h4>
                      <div className="space-y-2">
                        {template.commonPitfalls.map((pitfall, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{pitfall}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-card">
              <CardContent className="pt-6 text-center">
                <Layers className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Select a meeting type and add participants to see template suggestions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {prepareMeetingMutation.data ? (
            <div className="space-y-6">
              {/* Metadata & Confidence */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    Analysis Quality & Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{prepareMeetingMutation.data.metadata.analysisBasedOn.previousMeetings}</div>
                      <div className="text-xs text-muted-foreground">Previous Meetings</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className={`text-lg font-bold ${getConfidenceColor(prepareMeetingMutation.data.metadata.confidenceScore)}`}>
                        {Math.round(prepareMeetingMutation.data.metadata.confidenceScore * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Confidence Score</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-lg font-bold text-purple-600">{prepareMeetingMutation.data.metadata.analysisBasedOn.dataQuality}</div>
                      <div className="text-xs text-muted-foreground">Data Quality</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-lg font-bold text-emerald-600">{prepareMeetingMutation.data.metadata.recommendationStrength}</div>
                      <div className="text-xs text-muted-foreground">Recommendation Strength</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-foreground">Processing Time</span>
                      <span className="text-sm text-muted-foreground">{prepareMeetingMutation.data.metadata.processingTime}ms</span>
                    </div>
                    <Progress value={Math.min(prepareMeetingMutation.data.metadata.confidenceScore * 100, 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Agenda */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    Enhanced Agenda with Dependencies
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
                        
                        {item.expectedOutcome && (
                          <div className="text-xs text-muted-foreground mb-1">
                            <strong>Expected Outcome:</strong> {item.expectedOutcome}
                          </div>
                        )}
                        
                        {item.prerequisites && item.prerequisites.length > 0 && (
                          <div className="text-xs text-muted-foreground mb-1">
                            <strong>Prerequisites:</strong> {item.prerequisites.join(", ")}
                          </div>
                        )}
                        
                        {item.dependencies && item.dependencies.length > 0 && (
                          <div className="text-xs text-muted-foreground mb-1">
                            <strong>Dependencies:</strong> {item.dependencies.join(", ")}
                          </div>
                        )}
                        
                        {item.suggestedOwner && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Owner:</strong> {item.suggestedOwner}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Briefing Document with Risk Assessment */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Enhanced Briefing Document
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Executive Summary</h4>
                    <p className="text-sm text-muted-foreground">{prepareMeetingMutation.data.briefingDocument.executiveSummary}</p>
                  </div>

                  <Separator />

                  {/* Risk Assessment */}
                  {prepareMeetingMutation.data.briefingDocument.riskAssessment.potentialRisks.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Risk Assessment
                      </h4>
                      <div className="space-y-3">
                        {prepareMeetingMutation.data.briefingDocument.riskAssessment.potentialRisks.map((risk: any, index: number) => (
                          <div key={index} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-red-800 dark:text-red-300">{risk.risk}</h5>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="border-red-300 text-red-700">
                                  {risk.probability} probability
                                </Badge>
                                <Badge variant="outline" className="border-red-300 text-red-700">
                                  {risk.impact} impact
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-red-700 dark:text-red-300">
                              <strong>Mitigation:</strong> {risk.mitigation}
                            </p>
                          </div>
                        ))}
                      </div>
                      
                      {prepareMeetingMutation.data.briefingDocument.riskAssessment.contingencyPlans.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-medium text-foreground mb-2">Contingency Plans</h5>
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {prepareMeetingMutation.data.briefingDocument.riskAssessment.contingencyPlans.map((plan: string, idx: number) => (
                              <li key={idx}>{plan}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* Enhanced Key Topics */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Enhanced Topic Analysis</h4>
                    <div className="space-y-3">
                      {prepareMeetingMutation.data.briefingDocument.keyTopics.map((topic: any, index: number) => (
                        <Collapsible key={index}>
                          <CollapsibleTrigger asChild>
                            <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium text-foreground">{topic.topic}</h5>
                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{topic.summary}</p>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 p-3 bg-background rounded-lg border border-border">
                            {topic.keyPoints.length > 0 && (
                              <div className="mb-3">
                                <strong className="text-sm text-foreground">Key Points:</strong>
                                <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                                  {topic.keyPoints.map((point: string, idx: number) => (
                                    <li key={idx}>{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {topic.riskFactors && topic.riskFactors.length > 0 && (
                              <div className="mb-3">
                                <strong className="text-sm text-foreground">Risk Factors:</strong>
                                <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 mt-1">
                                  {topic.riskFactors.map((risk: string, idx: number) => (
                                    <li key={idx}>{risk}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {topic.opportunities && topic.opportunities.length > 0 && (
                              <div className="mb-3">
                                <strong className="text-sm text-foreground">Opportunities:</strong>
                                <ul className="list-disc list-inside text-sm text-green-600 dark:text-green-400 mt-1">
                                  {topic.opportunities.map((opp: string, idx: number) => (
                                    <li key={idx}>{opp}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {topic.stakeholderPositions && Object.keys(topic.stakeholderPositions).length > 0 && (
                              <div>
                                <strong className="text-sm text-foreground">Stakeholder Positions:</strong>
                                <div className="mt-1 space-y-1">
                                  {Object.entries(topic.stakeholderPositions).map(([stakeholder, position]: [string, any], idx: number) => (
                                    <div key={idx} className="text-sm text-muted-foreground">
                                      <strong>{stakeholder}:</strong> {position}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Enhanced Participant Context */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Enhanced Participant Analysis</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {prepareMeetingMutation.data.briefingDocument.participantContext.map((participant: any, index: number) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-foreground">{participant.participant}</div>
                            {participant.influenceLevel && (
                              <Badge variant="outline" className={
                                participant.influenceLevel === "high" ? "border-red-300 text-red-700" :
                                participant.influenceLevel === "medium" ? "border-yellow-300 text-yellow-700" :
                                "border-green-300 text-green-700"
                              }>
                                {participant.influenceLevel} influence
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">{participant.preferredCommunicationStyle}</div>
                          
                          {participant.expertise.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {participant.expertise.map((exp: string) => (
                                <Badge key={exp} variant="secondary" className="text-xs">{exp}</Badge>
                              ))}
                            </div>
                          )}
                          
                          {participant.potentialConcerns && participant.potentialConcerns.length > 0 && (
                            <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">
                              <strong>Concerns:</strong> {participant.potentialConcerns.join(", ")}
                            </div>
                          )}
                          
                          {participant.preparationNeeds && participant.preparationNeeds.length > 0 && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              <strong>Prep Needs:</strong> {participant.preparationNeeds.join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alternative Meeting Formats */}
              {prepareMeetingMutation.data.alternativeFormats.length > 0 && (
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-600" />
                      Alternative Meeting Formats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {prepareMeetingMutation.data.alternativeFormats.map((format: any, index: number) => (
                        <div key={index} className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-foreground">{format.format}</h4>
                            <Badge variant="outline">
                              {Math.round(format.suitability * 100)}% match
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{format.description}</p>
                          <div>
                            <strong className="text-sm text-foreground">Benefits:</strong>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                              {format.benefits.map((benefit: string, idx: number) => (
                                <li key={idx}>{benefit}</li>
                              ))}
                            </ul>
                          </div>
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
                <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Complete the setup to see AI-generated meeting preparation materials</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {prepareMeetingMutation.data ? (
            <div className="space-y-6">
              {/* Enhanced Recommendations */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    Enhanced AI Recommendations
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
                      <h4 className="font-semibold text-foreground mb-3">Enhanced Preparation Tasks</h4>
                      <div className="space-y-2">
                        {prepareMeetingMutation.data.recommendations.preparationTasks.map((task: any, index: number) => (
                          <div key={index} className="flex items-start gap-2 text-sm p-2 bg-muted rounded">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-foreground">{task.task}</div>
                              <div className="text-xs text-muted-foreground">
                                {task.assignee && `Assignee: ${task.assignee} | `}
                                Deadline: {task.deadline} | 
                                Priority: {task.priority} | 
                                Effort: {task.estimatedEffort}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Enhanced Challenge Analysis</h4>
                      <div className="space-y-2">
                        {prepareMeetingMutation.data.recommendations.potentialChallenges.map((challenge: any, index: number) => (
                          <div key={index} className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">{challenge.challenge}</span>
                              <Badge variant="outline" className="border-yellow-300 text-yellow-700 text-xs">
                                {challenge.likelihood} likelihood
                              </Badge>
                            </div>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 ml-6">
                              <strong>Mitigation:</strong> {challenge.mitigation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Enhanced Success Metrics</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {prepareMeetingMutation.data.recommendations.successMetrics.map((metric: any, index: number) => (
                        <div key={index} className="p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800 dark:text-green-300">{metric.metric}</span>
                          </div>
                          <div className="text-xs text-green-700 dark:text-green-300">
                            <strong>Target:</strong> {metric.target}
                          </div>
                          <div className="text-xs text-green-700 dark:text-green-300">
                            <strong>Measurement:</strong> {metric.measurement}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Follow-up Actions</h4>
                    <div className="space-y-2">
                      {prepareMeetingMutation.data.recommendations.followUpActions.map((action: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                          <ArrowRight className="w-4 h-4 text-blue-600" />
                          <div className="flex-1">
                            <span className="text-sm text-blue-800 dark:text-blue-300">{action.action}</span>
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              Timeline: {action.timeline}
                              {action.owner && ` | Owner: ${action.owner}`}
                            </div>
                          </div>
                        </div>
                      ))}
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
