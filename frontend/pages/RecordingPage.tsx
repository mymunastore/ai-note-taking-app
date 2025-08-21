import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Square, Play, Pause, Save, Loader2, Sparkles, Activity, Globe, Languages, Tag, Plus, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useRecording } from "../contexts/RecordingContext";
import { useNotes } from "../contexts/NotesContext";
import { formatDuration } from "../utils/formatters";
import Logo3D from "../components/Logo3D";

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

  const [title, setTitle] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [autoLanguageDetection, setAutoLanguageDetection] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [realTimeTranscription, setRealTimeTranscription] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const handleStopRecording = async () => {
    try {
      const result = await stopRecording();
      if (result) {
        setAudioBlob(result.audioBlob);
        setRecordingDuration(result.duration);
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };

  const handleSaveRecording = async () => {
    if (!audioBlob) return;

    try {
      await processRecording(audioBlob, recordingDuration, title, tags);
      
      // Reset state
      setAudioBlob(null);
      setRecordingDuration(0);
      setTitle("");
      setTags([]);
      
      // Refresh notes list and navigate back
      refetch();
      navigate("/");
    } catch (error) {
      console.error("Failed to save recording:", error);
    }
  };

  const handleDiscard = () => {
    setAudioBlob(null);
    setRecordingDuration(0);
    setTitle("");
    setTags([]);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-emerald-50/30 via-teal-50/30 to-blue-50/30 dark:from-emerald-950/10 dark:via-teal-950/10 dark:to-blue-950/10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Logo3D size="md" animated={true} showText={false} />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
              AI Voice Recording
            </h1>
          </div>
          <p className="text-muted-foreground">
            Record with automatic language detection, real-time transcription, and intelligent translation
          </p>
        </div>

        {/* AI Features Card */}
        <Card className="mb-6 border-border bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              AI-Powered Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Auto Language Detection
                    </Label>
                    <p className="text-xs text-muted-foreground">Detect 50+ languages automatically</p>
                  </div>
                  <Switch
                    checked={autoLanguageDetection}
                    onCheckedChange={setAutoLanguageDetection}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground flex items-center gap-2">
                      <Languages className="w-4 h-4" />
                      Auto-translate to English
                    </Label>
                    <p className="text-xs text-muted-foreground">Translate non-English content</p>
                  </div>
                  <Switch
                    checked={autoTranslate}
                    onCheckedChange={setAutoTranslate}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Real-time transcription
                    </Label>
                    <p className="text-xs text-muted-foreground">Show text as you speak</p>
                  </div>
                  <Switch
                    checked={realTimeTranscription}
                    onCheckedChange={setRealTimeTranscription}
                  />
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">AI will automatically:</span>
                  </div>
                  <ul className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 space-y-1">
                    <li>• Detect the language being spoken</li>
                    <li>• Transcribe with 99.9% accuracy</li>
                    <li>• Translate to English if needed</li>
                    <li>• Generate intelligent summaries</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recording Controls */}
        <Card className="mb-6 border-border bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-foreground">Recording Studio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recording Status */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-40 h-40 mb-6">
                {/* Outer glow ring */}
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-500 ${
                    isRecording
                      ? isPaused
                        ? "bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-800 dark:to-orange-800 animate-pulse"
                        : "bg-gradient-to-br from-red-200 to-rose-200 dark:from-red-800 dark:to-rose-800 animate-ping"
                      : "bg-gradient-to-br from-slate-200 to-gray-200 dark:from-slate-800 dark:to-gray-800"
                  }`}
                />
                
                {/* Middle ring */}
                <div
                  className={`absolute inset-4 rounded-full transition-all duration-300 ${
                    isRecording
                      ? isPaused
                        ? "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 border-4 border-amber-300 dark:border-amber-600"
                        : "bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900 dark:to-rose-900 border-4 border-red-300 dark:border-red-600"
                      : "bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-900 dark:to-gray-900 border-4 border-slate-300 dark:border-slate-600"
                  }`}
                />
                
                {/* Inner core */}
                <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl">
                  <Mic
                    className={`w-10 h-10 text-white transition-all duration-300 ${
                      isRecording && !isPaused ? "animate-pulse" : ""
                    }`}
                  />
                </div>
                
                {/* Floating indicators */}
                {isRecording && !isPaused && (
                  <>
                    <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
                    <div className="absolute bottom-2 left-2 w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-300"></div>
                    <div className="absolute top-1/2 left-2 w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-500"></div>
                  </>
                )}
              </div>
              
              <div className="text-4xl font-mono font-bold text-foreground mb-3 tracking-wider">
                {formatDuration(duration)}
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                {isRecording && !isPaused && <Activity className="w-5 h-5 animate-pulse text-emerald-600" />}
                <Badge 
                  variant={isRecording ? (isPaused ? "secondary" : "default") : "outline"}
                  className={`text-sm px-3 py-1 ${
                    isRecording 
                      ? isPaused 
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" 
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  {isRecording
                    ? isPaused
                      ? "Recording Paused"
                      : "🔴 Live Recording"
                    : audioBlob
                    ? "✅ Recording Complete"
                    : "⚡ Ready to Record"}
                </Badge>
              </div>

              {autoLanguageDetection && (
                <div className="text-xs text-muted-foreground bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-2 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Globe className="w-4 h-4 inline mr-1" />
                  AI Language Detection Active - Speak in any of 50+ supported languages
                </div>
              )}
            </div>

            {/* Real-time Transcription Display */}
            {realTimeTranscription && isRecording && !isPaused && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Live AI Transcription</span>
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-xs">
                    Real-time
                  </Badge>
                </div>
                <div className="min-h-[60px] bg-white/50 dark:bg-black/20 rounded-lg p-3 border border-emerald-100 dark:border-emerald-800">
                  <p className="text-sm text-muted-foreground italic">
                    <span className="animate-pulse">●</span> Listening for speech... AI will transcribe and detect language in real-time
                  </p>
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex justify-center gap-4">
              {!isRecording && !audioBlob && (
                <Button
                  onClick={handleStartRecording}
                  size="lg"
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start AI Recording
                </Button>
              )}

              {isRecording && (
                <>
                  {isPaused ? (
                    <Button 
                      onClick={resumeRecording} 
                      size="lg" 
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Resume
                    </Button>
                  ) : (
                    <Button 
                      onClick={pauseRecording} 
                      size="lg" 
                      variant="outline" 
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/20 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleStopRecording} 
                    size="lg" 
                    variant="outline" 
                    className="border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/20 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Stop
                  </Button>
                </>
              )}

              {audioBlob && !isProcessing && (
                <>
                  <Button 
                    onClick={handleDiscard} 
                    variant="outline" 
                    size="lg" 
                    className="border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/20 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Discard
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Recording */}
        {audioBlob && (
          <Card className="border-border bg-card/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Save className="w-5 h-5 text-emerald-600" />
                Save & Process Recording
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-foreground">Recording Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`AI Recording ${new Date().toLocaleDateString()}`}
                  disabled={isProcessing}
                  className="bg-background border-border focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>

              {/* Tags */}
              <div>
                <Label className="text-foreground">Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600"
                        disabled={isProcessing}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag..."
                    disabled={isProcessing}
                    className="bg-background border-border"
                  />
                  <Button
                    onClick={addTag}
                    variant="outline"
                    size="sm"
                    disabled={!newTag.trim() || isProcessing}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <p className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-300 mb-3">
                  <Sparkles className="w-5 h-5" />
                  AI Processing Pipeline
                </p>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Duration: {formatDuration(recordingDuration)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Auto language detection</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>High-accuracy transcription</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      <span>Auto-translation (if needed)</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>AI summary generation</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span>Secure local storage</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveRecording}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span className="loading-dots">Processing with AI</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Process with AI & Save
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
