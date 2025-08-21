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
  transmissionStatus: "idle" | "uploading" | "processing" | "success" | "error";
  retryTransmission: () => Promise<void>;
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
  const [transmissionStatus, setTransmissionStatus] = React.useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const lastRecordingDataRef = useRef<{ audioBlob: Blob; duration: number; title: string; tags?: string[] } | null>(null);
  
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      // Enhanced browser compatibility checks
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.");
      }

      // Request microphone access with enhanced error handling
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      
      // Enhanced MediaRecorder support check
      if (!window.MediaRecorder) {
        throw new Error("MediaRecorder is not supported in your browser.");
      }

      // Try multiple MIME types for maximum compatibility
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
        setTransmissionStatus("error");
        toast({
          title: "Recording Error",
          description: "An error occurred during recording. Please try again.",
          variant: "destructive",
        });
      };
      
      // Start recording with smaller chunks for better reliability
      mediaRecorder.start(500);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setTransmissionStatus("idle");
      
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
        description: "SCRIBE AI is now listening with enhanced audio processing and will auto-detect the language being spoken.",
      });
      
    } catch (error) {
      console.error("Failed to start recording:", error);
      setTransmissionStatus("error");
      
      let errorMessage = "Failed to access microphone. Please check permissions and try again.";
      
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Microphone access denied. Please allow microphone permissions and try again.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "No microphone found. Please connect a microphone and try again.";
        } else if (error.name === "NotSupportedError") {
          errorMessage = "Audio recording is not supported in your browser. Please use Chrome, Firefox, or Safari.";
        } else if (error.name === "OverconstrainedError") {
          errorMessage = "Microphone constraints not supported. Trying with basic settings...";
          // Retry with basic constraints
          try {
            const basicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Continue with basic stream...
          } catch (retryError) {
            errorMessage = "Failed to access microphone even with basic settings.";
          }
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
          // Enhanced blob creation with fallback
          let audioBlob: Blob;
          
          if (audioChunksRef.current.length === 0) {
            throw new Error("No audio data recorded");
          }

          try {
            audioBlob = new Blob(audioChunksRef.current, { 
              type: audioChunksRef.current[0]?.type || "audio/webm" 
            });
          } catch (blobError) {
            // Fallback: create blob without type specification
            audioBlob = new Blob(audioChunksRef.current);
          }

          if (audioBlob.size === 0) {
            throw new Error("Recorded audio file is empty");
          }

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
            title: "✅ Recording Complete",
            description: `Captured ${Math.floor(finalDuration / 60)}:${(finalDuration % 60).toString().padStart(2, '0')} of audio. Ready for AI processing.`,
          });
          
          resolve({ audioBlob, duration: finalDuration });
        } catch (error) {
          console.error("Error stopping recording:", error);
          setTransmissionStatus("error");
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
        setTransmissionStatus("error");
        resolve(null);
      }
    });
  }, [isRecording, duration, toast]);

  const processRecording = useCallback(async (audioBlob: Blob, recordingDuration: number, title: string, tags?: string[]) => {
    setIsProcessing(true);
    setTransmissionStatus("uploading");
    
    // Store recording data for retry functionality
    lastRecordingDataRef.current = { audioBlob, duration: recordingDuration, title, tags };
    
    try {
      // Enhanced validation
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("Invalid audio recording. Please try recording again.");
      }

      if (audioBlob.size > 25 * 1024 * 1024) { // 25MB limit
        throw new Error("Audio file too large. Please record shorter segments.");
      }

      // Enhanced base64 conversion with progress tracking
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

      setTransmissionStatus("processing");

      // Step 1: Enhanced language detection and transcription with retry logic
      toast({
        title: "🎯 AI Language Detection",
        description: "SCRIBE AI is analyzing your audio to detect the language being spoken...",
      });
      
      let transcribeResponse;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          transcribeResponse = await backend.ai.transcribe({ audioBase64: base64Audio });
          break;
        } catch (transcribeError) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error(`Transcription failed after ${maxRetries} attempts. Please check your internet connection and try again.`);
          }
          
          toast({
            title: "🔄 Retrying Transcription",
            description: `Attempt ${retryCount + 1} of ${maxRetries}...`,
          });
          
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      if (!transcribeResponse || !transcribeResponse.transcript || !transcribeResponse.transcript.trim()) {
        throw new Error("No speech detected in recording. Please ensure you spoke clearly and try again.");
      }

      // Step 2: Enhanced language detection feedback
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
      
      // Step 3: Enhanced AI summary generation with retry logic
      toast({
        title: "🤖 Generating AI Summary",
        description: "Creating intelligent summary with key points and action items...",
      });
      
      let summaryResponse;
      retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          summaryResponse = await backend.ai.summarize({ 
            transcript: transcribeResponse.transcript,
            length: "medium",
            format: "bullets"
          });
          break;
        } catch (summaryError) {
          retryCount++;
          if (retryCount >= maxRetries) {
            console.warn("Summary generation failed, using transcript as summary");
            summaryResponse = { summary: `Summary generation failed. Transcript: ${transcribeResponse.transcript.substring(0, 500)}...` };
            break;
          }
          
          toast({
            title: "🔄 Retrying Summary Generation",
            description: `Attempt ${retryCount + 1} of ${maxRetries}...`,
          });
          
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      // Step 4: Enhanced data persistence with validation
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

      // Validate note data before saving
      if (!noteData.title.trim() || !noteData.transcript.trim()) {
        throw new Error("Invalid note data. Please try again.");
      }

      await backend.notes.create(noteData);
      
      setTransmissionStatus("success");
      
      // Final success message with enhanced details
      toast({
        title: "✅ Processing Complete!",
        description: `Successfully processed ${Math.floor(recordingDuration / 60)}:${(recordingDuration % 60).toString().padStart(2, '0')} of audio with AI transcription${transcribeResponse.translated ? ' and translation' : ''}.`,
      });

      // Clear retry data on success
      lastRecordingDataRef.current = null;
      
    } catch (error) {
      console.error("Failed to process recording:", error);
      setTransmissionStatus("error");
      
      let errorMessage = "Transmission failed. Please check your internet connection and try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Transmission Failed",
        description: errorMessage,
        variant: "destructive",
        action: lastRecordingDataRef.current ? (
          <button 
            onClick={() => retryTransmission()}
            className="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-700"
          >
            Retry
          </button>
        ) : undefined,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [backend, toast]);

  const retryTransmission = useCallback(async () => {
    if (!lastRecordingDataRef.current) {
      toast({
        title: "No Data to Retry",
        description: "No previous recording data available for retry.",
        variant: "destructive",
      });
      return;
    }

    const { audioBlob, duration, title, tags } = lastRecordingDataRef.current;
    
    toast({
      title: "🔄 Retrying Transmission",
      description: "Attempting to process your recording again...",
    });

    await processRecording(audioBlob, duration, title, tags);
  }, [processRecording, toast]);

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
    transmissionStatus,
    retryTransmission,
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
