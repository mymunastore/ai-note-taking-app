import React, { useState, useEffect } from "react";
import { Mic, MicOff, Volume2, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface VoiceCommandsProps {
  onCommand?: (command: string, params?: any) => void;
}

export default function VoiceCommands({ onCommand }: VoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>("");
  const [recognition, setRecognition] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onresult = (event: any) => {
        const command = event.results[0][0].transcript.toLowerCase().trim();
        setLastCommand(command);
        processVoiceCommand(command);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice Command Error",
          description: "Failed to process voice command. Please try again.",
          variant: "destructive",
        });
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const processVoiceCommand = (command: string) => {
    const commands = {
      // Navigation commands
      'go to dashboard': () => navigate('/dashboard'),
      'open dashboard': () => navigate('/dashboard'),
      'go to recording': () => navigate('/record'),
      'start recording': () => navigate('/record'),
      'go to live transcription': () => navigate('/live'),
      'open live transcription': () => navigate('/live'),
      'go to settings': () => navigate('/settings'),
      'open settings': () => navigate('/settings'),
      'go to billing': () => navigate('/billing'),
      'open billing': () => navigate('/billing'),
      
      // Search commands
      'search notes': () => {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          toast({
            title: "Voice Command",
            description: "Search field focused. Start typing your search query.",
          });
        }
      },
      
      // Recording commands
      'new recording': () => navigate('/record'),
      'create recording': () => navigate('/record'),
      
      // Theme commands
      'toggle theme': () => {
        const themeButton = document.querySelector('button[aria-label*="theme"], button:has(svg[data-lucide="moon"]), button:has(svg[data-lucide="sun"])') as HTMLButtonElement;
        if (themeButton) {
          themeButton.click();
          toast({
            title: "Voice Command",
            description: "Theme toggled successfully.",
          });
        }
      },
      'dark mode': () => {
        const themeButton = document.querySelector('button:has(svg[data-lucide="moon"])') as HTMLButtonElement;
        if (themeButton) {
          themeButton.click();
          toast({
            title: "Voice Command",
            description: "Switched to dark mode.",
          });
        }
      },
      'light mode': () => {
        const themeButton = document.querySelector('button:has(svg[data-lucide="sun"])') as HTMLButtonElement;
        if (themeButton) {
          themeButton.click();
          toast({
            title: "Voice Command",
            description: "Switched to light mode.",
          });
        }
      },
    };

    // Find matching command
    const matchedCommand = Object.keys(commands).find(cmd => 
      command.includes(cmd) || cmd.includes(command)
    );

    if (matchedCommand) {
      commands[matchedCommand as keyof typeof commands]();
      toast({
        title: "Voice Command Executed",
        description: `Executed: "${matchedCommand}"`,
      });
      onCommand?.(matchedCommand);
    } else {
      // Try partial matches for more flexible commands
      if (command.includes('search') || command.includes('find')) {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          toast({
            title: "Voice Command",
            description: "Search activated. What would you like to find?",
          });
        }
      } else if (command.includes('record') || command.includes('start')) {
        navigate('/record');
        toast({
          title: "Voice Command",
          description: "Opening recording studio.",
        });
      } else if (command.includes('dashboard') || command.includes('home')) {
        navigate('/dashboard');
        toast({
          title: "Voice Command",
          description: "Opening dashboard.",
        });
      } else {
        toast({
          title: "Unknown Command",
          description: `"${command}" is not recognized. Try commands like "go to dashboard" or "start recording".`,
          variant: "destructive",
        });
      }
    }
  };

  const startListening = () => {
    if (recognition) {
      try {
        recognition.start();
        toast({
          title: "Voice Commands Active",
          description: "Listening for voice commands...",
        });
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
        toast({
          title: "Voice Command Error",
          description: "Failed to start voice recognition. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Not Supported",
        description: "Voice commands are not supported in this browser.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  if (!recognition) {
    return null; // Don't render if not supported
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Command className="w-4 h-4 text-emerald-600" />
          Voice Commands
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            onClick={isListening ? stopListening : startListening}
            size="sm"
            variant={isListening ? "destructive" : "outline"}
            className={isListening ? "animate-pulse" : "hover:border-emerald-500"}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Listen
              </>
            )}
          </Button>
          
          {isListening && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span>Listening...</span>
            </div>
          )}
        </div>

        {lastCommand && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <strong>Last command:</strong> "{lastCommand}"
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Try saying:</p>
          <ul className="space-y-1">
            <li>• "Go to dashboard"</li>
            <li>• "Start recording"</li>
            <li>• "Search notes"</li>
            <li>• "Toggle theme"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
