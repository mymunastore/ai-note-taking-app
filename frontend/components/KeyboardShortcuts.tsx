import React, { useEffect } from "react";
import { Keyboard, Command } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface KeyboardShortcutsProps {
  onShortcut?: (shortcut: string) => void;
}

export default function KeyboardShortcuts({ onShortcut }: KeyboardShortcutsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for modifier keys (Ctrl/Cmd + key)
      const isModifierPressed = event.ctrlKey || event.metaKey;
      
      if (!isModifierPressed) return;

      // Prevent default browser shortcuts
      const shortcuts: Record<string, () => void> = {
        // Navigation shortcuts
        'h': () => {
          event.preventDefault();
          navigate('/dashboard');
          toast({ title: "Shortcut", description: "Navigated to Dashboard" });
          onShortcut?.('dashboard');
        },
        'r': () => {
          event.preventDefault();
          navigate('/record');
          toast({ title: "Shortcut", description: "Opened Recording Studio" });
          onShortcut?.('record');
        },
        'l': () => {
          event.preventDefault();
          navigate('/live');
          toast({ title: "Shortcut", description: "Opened Live Transcription" });
          onShortcut?.('live');
        },
        's': () => {
          event.preventDefault();
          navigate('/settings');
          toast({ title: "Shortcut", description: "Opened Settings" });
          onShortcut?.('settings');
        },
        'b': () => {
          event.preventDefault();
          navigate('/billing');
          toast({ title: "Shortcut", description: "Opened Billing" });
          onShortcut?.('billing');
        },
        
        // Search shortcut
        'k': () => {
          event.preventDefault();
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
            toast({ title: "Shortcut", description: "Search activated" });
            onShortcut?.('search');
          }
        },
        
        // Theme toggle
        't': () => {
          event.preventDefault();
          const themeButton = document.querySelector('button:has(svg[data-lucide="moon"]), button:has(svg[data-lucide="sun"])') as HTMLButtonElement;
          if (themeButton) {
            themeButton.click();
            toast({ title: "Shortcut", description: "Theme toggled" });
            onShortcut?.('theme');
          }
        },
        
        // New recording
        'n': () => {
          event.preventDefault();
          navigate('/record');
          toast({ title: "Shortcut", description: "New Recording" });
          onShortcut?.('new-recording');
        },
      };

      const shortcut = shortcuts[event.key.toLowerCase()];
      if (shortcut) {
        shortcut();
      }
    };

    // Add global shortcut for help (?)
    const handleHelpShortcut = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement?.tagName === 'INPUT' || 
                              activeElement?.tagName === 'TEXTAREA' || 
                              activeElement?.getAttribute('contenteditable') === 'true';
        
        if (!isInputFocused) {
          event.preventDefault();
          toast({
            title: "Keyboard Shortcuts",
            description: "Check the shortcuts panel for available commands",
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleHelpShortcut);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleHelpShortcut);
    };
  }, [navigate, toast, onShortcut]);

  const shortcuts = [
    { key: 'Ctrl/⌘ + H', description: 'Go to Dashboard', category: 'Navigation' },
    { key: 'Ctrl/⌘ + R', description: 'Start Recording', category: 'Navigation' },
    { key: 'Ctrl/⌘ + L', description: 'Live Transcription', category: 'Navigation' },
    { key: 'Ctrl/⌘ + S', description: 'Settings', category: 'Navigation' },
    { key: 'Ctrl/⌘ + B', description: 'Billing', category: 'Navigation' },
    { key: 'Ctrl/⌘ + K', description: 'Search Notes', category: 'Actions' },
    { key: 'Ctrl/⌘ + N', description: 'New Recording', category: 'Actions' },
    { key: 'Ctrl/⌘ + T', description: 'Toggle Theme', category: 'Actions' },
    { key: '?', description: 'Show Help', category: 'Help' },
  ];

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof shortcuts>);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Keyboard className="w-4 h-4 text-emerald-600" />
          Keyboard Shortcuts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {category}
            </h4>
            <div className="space-y-1">
              {categoryShortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{shortcut.description}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {shortcut.key}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Press <Badge variant="outline" className="font-mono text-xs mx-1">?</Badge> 
            for help when not typing
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
