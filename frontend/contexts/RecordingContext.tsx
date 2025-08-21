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
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      // Check MediaRecorder support
      if (!window.MediaRecorder) {
        throw new Error("MediaRecorder is not supported in your browser.");
      }

      // Try different MIME types for better compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose
          }
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
      
      let errorMessage = "Failed to access microphone. Please check permissions and try again.";
      
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Microphone access denied. Please allow microphone permissions and try again.";
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
  }, [isPaused, toast]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      try {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        pausedTimeRef.current += Date.now() - startTimeRef.current;
        
        toast({
          title: "Recording Paused",
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
          title: "Recording Resumed",
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
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: audioChunksRef.current[0]?.type || "audio/webm" 
          });
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
      // Validate audio blob
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("Invalid audio recording. Please try recording again.");
      }

      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      if (!base64Audio) {
        throw new Error("Failed to process audio data. Please try again.");
      }

      // Step 1: Auto-detect language and transcribe
      toast({
        title: "🎯 Auto-Detecting Language",
        description: "SCRIBE AI is analyzing your audio to detect the language being spoken...",
      });
      
      const transcribeResponse = await backend.ai.transcribe({ audioBase64: base64Audio });
      
      if (!transcribeResponse.transcript || !transcribeResponse.transcript.trim()) {
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
      
      if (!summaryResponse.summary) {
        throw new Error("Failed to generate summary. Using transcript as summary.");
      }
      
      // Step 4: Save note with enhanced metadata
      toast({
        title: "💾 Saving Your Note",
        description: "Storing your transcription and AI analysis securely...",
      });
      
      await backend.notes.create({
        title: title || `Recording ${new Date().toLocaleDateString()}`,
        transcript: transcribeResponse.transcript,
        summary: summaryResponse.summary || "Summary not available",
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
      
      let errorMessage = "Failed to process recording. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Processing Error",
        description: errorMessage,
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
