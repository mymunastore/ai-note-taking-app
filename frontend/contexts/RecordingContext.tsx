import React, { createContext, useContext, ReactNode, useRef, useCallback, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

type PermissionStatus = 'prompt' | 'granted' | 'denied';

interface RecordingContextType {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<{ audioBlob: Blob; duration: number } | null>;
  isProcessing: boolean;
  processRecording: (audioBlob: Blob, duration: number, title: string, tags?: string[]) => Promise<void>;
  permissionStatus: PermissionStatus;
  checkPermission: () => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

interface RecordingProviderProps {
  children: ReactNode;
}

export function RecordingProvider({ children }: RecordingProviderProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  
  const { toast } = useToast();

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

  const startRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      
      if (!window.MediaRecorder) {
        throw new Error("MediaRecorder is not supported in your browser.");
      }

      let mimeType = '';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ];

      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast({
          title: "Recording Error",
          description: "An error occurred during recording. Please try again.",
          variant: "destructive",
        });
      };
      
      mediaRecorder.start(500);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      
      intervalRef.current = setInterval(() => {
        if (!isPaused) {
          const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current;
          setDuration(Math.floor(elapsed / 1000));
        }
      }, 1000);

      toast({
        title: "🎙️ Recording Started",
        description: "SCRIBE AI is now listening and will auto-detect the language being spoken.",
      });
      
    } catch (error) {
      console.error("Failed to start recording:", error);
      
      let errorMessage = "Failed to access microphone. Please check permissions and try again.";
      
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Microphone access denied. Please go to your browser's site settings to allow microphone access for this page.";
          checkPermission();
        } else if (error.name === "NotFoundError") {
          errorMessage = "No microphone found. Please connect a microphone and try again.";
        } else if (error.name === "NotSupportedError") {
          errorMessage = "Audio recording is not supported in your browser. Please use Chrome, Firefox, or Safari.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Recording Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [isPaused, toast, checkPermission]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      try {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        pausedTimeRef.current += Date.now() - startTimeRef.current;
        
        toast({
          title: "⏸️ Recording Paused",
          description: "Recording has been paused. Click resume to continue.",
        });
      } catch (error) {
        console.error("Failed to pause recording:", error);
        toast({
          title: "Pause Error",
          description: "Failed to pause recording. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [isRecording, isPaused, toast]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      try {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        startTimeRef.current = Date.now();
        
        toast({
          title: "▶️ Recording Resumed",
          description: "Recording has been resumed. SCRIBE AI is listening again.",
        });
      } catch (error) {
        console.error("Failed to resume recording:", error);
        toast({
          title: "Resume Error",
          description: "Failed to resume recording. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [isRecording, isPaused, toast]);

  const stopRecording = useCallback(async (): Promise<{ audioBlob: Blob; duration: number } | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        try {
          let audioBlob: Blob;
          
          if (audioChunksRef.current.length === 0) {
            throw new Error("No audio data recorded");
          }

          try {
            audioBlob = new Blob(audioChunksRef.current, { 
              type: audioChunksRef.current[0]?.type || "audio/webm" 
            });
          } catch (blobError) {
            audioBlob = new Blob(audioChunksRef.current);
          }

          if (audioBlob.size === 0) {
            throw new Error("Recorded audio file is empty");
          }

          const finalDuration = duration;
          
          setIsRecording(false);
          setIsPaused(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          }
          
          toast({
            title: "✅ Recording Complete",
            description: `Captured ${Math.floor(finalDuration / 60)}:${(finalDuration % 60).toString().padStart(2, '0')} of audio. Ready for AI processing.`,
          });
          
          resolve({ audioBlob, duration: finalDuration });
        } catch (error) {
          console.error("Error stopping recording:", error);
          toast({
            title: "Stop Error",
            description: "Error stopping recording. Please try again.",
            variant: "destructive",
          });
          resolve(null);
        }
      };

      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error("Error stopping MediaRecorder:", error);
        resolve(null);
      }
    });
  }, [isRecording, duration, toast]);

  const processRecording = useCallback(async (audioBlob: Blob, recordingDuration: number, title: string, tags?: string[]) => {
    setIsProcessing(true);
    
    try {
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("Invalid audio recording. Please try recording again.");
      }

      if (audioBlob.size > 25 * 1024 * 1024) {
        throw new Error("Audio file too large. Please record shorter segments.");
      }

      toast({
        title: "📤 Preparing Upload",
        description: "Converting audio data for transmission...",
      });

      const arrayBuffer = await audioBlob.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error("Audio data is corrupted. Please try recording again.");
      }

      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      if (!base64Audio || base64Audio.length < 100) {
        throw new Error("Failed to process audio data. Please try again.");
      }

      toast({
        title: "🎯 AI Language Detection",
        description: "SCRIBE AI is analyzing your audio to detect the language being spoken...",
      });
      
      const transcribeResponse = await backend.ai.transcribe({ audioBase64: base64Audio });
      
      if (!transcribeResponse || !transcribeResponse.transcript || !transcribeResponse.transcript.trim()) {
        throw new Error("No speech detected in recording. Please ensure you spoke clearly and try again.");
      }

      if (transcribeResponse.originalLanguage && transcribeResponse.originalLanguage !== "en") {
        const languageNames: Record<string, string> = {
          es: "Spanish", fr: "French", de: "German", it: "Italian", pt: "Portuguese",
          ru: "Russian", ja: "Japanese", ko: "Korean", zh: "Chinese", ar: "Arabic",
          hi: "Hindi", nl: "Dutch", sv: "Swedish", no: "Norwegian", da: "Danish",
          fi: "Finnish", pl: "Polish", tr: "Turkish", th: "Thai", vi: "Vietnamese"
        };
        
        const detectedLanguage = languageNames[transcribeResponse.originalLanguage] || transcribeResponse.originalLanguage.toUpperCase();
        
        toast({
          title: "🌍 Language Detected & Translated",
          description: `Detected ${detectedLanguage} and automatically translated to English for analysis.`,
        });
      } else {
        toast({
          title: "🇺🇸 English Detected",
          description: "English language detected. Processing transcript directly.",
        });
      }
      
      toast({
        title: "🤖 Generating AI Summary",
        description: "Creating intelligent summary with key points and action items...",
      });
      
      const summaryResponse = await backend.ai.summarize({ 
        transcript: transcribeResponse.transcript,
        length: "medium",
        format: "bullets"
      });
      
      toast({
        title: "💾 Saving Your Note",
        description: "Storing your transcription and AI analysis securely...",
      });
      
      const noteData = {
        title: title || `Recording ${new Date().toLocaleDateString()}`,
        transcript: transcribeResponse.transcript,
        summary: summaryResponse?.summary || "Summary not available",
        duration: recordingDuration,
        originalLanguage: transcribeResponse.originalLanguage,
        translated: transcribeResponse.translated,
        tags: tags || [],
      };

      if (!noteData.title.trim() || !noteData.transcript.trim()) {
        throw new Error("Invalid note data. Please try again.");
      }

      await backend.notes.create(noteData);
      
      toast({
        title: "✅ Processing Complete!",
        description: `Successfully processed ${Math.floor(recordingDuration / 60)}:${(recordingDuration % 60).toString().padStart(2, '0')} of audio with AI transcription${transcribeResponse.translated ? ' and translation' : ''}.`,
      });
      
    } catch (error) {
      console.error("Failed to process recording:", error);
      
      let errorMessage = "Processing failed. Please check your internet connection and try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const value: RecordingContextType = {
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
    checkPermission,
  };

  return <RecordingContext.Provider value={value}>{children}</RecordingContext.Provider>;
}

export function useRecording() {
  const context = useContext(RecordingContext);
  if (context === undefined) {
    throw new Error("useRecording must be used within a RecordingProvider");
  }
  return context;
}
