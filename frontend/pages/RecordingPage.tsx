import React from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Square, Play, Pause, Save, Loader2, Sparkles, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRecording } from "../contexts/RecordingContext";
import { useNotes } from "../contexts/NotesContext";
import { formatDuration } from "../utils/formatters";

export default function RecordingPage() {
  const navigate = useNavigate();
  const { refetch } = useNotes();
  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    isProcessing,
    processRecording,
  } = useRecording();

  const [title, setTitle] = React.useState("");
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = React.useState(0);

  const handleStartRecording = async () => {
    await startRecording();
  };

  const handleStopRecording = async () => {
    const result = await stopRecording();
    if (result) {
      setAudioBlob(result.audioBlob);
      setRecordingDuration(result.duration);
    }
  };

  const handleSaveRecording = async () => {
    if (!audioBlob) return;

    await processRecording(audioBlob, recordingDuration, title);
    
    // Reset state
    setAudioBlob(null);
    setRecordingDuration(0);
    setTitle("");
    
    // Refresh notes list and navigate back
    refetch();
    navigate("/");
  };

  const handleDiscard = () => {
    setAudioBlob(null);
    setRecordingDuration(0);
    setTitle("");
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            Record Audio
          </h1>
          <p className="text-muted-foreground">
            Record meetings, phone calls, or voice notes for automatic transcription and summarization
          </p>
        </div>

        <Card className="mb-6 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Recording Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recording Status */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-300 ${
                    isRecording
                      ? isPaused
                        ? "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50 border-4 border-amber-300 dark:border-amber-700"
                        : "bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-950/50 dark:to-rose-950/50 border-4 border-red-300 dark:border-red-700 animate-pulse"
                      : "bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-900/50 dark:to-gray-900/50 border-4 border-slate-300 dark:border-slate-700"
                  }`}
                />
                {isRecording && !isPaused && (
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/30 animate-ping opacity-75" />
                )}
                <Mic
                  className={`w-12 h-12 z-10 ${
                    isRecording
                      ? isPaused
                        ? "text-amber-600"
                        : "text-red-600"
                      : "text-muted-foreground"
                  }`}
                />
              </div>
              
              <div className="text-3xl font-mono font-bold text-foreground mb-2">
                {formatDuration(duration)}
              </div>
              
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                {isRecording && !isPaused && <Activity className="w-4 h-4 animate-pulse text-emerald-600" />}
                {isRecording
                  ? isPaused
                    ? "Recording Paused"
                    : "Recording..."
                  : audioBlob
                  ? "Recording Complete"
                  : "Ready to Record"}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center gap-4">
              {!isRecording && !audioBlob && (
                <Button
                  onClick={handleStartRecording}
                  size="lg"
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </Button>
              )}

              {isRecording && (
                <>
                  {isPaused ? (
                    <Button onClick={resumeRecording} size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                      <Play className="w-5 h-5 mr-2" />
                      Resume
                    </Button>
                  ) : (
                    <Button onClick={pauseRecording} size="lg" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/20">
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </Button>
                  )}
                  
                  <Button onClick={handleStopRecording} size="lg" variant="outline" className="border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/20">
                    <Square className="w-5 h-5 mr-2" />
                    Stop
                  </Button>
                </>
              )}

              {audioBlob && !isProcessing && (
                <>
                  <Button onClick={handleDiscard} variant="outline" size="lg" className="border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/20">
                    Discard
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Recording */}
        {audioBlob && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Save Recording</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-foreground">Recording Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Recording ${new Date().toLocaleDateString()}`}
                  disabled={isProcessing}
                  className="bg-background border-border focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
              
              <div className="text-sm text-muted-foreground bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <p className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4" />
                  Duration: {formatDuration(recordingDuration)}
                </p>
                <p className="mt-1 text-emerald-600 dark:text-emerald-400">
                  This recording will be automatically transcribed and summarized using AI.
                </p>
              </div>

              <Button
                onClick={handleSaveRecording}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save & Process Recording
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
