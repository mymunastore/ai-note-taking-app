import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield, Zap, Globe, Moon, Sun, Leaf } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your AI note-taking preferences and view app information
          </p>
        </div>

        <div className="space-y-6">
          {/* Theme Settings */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-600" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-foreground">Theme</span>
                  <p className="text-xs text-muted-foreground">Choose your preferred color scheme</p>
                </div>
                <Button
                  onClick={toggleTheme}
                  variant="outline"
                  size="sm"
                  className="border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/20"
                >
                  {theme === "light" ? (
                    <>
                      <Moon className="w-4 h-4 mr-2" />
                      Dark Mode
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4 mr-2" />
                      Light Mode
                    </>
                  )}
                </Button>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Color Scheme</span>
                <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300">
                  Nature Green
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* App Information */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                App Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Version</span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  2.0.0
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">AI Models</span>
                <div className="text-right">
                  <div className="text-sm text-foreground">OpenAI Whisper (Transcription)</div>
                  <div className="text-sm text-muted-foreground">GPT-4o-mini (Summarization)</div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Storage</span>
                <span className="text-sm text-muted-foreground">Local Database</span>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Audio Recording</span>
                <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-300 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300 dark:border-emerald-700">
                  Enabled
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Speech-to-Text</span>
                <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-300 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300 dark:border-emerald-700">
                  Enabled
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">AI Summarization</span>
                <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-300 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300 dark:border-emerald-700">
                  Enabled
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Smart Search</span>
                <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-300 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300 dark:border-emerald-700">
                  Enabled
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Dark Theme</span>
                <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-300 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300 dark:border-emerald-700">
                  Enabled
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <p className="mb-2 text-emerald-700 dark:text-emerald-300">
                  <strong>🔒 Data Storage:</strong> All recordings, transcripts, and summaries are stored locally in your browser's secure database.
                </p>
                <p className="mb-2 text-emerald-700 dark:text-emerald-300">
                  <strong>🤖 AI Processing:</strong> Audio files are sent to OpenAI's servers for transcription and summarization. OpenAI does not store or use this data for training.
                </p>
                <p className="mb-2 text-emerald-700 dark:text-emerald-300">
                  <strong>🛡️ Privacy:</strong> No personal data is collected or shared with third parties beyond the AI processing services.
                </p>
                <p className="text-emerald-700 dark:text-emerald-300">
                  <strong>🌿 Eco-Friendly:</strong> Optimized for minimal energy consumption and efficient processing.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Support & Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  <strong className="text-foreground">Browser Requirements:</strong> Modern browser with microphone access support
                </p>
                <p className="mb-2">
                  <strong className="text-foreground">Supported Audio:</strong> WAV format, up to 25MB per recording
                </p>
                <p className="mb-2">
                  <strong className="text-foreground">Best Results:</strong> Clear audio with minimal background noise
                </p>
                <p>
                  <strong className="text-foreground">Performance:</strong> Optimized for fast processing and smooth user experience
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
