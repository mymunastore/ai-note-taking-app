import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Configure your AI note-taking preferences and view app information
          </p>
        </div>

        <div className="space-y-6">
          {/* App Information */}
          <Card>
            <CardHeader>
              <CardTitle>App Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Version</span>
                <Badge variant="secondary">1.0.0</Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">AI Models</span>
                <div className="text-right">
                  <div className="text-sm">OpenAI Whisper (Transcription)</div>
                  <div className="text-sm text-gray-500">GPT-4o-mini (Summarization)</div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Storage</span>
                <span className="text-sm text-gray-600">Local Database</span>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Audio Recording</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Enabled
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Speech-to-Text</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Enabled
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Summarization</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Enabled
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Search</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Enabled
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  <strong>Data Storage:</strong> All recordings, transcripts, and summaries are stored locally in your browser's database.
                </p>
                <p className="mb-2">
                  <strong>AI Processing:</strong> Audio files are sent to OpenAI's servers for transcription and summarization. OpenAI does not store or use this data for training.
                </p>
                <p>
                  <strong>Privacy:</strong> No personal data is collected or shared with third parties beyond the AI processing services.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  <strong>Browser Requirements:</strong> Modern browser with microphone access support
                </p>
                <p className="mb-2">
                  <strong>Supported Audio:</strong> WAV format, up to 25MB per recording
                </p>
                <p>
                  <strong>Best Results:</strong> Clear audio with minimal background noise
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
