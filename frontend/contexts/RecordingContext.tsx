import React, { createContext, useContext, ReactNode, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "./AuthContext";

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
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

interface RecordingProviderProps {
  children: ReactNode;
}

export function RecordingProvider({ children }: RecordingProviderProps) {
  const backend = useBackend();
  const [isRecording, setIsRecording] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(1000); // Collect data every second for better quality
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
        title: "Recording Started",
        description: "SCRIBE AI is now listening and will auto-detect the language being spoken.",
      });
      
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Recording Error",
        description: "Failed to access microphone. Please check permissions and try again.",
        variant: "destructive",
      });
    }
  }, [isPaused, toast]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      pausedTimeRef.current += Date.now() - startTimeRef.current;
      
      toast({
        title: "Recording Paused",
        description: "Recording has been paused. Click resume to continue.",
      });
    }
  }, [isRecording, isPaused, toast]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimeRef.current = Date.now();
      
      toast({
        title: "Recording Resumed",
        description: "Recording has been resumed. SCRIBE AI is listening again.",
      });
    }
  }, [isRecording, isPaused, toast]);

  const stopRecording = useCallback(async (): Promise<{ audioBlob: Blob; duration: number } | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" });
        const finalDuration = duration;
        
        // Clean up
        setIsRecording(false);
        setIsPaused(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        // Stop all tracks
        if (mediaRecorderRef.current?.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        
        toast({
          title: "Recording Complete",
          description: `Captured ${Math.floor(finalDuration / 60)}:${(finalDuration % 60).toString().padStart(2, '0')} of audio. Ready for AI processing.`,
        });
        
        resolve({ audioBlob, duration: finalDuration });
      };

      mediaRecorderRef.current.stop();
    });
  }, [isRecording, duration, toast]);

  const processRecording = useCallback(async (audioBlob: Blob, recordingDuration: number, title: string, tags?: string[]) => {
    setIsProcessing(true);
    
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Step 1: Auto-detect language and transcribe
      toast({
        title: "🎯 Auto-Detecting Language",
        description: "SCRIBE AI is analyzing your audio to detect the language being spoken...",
      });
      
      const transcribeResponse = await backend.ai.transcribe({ audioBase64: base64Audio });
      
      if (!transcribeResponse.transcript.trim()) {
        throw new Error("No speech detected in recording. Please ensure you spoke clearly and try again.");
      }

      // Step 2: Show language detection result and translation status
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
      
      // Step 3: Generate AI summary
      toast({
        title: "🤖 Generating AI Summary",
        description: "Creating intelligent summary with key points and action items...",
      });
      
      const summaryResponse = await backend.ai.summarize({ 
        transcript: transcribeResponse.transcript,
        length: "medium",
        format: "bullets"
      });
      
      // Step 4: Save note with enhanced metadata
      toast({
        title: "💾 Saving Your Note",
        description: "Storing your transcription and AI analysis securely...",
      });
      
      await backend.notes.create({
        title: title || `Recording ${new Date().toLocaleDateString()}`,
        transcript: transcribeResponse.transcript,
        summary: summaryResponse.summary,
        duration: recordingDuration,
        originalLanguage: transcribeResponse.originalLanguage,
        translated: transcribeResponse.translated,
        tags: tags || [],
      });
      
      // Final success message
      toast({
        title: "✅ Processing Complete!",
        description: `Successfully processed ${Math.floor(recordingDuration / 60)}:${(recordingDuration % 60).toString().padStart(2, '0')} of audio with AI transcription${transcribeResponse.translated ? ' and translation' : ''}.`,
      });
      
    } catch (error) {
      console.error("Failed to process recording:", error);
      toast({
        title: "❌ Processing Error",
        description: error instanceof Error ? error.message : "Failed to process recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [backend, toast]);

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
