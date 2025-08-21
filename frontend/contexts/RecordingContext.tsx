import React, { createContext, useContext, ReactNode, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

interface RecordingContextType {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<{ audioBlob: Blob; duration: number } | null>;
  isProcessing: boolean;
  processRecording: (audioBlob: Blob, duration: number, title: string) => Promise<void>;
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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start();
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
      
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Recording Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [isPaused, toast]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      pausedTimeRef.current += Date.now() - startTimeRef.current;
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimeRef.current = Date.now();
    }
  }, [isRecording, isPaused]);

  const stopRecording = useCallback(async (): Promise<{ audioBlob: Blob; duration: number } | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
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
        
        resolve({ audioBlob, duration: finalDuration });
      };

      mediaRecorderRef.current.stop();
    });
  }, [isRecording, duration]);

  const processRecording = useCallback(async (audioBlob: Blob, recordingDuration: number, title: string) => {
    setIsProcessing(true);
    
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Transcribe audio with automatic language detection and translation
      toast({
        title: "Processing Recording",
        description: "Detecting language and transcribing audio...",
      });
      
      const transcribeResponse = await backend.ai.transcribe({ audioBase64: base64Audio });
      
      if (!transcribeResponse.transcript.trim()) {
        throw new Error("No speech detected in recording");
      }

      // Show language detection result
      if (transcribeResponse.originalLanguage && transcribeResponse.originalLanguage !== "en") {
        toast({
          title: "Language Detected",
          description: `Detected ${transcribeResponse.originalLanguage.toUpperCase()} and translated to English`,
        });
      }
      
      // Generate summary
      toast({
        title: "Processing Recording",
        description: "Generating AI summary...",
      });
      
      const summaryResponse = await backend.ai.summarize({ transcript: transcribeResponse.transcript });
      
      // Save note
      await backend.notes.create({
        title: title || `Recording ${new Date().toLocaleDateString()}`,
        transcript: transcribeResponse.transcript,
        summary: summaryResponse.summary,
        duration: recordingDuration,
        originalLanguage: transcribeResponse.originalLanguage,
        translated: transcribeResponse.translated,
      });
      
      toast({
        title: "Success",
        description: "Recording processed and saved successfully!",
      });
      
    } catch (error) {
      console.error("Failed to process recording:", error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process recording",
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
