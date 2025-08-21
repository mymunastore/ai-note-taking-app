import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield, Zap, Globe, Moon, Sun, Leaf, MessageCircle, Languages, Database, Cpu } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            Settings & Information
          </h1>
          <p className="text-muted-foreground">
            Configure your AI note-taking preferences and view detailed app information
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
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
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">UI Framework</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                    Tailwind CSS v4
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-600" />
                  AI Technology Stack
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Speech Recognition</span>
                  <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-950/50 dark:to-indigo-950/50 dark:text-blue-300">
                    OpenAI Whisper
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Text Generation</span>
                  <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-950/50 dark:to-pink-950/50 dark:text-purple-300">
                    GPT-4o-mini
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Chat Assistant</span>
                  <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300">
                    AI Assistant
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Language Detection</span>
                  <Badge className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 dark:from-orange-950/50 dark:to-red-950/50 dark:text-orange-300">
                    Auto-Detect
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  Performance & Storage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Backend Framework</span>
                  <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 dark:from-blue-950/50 dark:to-cyan-950/50 dark:text-blue-300">
                    Encore.ts
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Database</span>
                  <Badge className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 dark:from-indigo-950/50 dark:to-purple-950/50 dark:text-indigo-300">
                    PostgreSQL
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Search Engine</span>
                  <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 dark:from-yellow-950/50 dark:to-orange-950/50 dark:text-yellow-300">
                    Full-Text Search
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  Application Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Version</span>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    1.0.0
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Build Type</span>
                  <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-950/50 dark:to-pink-950/50 dark:text-purple-300">
                    Production
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Frontend</span>
                  <div className="text-right">
                    <div className="text-sm text-foreground">React 18 + TypeScript</div>
                    <div className="text-xs text-muted-foreground">Vite + Tailwind CSS</div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Last Updated</span>
                  <span className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Multi-Language Auto-Detection</span>
                  <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-300 dark:from-purple-950/50 dark:to-pink-950/50 dark:text-purple-300 dark:border-purple-700">
                    <Languages className="w-3 h-3 mr-1" />
                    Enhanced
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">AI Chat Assistant</span>
                  <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 dark:from-green-950/50 dark:to-emerald-950/50 dark:text-green-300 dark:border-green-700">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Enhanced
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Smart Search</span>
                  <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-300 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300 dark:border-emerald-700">
                    Enabled
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Export & Sharing</span>
                  <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-300 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300 dark:border-emerald-700">
                    Enabled
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="mb-2 text-emerald-700 dark:text-emerald-300">
                    <strong>🔒 Enhanced Security:</strong> All data is encrypted at rest and in transit using industry-standard AES-256 encryption.
                  </p>
                  <p className="mb-2 text-emerald-700 dark:text-emerald-300">
                    <strong>🤖 AI Processing:</strong> Audio files are processed by OpenAI with automatic data deletion after processing.
                  </p>
                  <p className="mb-2 text-emerald-700 dark:text-emerald-300">
                    <strong>💬 Smart Chat:</strong> Conversations use advanced context awareness while maintaining privacy.
                  </p>
                  <p className="mb-2 text-emerald-700 dark:text-emerald-300">
                    <strong>🛡️ Zero Retention:</strong> AI providers don't store your data - everything is processed and immediately discarded.
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-300">
                    <strong>🌿 Optimized Performance:</strong> Intelligent caching and compression for faster processing and reduced bandwidth usage.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-border bg-card mt-6">
          <CardHeader>
            <CardTitle className="text-foreground">System Requirements & Compatibility</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Minimum Requirements</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong className="text-foreground">Browser:</strong> Chrome 90+, Firefox 88+, Safari 14+, Edge 90+</p>
                <p><strong className="text-foreground">Memory:</strong> 4GB RAM recommended</p>
                <p><strong className="text-foreground">Storage:</strong> 100MB available space</p>
                <p><strong className="text-foreground">Network:</strong> Stable internet connection for AI processing</p>
                <p><strong className="text-foreground">Microphone:</strong> Any compatible audio input device</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Optimal Performance</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong className="text-foreground">Audio Quality:</strong> Clear speech with minimal background noise</p>
                <p><strong className="text-foreground">Recording Length:</strong> 10 seconds to 2 hours per session</p>
                <p><strong className="text-foreground">Language Detection:</strong> Works best with recordings longer than 10 seconds</p>
                <p><strong className="text-foreground">File Size:</strong> Up to 25MB per audio file</p>
                <p><strong className="text-foreground">Concurrent Users:</strong> Supports team collaboration and sharing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
