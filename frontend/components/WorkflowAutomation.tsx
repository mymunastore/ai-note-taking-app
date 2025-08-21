import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Play, Pause, Settings, Trash2, Edit, Zap, Mail, MessageSquare, Calendar, Webhook, Brain, Target, Users, Clock, Tag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../contexts/AuthContext";

interface WorkflowTrigger {
  type: "keyword" | "sentiment" | "speaker" | "duration" | "topic" | "action_item";
  condition: string;
  value?: string | number;
}

interface WorkflowAction {
  type: "email" | "slack" | "calendar" | "task" | "webhook" | "ai_analysis";
  config: Record<string, any>;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  enabled: boolean;
  created_at: Date;
  last_triggered?: Date;
  execution_count: number;
}

export default function WorkflowAutomation() {
  const backend = useBackend();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    triggers: [] as WorkflowTrigger[],
    actions: [] as WorkflowAction[],
    enabled: true
  });

  const { data: workflows, isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: () => backend.ai.listWorkflows().then(res => res.workflows),
  });

  const createWorkflowMutation = useMutation({
    mutationFn: (workflow: any) => backend.ai.createWorkflow(workflow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      setIsCreateDialogOpen(false);
      resetNewWorkflow();
      toast({
        title: "Workflow Created",
        description: "Your automation workflow has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workflow. Please try again.",
        variant: "destructive",
      });
    }
  });

  const resetNewWorkflow = () => {
    setNewWorkflow({
      name: "",
      description: "",
      triggers: [],
      actions: [],
      enabled: true
    });
  };

  const addTrigger = () => {
    setNewWorkflow(prev => ({
      ...prev,
      triggers: [...prev.triggers, { type: "keyword", condition: "" }]
    }));
  };

  const updateTrigger = (index: number, trigger: WorkflowTrigger) => {
    setNewWorkflow(prev => ({
      ...prev,
      triggers: prev.triggers.map((t, i) => i === index ? trigger : t)
    }));
  };

  const removeTrigger = (index: number) => {
    setNewWorkflow(prev => ({
      ...prev,
      triggers: prev.triggers.filter((_, i) => i !== index)
    }));
  };

  const addAction = () => {
    setNewWorkflow(prev => ({
      ...prev,
      actions: [...prev.actions, { type: "email", config: {} }]
    }));
  };

  const updateAction = (index: number, action: WorkflowAction) => {
    setNewWorkflow(prev => ({
      ...prev,
      actions: prev.actions.map((a, i) => i === index ? action : a)
    }));
  };

  const removeAction = (index: number) => {
    setNewWorkflow(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const handleCreateWorkflow = () => {
    if (!newWorkflow.name.trim()) {
      toast({
        title: "Error",
        description: "Workflow name is required",
        variant: "destructive"
      });
      return;
    }

    if (newWorkflow.triggers.length === 0) {
      toast({
        title: "Error", 
        description: "At least one trigger is required",
        variant: "destructive"
      });
      return;
    }

    if (newWorkflow.actions.length === 0) {
      toast({
        title: "Error",
        description: "At least one action is required", 
        variant: "destructive"
      });
      return;
    }

    createWorkflowMutation.mutate(newWorkflow);
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "keyword": return <Tag className="w-4 h-4" />;
      case "sentiment": return <Brain className="w-4 h-4" />;
      case "speaker": return <Users className="w-4 h-4" />;
      case "duration": return <Clock className="w-4 h-4" />;
      case "topic": return <Target className="w-4 h-4" />;
      case "action_item": return <AlertTriangle className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="w-4 h-4" />;
      case "slack": return <MessageSquare className="w-4 h-4" />;
      case "calendar": return <Calendar className="w-4 h-4" />;
      case "task": return <Target className="w-4 h-4" />;
      case "webhook": return <Webhook className="w-4 h-4" />;
      case "ai_analysis": return <Brain className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-6 h-6 text-emerald-600" />
            Workflow Automation
            <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300">
              Premium
            </Badge>
          </h2>
          <p className="text-muted-foreground">Automate actions based on meeting content and patterns</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Automation Workflow</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workflow-name">Workflow Name</Label>
                  <Input
                    id="workflow-name"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Send summary email after long meetings"
                  />
                </div>
                
                <div>
                  <Label htmlFor="workflow-description">Description</Label>
                  <Textarea
                    id="workflow-description"
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this workflow does..."
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Triggers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Triggers</h3>
                  <Button variant="outline" size="sm" onClick={addTrigger}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Trigger
                  </Button>
                </div>
                
                {newWorkflow.triggers.map((trigger, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center gap-4">
                      <Select
                        value={trigger.type}
                        onValueChange={(value: any) => updateTrigger(index, { ...trigger, type: value })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keyword">Keyword</SelectItem>
                          <SelectItem value="sentiment">Sentiment</SelectItem>
                          <SelectItem value="speaker">Speaker</SelectItem>
                          <SelectItem value="duration">Duration</SelectItem>
                          <SelectItem value="topic">Topic</SelectItem>
                          <SelectItem value="action_item">Action Item</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input
                        value={trigger.condition}
                        onChange={(e) => updateTrigger(index, { ...trigger, condition: e.target.value })}
                        placeholder={
                          trigger.type === "keyword" ? "Enter keyword..." :
                          trigger.type === "sentiment" ? "positive/negative/neutral" :
                          trigger.type === "duration" ? "greater_than/less_than" :
                          "Enter condition..."
                        }
                        className="flex-1"
                      />
                      
                      {(trigger.type === "duration") && (
                        <Input
                          type="number"
                          value={trigger.value || ""}
                          onChange={(e) => updateTrigger(index, { ...trigger, value: parseInt(e.target.value) })}
                          placeholder="Minutes"
                          className="w-24"
                        />
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTrigger(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
                
                {newWorkflow.triggers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No triggers added. Click "Add Trigger" to get started.
                  </div>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Actions</h3>
                  <Button variant="outline" size="sm" onClick={addAction}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Action
                  </Button>
                </div>
                
                {newWorkflow.actions.map((action, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Select
                          value={action.type}
                          onValueChange={(value: any) => updateAction(index, { ...action, type: value, config: {} })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Send Email</SelectItem>
                            <SelectItem value="slack">Slack Message</SelectItem>
                            <SelectItem value="calendar">Calendar Event</SelectItem>
                            <SelectItem value="task">Create Task</SelectItem>
                            <SelectItem value="webhook">Webhook</SelectItem>
                            <SelectItem value="ai_analysis">AI Analysis</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAction(index)}
                          className="text-red-600 hover:text-red-700 ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Action-specific configuration */}
                      {action.type === "email" && (
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            value={action.config.recipient || ""}
                            onChange={(e) => updateAction(index, { 
                              ...action, 
                              config: { ...action.config, recipient: e.target.value }
                            })}
                            placeholder="Recipient email"
                          />
                          <Input
                            value={action.config.subject || ""}
                            onChange={(e) => updateAction(index, { 
                              ...action, 
                              config: { ...action.config, subject: e.target.value }
                            })}
                            placeholder="Email subject"
                          />
                        </div>
                      )}
                      
                      {action.type === "slack" && (
                        <Input
                          value={action.config.channel || ""}
                          onChange={(e) => updateAction(index, { 
                            ...action, 
                            config: { ...action.config, channel: e.target.value }
                          })}
                          placeholder="Slack channel (e.g., #general)"
                        />
                      )}
                      
                      {action.type === "webhook" && (
                        <Input
                          value={action.config.url || ""}
                          onChange={(e) => updateAction(index, { 
                            ...action, 
                            config: { ...action.config, url: e.target.value }
                          })}
                          placeholder="Webhook URL"
                        />
                      )}
                      
                      {action.type === "ai_analysis" && (
                        <Textarea
                          value={action.config.analysis_prompt || ""}
                          onChange={(e) => updateAction(index, { 
                            ...action, 
                            config: { ...action.config, analysis_prompt: e.target.value }
                          })}
                          placeholder="Custom analysis prompt..."
                          rows={3}
                        />
                      )}
                    </div>
                  </Card>
                ))}
                
                {newWorkflow.actions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No actions added. Click "Add Action" to get started.
                  </div>
                )}
              </div>

              <Separator />

              {/* Settings */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground font-medium">Enable Workflow</Label>
                  <p className="text-sm text-muted-foreground">Workflow will run automatically when triggered</p>
                </div>
                <Switch
                  checked={newWorkflow.enabled}
                  onCheckedChange={(checked) => setNewWorkflow(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateWorkflow} 
                  disabled={createWorkflowMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  {createWorkflowMutation.isPending ? "Creating..." : "Create Workflow"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workflows List */}
      {workflows && workflows.length > 0 ? (
        <div className="grid gap-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Zap className="w-5 h-5 text-emerald-600" />
                      {workflow.name}
                      <Badge variant={workflow.enabled ? "default" : "secondary"}>
                        {workflow.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </CardTitle>
                    <p className="text-muted-foreground text-sm mt-1">{workflow.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Triggers</h4>
                    <div className="space-y-2">
                      {workflow.triggers.map((trigger, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {getTriggerIcon(trigger.type)}
                          <span className="text-muted-foreground">
                            {trigger.type}: {trigger.condition}
                            {trigger.value && ` (${trigger.value})`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Actions</h4>
                    <div className="space-y-2">
                      {workflow.actions.map((action, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {getActionIcon(action.type)}
                          <span className="text-muted-foreground capitalize">
                            {action.type.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Executed {workflow.execution_count} times
                    {workflow.last_triggered && (
                      <span> • Last: {new Date(workflow.last_triggered).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className={workflow.enabled ? "text-orange-600 hover:text-orange-700" : "text-emerald-600 hover:text-emerald-700"}
                  >
                    {workflow.enabled ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Enable
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Workflows Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first automation workflow to streamline your meeting processes
          </p>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Workflow
          </Button>
        </div>
      )}
    </div>
  );
}
