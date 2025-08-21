import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

interface Message {
  role: "USER" | "CHATBOT";
  message: string;
}

interface DisplayMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatBotProps {
  context?: string;
}

export default function ChatBot({ context }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([
    {
      id: "welcome",
      content: "🚀 **Welcome to SCRIBE AI!** I'm your AI assistant ready to help you with your recordings and notes. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userDisplayMessage: DisplayMessage = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setDisplayMessages(prev => [...prev, userDisplayMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await backend.ai.chat({
        message: inputValue,
        context: context,
        chatHistory: chatHistory,
      });

      const aiMessageContent = response.response;
      const aiDisplayMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        content: aiMessageContent,
        isUser: false,
        timestamp: new Date(),
      };

      setDisplayMessages(prev => [...prev, aiDisplayMessage]);
      setChatHistory(prev => [
        ...prev,
        { role: "USER", message: inputValue },
        { role: "CHATBOT", message: aiMessageContent },
      ]);

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
      };

      setDisplayMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110"
          size="icon"
        >
          <div className="relative">
            <Sparkles className="h-7 w-7 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
          </div>
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl border-border bg-card/95 backdrop-blur-sm z-50 flex flex-col">
      <CardHeader className="pb-3 border-b border-border bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-foreground">SCRIBE AI</CardTitle>
              <p className="text-xs text-muted-foreground">AI Assistant</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
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
                      <Bot className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                    )}
                    {message.isUser && (
                      <User className="w-4 h-4 mt-0.5 text-white flex-shrink-0" />
                    )}
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-lg px-4 py-3 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-emerald-600 animate-pulse" />
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

        <div className="p-4 border-t border-border bg-background/50">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your notes..."
              disabled={isLoading}
              className="flex-1 bg-background border-border focus:border-emerald-500 focus:ring-emerald-500/20"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
