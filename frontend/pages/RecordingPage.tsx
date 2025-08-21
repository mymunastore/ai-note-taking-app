import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Square, Play, Pause, Save, Loader2, Sparkles, Activity, Globe, Languages, Tag, Plus, X, Settings, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRecording } from "../contexts/RecordingContext";
import { useNotes } from "../contexts/NotesContext";
import { formatDuration } from "../utils/formatters";
import AdvancedRecordingControls from "../components/AdvancedRecordingControls";

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
    permissionStatus,
  } = useRecording();

  const [title, setTitle] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [autoLanguageDetection, setAutoLanguageDetection] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  
  // Advanced settings
  const [advancedSettings, setAdvancedSettings] = useState({
    noiseReduction: true,
    autoGainControl: true,
    echoCancellation: true,
    sampleRate: 44100,
    bitrate: 128,
    sensitivity: [75],
    audioFormat: "webm",
    realTimeProcessing: false,
    languageHints: ["English"],
  });

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
      
      setAudioBlob(null);
      setRecordingDuration(0);
      setTitle("");
      setTags([]);
      
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

  const suggestedTags = ["meeting", "interview", "call", "lecture", "brainstorm", "review", "planning", "demo"];

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-emerald-50/30 via-teal-50/30 to-blue-50/30 dark:from-emerald-950/10 dark:via-teal-950/10 dark:to-blue-950/10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
              AI Voice Recording Studio
            </h1>
          </div>
          <p className="text-muted-foreground">
            Professional recording with AI-powered transcription, language detection, and intelligent summaries
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Recording</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            <TabsTrigger value="ai">AI Features</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            {/* Recording Studio */}
            <Card className="border-border bg-card/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-foreground">Recording Studio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-40 h-40 mb-6">
                    <div
                      className={`absolute inset-0 rounded-full transition-all duration-500 ${
                        isRecording
                          ? isPaused
                            ? "bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-800 dark:to-orange-800 animate-pulse"
                            : "bg-gradient-to-br from-red-200 to-rose-200 dark:from-red-800 dark:to-rose-800 animate-ping"
                          : "bg-gradient-to-br from-slate-200 to-gray-200 dark:from-slate-800 dark:to-gray-800"
                      }`}
                    />
                    
                    <div
                      className={`absolute inset-4 rounded-full transition-all duration-300 ${
                        isRecording
                          ? isPaused
                            ? "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 border-4 border-amber-300 dark:border-amber-600"
                            : "bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900 dark:to-rose-900 border-4 border-red-300 dark:border-red-600"
                          : "bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-900 dark:to-gray-900 border-4 border-slate-300 dark:border-slate-600"
                      }`}
                    />
                    
                    <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl">
                      <Mic
                        className={`w-10 h-10 text-white transition-all duration-300 ${
                          isRecording && !isPaused ? "animate-pulse" : ""
                        }`}
                      />
                    </div>
                  </div>
                  
                  <div className="text-4xl font-mono font-bold text-foreground mb-3 tracking-wider">
                    {formatDuration(duration)}
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {isRecording && !isPaused && <Activity className="w-5 h-5 animate-pulse text-emerald-600" />}
                    <Badge 
                      variant={
                        permissionStatus === 'denied' ? 'destructive' :
                        isRecording ? (isPaused ? "secondary" : "default") : "outline"
                      }
                      className={`text-sm px-3 py-1 ${
                        permissionStatus === 'denied' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        isRecording 
                          ? isPaused 
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" 
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {permissionStatus === 'denied' ? '⛔ Mic Permission Denied' :
                       isRecording
                        ? isPaused
                          ? "⏸️ Recording Paused"
                          : "🔴 Live Recording"
                        : audioBlob
                        ? "✅ Recording Complete"
                        : "⚡ Ready to Record"}
                    </Badge>
                  </div>

                  {permissionStatus !== 'denied' && autoLanguageDetection && (
                    <div className="text-xs text-muted-foreground bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-2 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                      <Globe className="w-4 h-4 inline mr-1" />
                      AI Language Detection Active - Speak in any of 50+ supported languages
                    </div>
                  )}
                </div>

                {permissionStatus === 'denied' && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="font-bold mb-2 flex items-center gap-2"><MicOff className="w-4 h-4" /> Microphone Access Denied</h4>
                    <p className="text-xs mb-2">SCRIBE AI needs access to your microphone to record audio. Please enable microphone access in your browser's settings for this site.</p>
                    <p className="text-xs">After enabling permission, click "Start Recording" again.</p>
                  </div>
                )}

                <div className="flex justify-center gap-4">
                  {!isRecording && !audioBlob && (
                    <Button
                      onClick={handleStartRecording}
                      size="lg"
                      className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Start Recording
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
                    <Button 
                      onClick={handleDiscard} 
                      variant="outline" 
                      size="lg" 
                      className="border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/20 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Discard
                    </Button>
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
                    <div className="flex gap-2 mb-2">
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
                    <div className="flex flex-wrap gap-1">
                      {suggestedTags.filter(tag => !tags.includes(tag)).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-xs"
                          onClick={() => setTags([...tags, tag])}
                        >
                          + {tag}
                        </Badge>
                      ))}
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
                          <span>Language detection</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>AI transcription</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                          <span>Auto-translation (if needed)</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span>Intelligent summary</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                          <span>Secure storage</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveRecording}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        <span>Processing with AI...</span>
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
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedRecordingControls
              settings={advancedSettings}
              onSettingsChange={setAdvancedSettings}
            />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card className="border-border bg-card/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  AI Features & Language Processing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Auto Language Detection
                        </Label>
                        <p className="text-xs text-muted-foreground">Automatically detect 50+ languages</p>
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
                        <p className="text-xs text-muted-foreground">Translate non-English content automatically</p>
                      </div>
                      <Switch
                        checked={autoTranslate}
                        onCheckedChange={setAutoTranslate}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Supported Languages</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        "English", "Spanish", "French", "German", "Italian", "Portuguese",
                        "Russian", "Japanese", "Korean", "Chinese", "Arabic", "Hindi",
                        "Dutch", "Swedish", "Norwegian", "Danish", "Finnish", "Polish"
                      ].map((lang) => (
                        <div key={lang} className="flex items-center gap-2 text-muted-foreground">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          {lang}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">AI Processing Features</h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm text-purple-600 dark:text-purple-400">
                    <div className="space-y-1">
                      <p>• Real-time language detection</p>
                      <p>• Automatic punctuation</p>
                      <p>• Speaker identification</p>
                      <p>• Noise filtering</p>
                    </div>
                    <div className="space-y-1">
                      <p>• Intelligent summarization</p>
                      <p>• Action item extraction</p>
                      <p>• Key topic identification</p>
                      <p>• Sentiment analysis</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
