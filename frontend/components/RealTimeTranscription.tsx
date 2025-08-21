import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, Settings, Activity, Globe, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";

interface RealTimeTranscriptionProps {
  onTranscriptUpdate?: (transcript: string) => void;
  onLanguageDetected?: (language: string) => void;
}

type PermissionStatus = 'prompt' | 'granted' | 'denied';

export default function RealTimeTranscription({ onTranscriptUpdate, onLanguageDetected }: RealTimeTranscriptionProps) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("en");
  const [confidence, setConfidence] = useState(0);
  const [volume, setVolume] = useState(0);
  const [settings, setSettings] = useState({
    autoLanguageDetection: true,
    continuousMode: true,
    noiseReduction: true,
    sensitivity: [75],
    targetLanguage: "auto"
  });
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt');

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number>();

  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      setPermissionStatus('prompt');
      return;
    }
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionStatus(result.state as PermissionStatus);
      result.onchange = () => {
        setPermissionStatus(result.state as PermissionStatus);
      };
    } catch (error) {
      console.error("Error checking microphone permission:", error);
      setPermissionStatus('prompt');
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Real-time transcription is not supported in this browser. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = settings.targetLanguage === "auto" ? "en-US" : settings.targetLanguage;

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: "🎙️ Listening Started",
        description: "Real-time transcription is now active",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
      if (settings.continuousMode && isListening) {
        // Restart recognition in continuous mode
        setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            console.log("Recognition restart failed:", error);
          }
        }, 100);
      }
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          setConfidence(result[0].confidence);
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        onTranscriptUpdate?.(transcript + finalTranscript);
      }
      
      setInterimTranscript(interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      
      if (event.error !== "aborted") {
        toast({
          title: "Recognition Error",
          description: `Speech recognition failed: ${event.error}`,
          variant: "destructive",
        });
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [settings.targetLanguage, settings.continuousMode, isListening, onTranscriptUpdate, toast, transcript]);

  const startListening = async () => {
    try {
      // Request microphone permission and setup audio analysis
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for volume monitoring
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      // Start volume monitoring
      monitorVolume();
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error("Failed to start listening:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        checkPermission();
      }
      toast({
        title: "Microphone Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
  };

  const monitorVolume = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateVolume = () => {
      analyserRef.current!.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      setVolume(average);
      
      animationRef.current = requestAnimationFrame(updateVolume);
    };
    
    updateVolume();
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
  };

  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      "en-US": "English (US)",
      "en-GB": "English (UK)",
      "es-ES": "Spanish",
      "fr-FR": "French",
      "de-DE": "German",
      "it-IT": "Italian",
      "pt-PT": "Portuguese",
      "ru-RU": "Russian",
      "ja-JP": "Japanese",
      "ko-KR": "Korean",
      "zh-CN": "Chinese (Simplified)",
      "ar-SA": "Arabic",
      "hi-IN": "Hindi",
    };
    return languages[code] || code;
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Real-Time Transcription
            <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300">
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <Button
                onClick={isListening ? stopListening : startListening}
                size="lg"
                className={`w-16 h-16 rounded-full ${
                  isListening 
                    ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                    : "bg-emerald-600 hover:bg-emerald-700"
                } text-white shadow-lg`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
              
              {/* Volume Indicator */}
              {isListening && (
                <div className="absolute -inset-2 rounded-full border-4 border-emerald-400 opacity-75 animate-ping"></div>
              )}
            </div>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">
                {isListening ? "Listening..." : "Click to start"}
              </div>
              {isListening && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Volume2 className="w-3 h-3" />
                  <div className="w-20 bg-muted rounded-full h-1">
                    <div 
                      className="bg-emerald-600 h-1 rounded-full transition-all duration-100" 
                      style={{ width: `${Math.min(volume, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {permissionStatus === 'denied' && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-bold mb-2 flex items-center gap-2"><MicOff className="w-4 h-4" /> Microphone Access Denied</h4>
              <p className="text-xs">Please enable microphone access in your browser settings to use live transcription.</p>
            </div>
          )}

          {/* Status Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium text-foreground">Status</div>
              <Badge variant={isListening ? "default" : "secondary"} className="mt-1">
                {isListening ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium text-foreground">Language</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Globe className="w-3 h-3" />
                {settings.targetLanguage === "auto" ? "Auto" : getLanguageName(settings.targetLanguage)}
              </div>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium text-foreground">Confidence</div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round(confidence * 100)}%
              </div>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium text-foreground">Words</div>
              <div className="text-xs text-muted-foreground mt-1">
                {transcript.split(' ').filter(Boolean).length}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Auto Language Detection</Label>
                <Switch
                  checked={settings.autoLanguageDetection}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoLanguageDetection: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Continuous Mode</Label>
                <Switch
                  checked={settings.continuousMode}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, continuousMode: checked }))}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Target Language</Label>
                <Select 
                  value={settings.targetLanguage} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, targetLanguage: value }))}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="es-ES">Spanish</SelectItem>
                    <SelectItem value="fr-FR">French</SelectItem>
                    <SelectItem value="de-DE">German</SelectItem>
                    <SelectItem value="it-IT">Italian</SelectItem>
                    <SelectItem value="pt-PT">Portuguese</SelectItem>
                    <SelectItem value="ja-JP">Japanese</SelectItem>
                    <SelectItem value="ko-KR">Korean</SelectItem>
                    <SelectItem value="zh-CN">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Transcript */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Languages className="w-5 h-5 text-emerald-600" />
              Live Transcript
            </CardTitle>
            <Button variant="outline" size="sm" onClick={clearTranscript}>
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="min-h-[200px] max-h-[400px] overflow-y-auto p-4 bg-muted rounded-lg">
            <div className="text-foreground whitespace-pre-wrap">
              {transcript}
              {interimTranscript && (
                <span className="text-muted-foreground italic">
                  {interimTranscript}
                </span>
              )}
              {isListening && !transcript && !interimTranscript && (
                <span className="text-muted-foreground italic">
                  Start speaking to see live transcription...
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
