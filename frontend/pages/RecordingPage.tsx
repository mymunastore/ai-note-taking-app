import React from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Square, Play, Pause, Save, Loader2 } from "lucide-react";
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Record Audio</h1>
          <p className="text-gray-600">
            Record meetings, phone calls, or voice notes for automatic transcription and summarization
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Recording Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recording Status */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                <div
                  className={`absolute inset-0 rounded-full ${
                    isRecording
                      ? isPaused
                        ? "bg-yellow-100 border-4 border-yellow-300"
                        : "bg-red-100 border-4 border-red-300 animate-pulse"
                      : "bg-gray-100 border-4 border-gray-300"
                  }`}
                />
                <Mic
                  className={`w-12 h-12 ${
                    isRecording
                      ? isPaused
                        ? "text-yellow-600"
                        : "text-red-600"
                      : "text-gray-400"
                  }`}
                />
              </div>
              
              <div className="text-3xl font-mono font-bold text-gray-900 mb-2">
                {formatDuration(duration)}
              </div>
              
              <div className="text-sm text-gray-500">
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
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </Button>
              )}

              {isRecording && (
                <>
                  {isPaused ? (
                    <Button onClick={resumeRecording} size="lg" className="bg-green-600 hover:bg-green-700">
                      <Play className="w-5 h-5 mr-2" />
                      Resume
                    </Button>
                  ) : (
                    <Button onClick={pauseRecording} size="lg" variant="outline">
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </Button>
                  )}
                  
                  <Button onClick={handleStopRecording} size="lg" variant="outline">
                    <Square className="w-5 h-5 mr-2" />
                    Stop
                  </Button>
                </>
              )}

              {audioBlob && !isProcessing && (
                <>
                  <Button onClick={handleDiscard} variant="outline" size="lg">
                    Discard
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Recording */}
        {audioBlob && (
          <Card>
            <CardHeader>
              <CardTitle>Save Recording</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Recording Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Recording ${new Date().toLocaleDateString()}`}
                  disabled={isProcessing}
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Duration: {formatDuration(recordingDuration)}</p>
                <p className="mt-1">
                  This recording will be automatically transcribed and summarized using AI.
                </p>
              </div>

              <Button
                onClick={handleSaveRecording}
                disabled={isProcessing}
                className="w-full"
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
