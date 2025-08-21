import React from "react";
import { Activity, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import RealTimeTranscription from "../components/RealTimeTranscription";

export default function LiveTranscriptionPage() {
  const handleTranscriptUpdate = (transcript: string) => {
    console.log("Transcript updated:", transcript);
  };

  const handleLanguageDetected = (language: string) => {
    console.log("Language detected:", language);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-8 h-8 text-emerald-600" />
            Live Transcription
            <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300">
              Real-Time
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Experience real-time speech-to-text with automatic language detection
          </p>
        </div>

        {/* Real-Time Transcription Component */}
        <RealTimeTranscription 
          onTranscriptUpdate={handleTranscriptUpdate}
          onLanguageDetected={handleLanguageDetected}
        />
      </div>
    </div>
  );
}
