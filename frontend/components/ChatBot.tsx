import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Bot, User, Loader2, Sparkles, Zap, Brain, Settings, Mic, FileText, TrendingUp, Lightbulb, ChevronDown, ChevronUp, Copy, ThumbsUp, ThumbsDown, RotateCcw, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../contexts/AuthContext";

interface Message {
  role: "USER" | "CHATBOT";
  message: string;
}

interface DisplayMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: "text" | "analysis" | "suggestion" | "insight";
  metadata?: {
    confidence?: number;
    sources?: string[];
    actions?: Array<{
      label: string;
      action: string;
    }>;
  };
}

interface ChatBotProps {
  context?: string;
}

interface ChatSettings {
  mode: "assistant" | "analyst" | "coach" | "expert";
  responseStyle: "concise" | "detailed" | "comprehensive";
  includeInsights: boolean;
  proactiveMode: boolean;
  voiceEnabled: boolean;
}

export default function ChatBot({ context }: ChatBotProps) {
  const backend = useBackend();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([
    {
      id: "welcome",
      content: "🚀 **Welcome to SCRIBE AI Premium!** I'm your advanced AI assistant with enhanced capabilities:\n\n✨ **Smart Analysis** - Deep insights from your recordings\n🧠 **Contextual Intelligence** - Understanding your workflow patterns\n💡 **Proactive Suggestions** - Recommendations based on your data\n🎯 **Multi-mode Support** - Assistant, Analyst, Coach, and Expert modes\n\nHow can I help you unlock insights from your meetings today?",
      isUser: false,
      timestamp: new Date(),
      type: "insight",
      metadata: {
        confidence: 1.0,
        actions: [
          { label: "Analyze Recent Meetings", action: "analyze_recent" },
          { label: "Show Productivity Insights", action: "show_insights" },
          { label: "Generate Meeting Summary", action: "generate_summary" }
        ]
      }
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    mode: "assistant",
    responseStyle: "detailed",
    includeInsights: true,
    proactiveMode: true,
    voiceEnabled: false
  });
  const [suggestions, setSuggestions] = useState<string[]>([
    "Analyze my meeting patterns",
    "What are my productivity trends?",
    "Generate action items from recent meetings",
    "Show me communication insights"
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  // Proactive suggestions based on context
  useEffect(() => {
    if (settings.proactiveMode && context) {
      generateProactiveSuggestions();
    }
  }, [context, settings.proactiveMode]);

  const generateProactiveSuggestions = async () => {
    if (!context) return;

    try {
      const response = await backend.ai.chat({
        message: "Based on this content, suggest 3 short, actionable questions I could ask to get more insights.",
        context: context,
        chatHistory: []
      });

      const suggestionsText = response.response;
      const newSuggestions = suggestionsText
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 3)
        .map(line => line.replace(/^\d+\.?\s*/, '').trim());

      if (newSuggestions.length > 0) {
        setSuggestions(newSuggestions);
      }
    } catch (error) {
      console.warn("Failed to generate proactive suggestions:", error);
    }
  };

  const handleSendMessage = async (message?: string) => {
    const messageText = message || inputValue;
    if (!messageText.trim() || isLoading) return;

    const userDisplayMessage: DisplayMessage = {
      id: Date.now().toString(),
      content: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setDisplayMessages(prev => [...prev, userDisplayMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Enhanced context with settings
      const enhancedContext = context ? `${context}\n\nUser Preferences: Mode=${settings.mode}, Style=${settings.responseStyle}, Include Insights=${settings.includeInsights}` : undefined;

      const response = await backend.ai.chat({
        message: messageText,
        context: enhancedContext,
        chatHistory: chatHistory,
      });

      const aiMessageContent = response.response;
      const aiDisplayMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        content: aiMessageContent,
        isUser: false,
        timestamp: new Date(),
        type: determineMessageType(aiMessageContent),
        metadata: {
          confidence: 0.95,
          sources: context ? ["Current Context"] : undefined,
          actions: extractActions(aiMessageContent)
        }
      };

      setDisplayMessages(prev => [...prev, aiDisplayMessage]);
      setChatHistory(prev => [
        ...prev,
        { role: "USER", message: messageText },
        { role: "CHATBOT", message: aiMessageContent },
      ]);

      // Generate new suggestions based on the conversation
      if (settings.proactiveMode) {
        updateSuggestions(messageText, aiMessageContent);
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Chat Error",
        description: "Failed to get response from AI assistant.",
        variant: "destructive",
      });

      const errorMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
        type: "text"
      };

      setDisplayMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    switch (action) {
      case "analyze_recent":
        await handleSendMessage("Analyze my recent meetings and provide insights on patterns and productivity");
        break;
      case "show_insights":
        await handleSendMessage("Show me productivity insights and trends from my meeting data");
        break;
      case "generate_summary":
        await handleSendMessage("Generate a comprehensive summary of my recent meeting activity");
        break;
      default:
        await handleSendMessage(action);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied",
        description: "Message copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy message to clipboard.",
        variant: "destructive",
      });
    }
  };

  const regenerateResponse = async (messageId: string) => {
    const messageIndex = displayMessages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    const userMessage = displayMessages[messageIndex - 1];
    if (!userMessage || userMessage.isUser) {
      await handleSendMessage("Please regenerate your last response with a different approach");
    }
  };

  const determineMessageType = (content: string): "text" | "analysis" | "suggestion" | "insight" => {
    if (content.includes("analysis") || content.includes("data") || content.includes("pattern")) {
      return "analysis";
    }
    if (content.includes("suggest") || content.includes("recommend") || content.includes("consider")) {
      return "suggestion";
    }
    if (content.includes("insight") || content.includes("trend") || content.includes("observation")) {
      return "insight";
    }
    return "text";
  };

  const extractActions = (content: string): Array<{ label: string; action: string }> => {
    const actions: Array<{ label: string; action: string }> = [];
    
    if (content.includes("meeting") || content.includes("analysis")) {
      actions.push({ label: "Deep Dive Analysis", action: "Provide a more detailed analysis of this topic" });
    }
    if (content.includes("action") || content.includes("task")) {
      actions.push({ label: "Create Action Plan", action: "Create a detailed action plan based on this information" });
    }
    if (content.includes("trend") || content.includes("pattern")) {
      actions.push({ label: "Show Trends", action: "Show me more trends and patterns in my data" });
    }

    return actions.slice(0, 2); // Limit to 2 actions
  };

  const updateSuggestions = (userMessage: string, aiResponse: string) => {
    const contextualSuggestions = [
      "Tell me more about this",
      "How can I improve based on this?",
      "What are the next steps?",
      "Show me related insights"
    ];
    setSuggestions(contextualSuggestions);
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case "analysis": return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case "suggestion": return <Lightbulb className="w-4 h-4 text-yellow-600" />;
      case "insight": return <Brain className="w-4 h-4 text-purple-600" />;
      default: return <Bot className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "analyst": return <TrendingUp className="w-4 h-4" />;
      case "coach": return <Lightbulb className="w-4 h-4" />;
      case "expert": return <Brain className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 animate-glow"
          size="icon"
        >
          <div className="relative">
            <Sparkles className="h-7 w-7 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
          </div>
        </Button>
        
        {/* Floating preview */}
        <div className="absolute bottom-20 right-0 w-80 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-4 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-foreground">SCRIBE AI Premium</span>
            <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300">
              Enhanced
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Advanced AI assistant with contextual intelligence, proactive insights, and multi-mode support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 shadow-2xl border-border bg-card/95 backdrop-blur-sm z-50 flex flex-col transition-all duration-300 ${
      isExpanded ? "w-[800px] h-[700px]" : "w-96 h-[600px]"
    }`}>
      <CardHeader className="pb-3 border-b border-border bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                SCRIBE AI
                <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300 text-xs">
                  Premium
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {getModeIcon(settings.mode)}
                <span className="capitalize">{settings.mode} Mode</span>
                {settings.proactiveMode && (
                  <>
                    <span>•</span>
                    <Zap className="w-3 h-3" />
                    <span>Proactive</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:bg-accent"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 m-2">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col m-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {displayMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        message.isUser
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                          : "bg-muted text-foreground border border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!message.isUser && (
                          <div className="flex-shrink-0 mt-0.5">
                            {getMessageIcon(message.type)}
                          </div>
                        )}
                        {message.isUser && (
                          <User className="w-4 h-4 mt-0.5 text-white flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          
                          {message.metadata?.confidence && (
                            <div className="mt-2 text-xs opacity-70">
                              Confidence: {Math.round(message.metadata.confidence * 100)}%
                            </div>
                          )}
                          
                          {message.metadata?.actions && message.metadata.actions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {message.metadata.actions.map((action, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickAction(action.action)}
                                  className="text-xs h-7 bg-background/50 hover:bg-background/80"
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {!message.isUser && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyMessage(message.content)}
                            className="h-6 px-2 text-xs hover:bg-background/20"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => regenerateResponse(message.id)}
                            className="h-6 px-2 text-xs hover:bg-background/20"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                          <div className="flex gap-1 ml-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-background/20"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-background/20"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground rounded-lg px-4 py-3 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-full flex items-center justify-center">
                          <Brain className="w-4 h-4 text-emerald-600 animate-pulse" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Suggestions */}
            {suggestions.length > 0 && (
              <div className="px-4 py-2 border-t border-border bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium text-muted-foreground">Quick Actions</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs h-7 bg-background/50 hover:bg-background/80 border-emerald-200 dark:border-emerald-800"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-background/50">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Ask me anything in ${settings.mode} mode...`}
                  disabled={isLoading}
                  className="flex-1 bg-background border-border focus:border-emerald-500 focus:ring-emerald-500/20"
                />
                {settings.voiceEnabled && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/20"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="flex-1 p-4">
            <div className="space-y-4">
              <div className="text-center">
                <Brain className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">AI Insights Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time insights from your meeting data and conversation patterns.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 border-border bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                  <div className="text-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-foreground">85%</div>
                    <div className="text-xs text-muted-foreground">Productivity Score</div>
                  </div>
                </Card>
                
                <Card className="p-3 border-border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  <div className="text-center">
                    <MessageCircle className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-foreground">12</div>
                    <div className="text-xs text-muted-foreground">Active Conversations</div>
                  </div>
                </Card>
                
                <Card className="p-3 border-border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                  <div className="text-center">
                    <Lightbulb className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-foreground">7</div>
                    <div className="text-xs text-muted-foreground">Smart Suggestions</div>
                  </div>
                </Card>
                
                <Card className="p-3 border-border bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
                  <div className="text-center">
                    <Zap className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-foreground">3</div>
                    <div className="text-xs text-muted-foreground">Auto Actions</div>
                  </div>
                </Card>
              </div>
              
              <Button
                onClick={() => handleQuickAction("Generate a comprehensive insights report based on my recent activity")}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                <Brain className="w-4 h-4 mr-2" />
                Generate Full Insights Report
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 p-4">
            <div className="space-y-6">
              <div>
                <Label className="text-foreground font-medium">AI Mode</Label>
                <Select value={settings.mode} onValueChange={(value: any) => setSettings(prev => ({ ...prev, mode: value }))}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assistant">🤖 Assistant - General help and support</SelectItem>
                    <SelectItem value="analyst">📊 Analyst - Data analysis and insights</SelectItem>
                    <SelectItem value="coach">💡 Coach - Productivity and improvement tips</SelectItem>
                    <SelectItem value="expert">🧠 Expert - Deep domain knowledge</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground font-medium">Response Style</Label>
                <Select value={settings.responseStyle} onValueChange={(value: any) => setSettings(prev => ({ ...prev, responseStyle: value }))}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">⚡ Concise - Brief and to the point</SelectItem>
                    <SelectItem value="detailed">📝 Detailed - Comprehensive explanations</SelectItem>
                    <SelectItem value="comprehensive">📚 Comprehensive - In-depth analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground font-medium">Include Insights</Label>
                    <p className="text-xs text-muted-foreground">Add contextual insights to responses</p>
                  </div>
                  <Switch
                    checked={settings.includeInsights}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeInsights: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground font-medium">Proactive Mode</Label>
                    <p className="text-xs text-muted-foreground">Generate suggestions automatically</p>
                  </div>
                  <Switch
                    checked={settings.proactiveMode}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, proactiveMode: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground font-medium">Voice Input</Label>
                    <p className="text-xs text-muted-foreground">Enable voice commands</p>
                  </div>
                  <Switch
                    checked={settings.voiceEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, voiceEnabled: checked }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDisplayMessages([displayMessages[0]]);
                    setChatHistory([]);
                    toast({
                      title: "Chat Cleared",
                      description: "Conversation history has been cleared.",
                    });
                  }}
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear Conversation
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
