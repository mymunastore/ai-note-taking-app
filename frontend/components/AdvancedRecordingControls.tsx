import React, { useCallback, useEffect, useRef, useState } from "react";
import { Settings, Mic, Volume2, Waves, Zap, Brain, MicOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRecording } from "../contexts/RecordingContext";

interface AdvancedRecordingControlsProps {
  settings: {
    noiseReduction: boolean;
    autoGainControl: boolean;
    echoCancellation: boolean;
    sampleRate: number;
    bitrate: number;
    sensitivity: number[];
    audioFormat: string;
    realTimeProcessing: boolean;
    languageHints: string[];
    deviceId?: string;
  };
  onSettingsChange: (settings: any) => void;
}

export default function AdvancedRecordingControls({
  settings,
  onSettingsChange,
}: AdvancedRecordingControlsProps) {
  const { permissionStatus, requestMicrophoneAccess } = useRecording();
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(settings.deviceId);
  const [level, setLevel] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const updateSetting = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const audioFormats = [
    { value: "webm", label: "WebM (Recommended)", description: "Best compression" },
    { value: "mp4", label: "MP4", description: "Universal compatibility" },
    { value: "wav", label: "WAV", description: "Highest quality" },
  ];

  const sampleRates = [
    { value: 16000, label: "16 kHz", description: "Voice optimized" },
    { value: 44100, label: "44.1 kHz", description: "CD quality" },
    { value: 48000, label: "48 kHz", description: "Professional" },
  ];

  const languageHints = [
    "English",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Russian",
    "Japanese",
    "Korean",
    "Chinese",
    "Arabic",
    "Hindi",
  ];

  const cleanupStream = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (analyserRef.current) analyserRef.current.disconnect();
    analyserRef.current = null;
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    streamRef.current = null;
    setIsTestingMic(false);
    setLevel(0);
  };

  const enumerateMics = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const mics = list.filter((d) => d.kind === "audioinput" && d.deviceId);
      setDevices(mics);
      if (!selectedDeviceId && mics.length > 0) {
        setSelectedDeviceId(mics[0].deviceId);
      } else if (mics.length === 0) {
        setSelectedDeviceId(undefined);
      }
    } catch {
      // ignore
    }
  }, [selectedDeviceId]);

  // Auto-enumerate devices on mount and when permission changes
  useEffect(() => {
    if (permissionStatus === 'granted') {
      enumerateMics();
    }

    const onDeviceChange = () => {
      if (permissionStatus === 'granted') {
        enumerateMics();
      }
    };
    
    navigator.mediaDevices?.addEventListener?.("devicechange", onDeviceChange);

    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", onDeviceChange);
      cleanupStream();
    };
  }, [enumerateMics, permissionStatus]);

  useEffect(() => {
    if (selectedDeviceId !== settings.deviceId) {
      updateSetting("deviceId", selectedDeviceId);
    }
  }, [selectedDeviceId, settings.deviceId]);

  const startLevelMeter = (stream: MediaStream) => {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyserRef.current = audioCtxRef.current.createAnalyser();
    const source = audioCtxRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    analyserRef.current.fftSize = 256;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      const normalized = Math.min(100, Math.max(0, (avg / 255) * 100));
      setLevel(normalized);
      rafRef.current = requestAnimationFrame(tick);
    };

    tick();
  };

  const testMicrophone = async () => {
    if (isTestingMic) {
      cleanupStream();
      return;
    }

    try {
      setIsTestingMic(true);
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          noiseSuppression: settings.noiseReduction,
          echoCancellation: settings.echoCancellation,
          autoGainControl: settings.autoGainControl,
          // @ts-ignore
          sampleRate: settings.sampleRate,
        } as MediaTrackConstraints,
        video: false,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      await enumerateMics();
      startLevelMeter(stream);
    } catch (err: any) {
      console.error("Failed to test microphone:", err);
      cleanupStream();
    }
  };

  const handleEnableMicrophone = async () => {
    const success = await requestMicrophoneAccess();
    if (success) {
      await enumerateMics();
    }
  };

  const permissionBadge = (() => {
    switch (permissionStatus) {
      case "granted":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300">
            Granted
          </Badge>
        );
      case "denied":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300">
            Denied
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
            Ready
          </Badge>
        );
    }
  })();

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          Advanced Recording Settings
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            Pro
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Microphone Access */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Microphone Access
            {permissionBadge}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium">Input Device</Label>
              <Select
                value={selectedDeviceId || ""}
                onValueChange={(value) => setSelectedDeviceId(value)}
                disabled={permissionStatus !== 'granted'}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    permissionStatus !== 'granted' 
                      ? "Enable microphone access first" 
                      : devices.length === 0 
                        ? "No microphones found" 
                        : "Select microphone"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((d) => (
                    <SelectItem key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {permissionStatus === "denied" && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <MicOff className="w-3 h-3" />
                  Permission denied. Click "Enable Microphone" and allow access in the browser prompt.
                </p>
              )}
              {!window.isSecureContext && (
                <p className="text-xs text-amber-600 dark:text-amber-300">
                  This page is not in a secure context. Use HTTPS or localhost to access the microphone.
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              {permissionStatus !== 'granted' ? (
                <Button
                  onClick={handleEnableMicrophone}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Enable Microphone
                </Button>
              ) : (
                <Button
                  onClick={testMicrophone}
                  variant={isTestingMic ? "outline" : "default"}
                  className={!isTestingMic ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white" : ""}
                >
                  {isTestingMic ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop Test
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Test Microphone
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Live level meter (when testing) */}
          {isTestingMic && (
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${Math.min(100, Math.max(0, level))}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(level)}%</span>
            </div>
          )}
        </div>

        {/* Audio Processing */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <Waves className="w-4 h-4" />
            Audio Processing
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Noise Reduction</Label>
                <p className="text-xs text-muted-foreground">Filter background noise</p>
              </div>
              <Switch
                checked={settings.noiseReduction}
                onCheckedChange={(checked) => updateSetting("noiseReduction", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto Gain Control</Label>
                <p className="text-xs text-muted-foreground">Normalize volume levels</p>
              </div>
              <Switch
                checked={settings.autoGainControl}
                onCheckedChange={(checked) => updateSetting("autoGainControl", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Echo Cancellation</Label>
                <p className="text-xs text-muted-foreground">Remove echo feedback</p>
              </div>
              <Switch
                checked={settings.echoCancellation}
                onCheckedChange={(checked) => updateSetting("echoCancellation", checked)}
              />
            </div>
          </div>
        </div>

        {/* Audio Quality */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Audio Quality
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Audio Format</Label>
              <Select value={settings.audioFormat} onValueChange={(value) => updateSetting("audioFormat", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {audioFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <div>
                        <div className="font-medium">{format.label}</div>
                        <div className="text-xs text-muted-foreground">{format.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Sample Rate</Label>
              <Select
                value={settings.sampleRate.toString()}
                onValueChange={(value) => updateSetting("sampleRate", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sampleRates.map((rate) => (
                    <SelectItem key={rate.value} value={rate.value.toString()}>
                      <div>
                        <div className="font-medium">{rate.label}</div>
                        <div className="text-xs text-muted-foreground">{rate.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Microphone Sensitivity: {settings.sensitivity[0]}%</Label>
            <Slider
              value={settings.sensitivity}
              onValueChange={(value) => updateSetting("sensitivity", value)}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>

        {/* AI Processing */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Processing
          </h4>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Real-time Processing</Label>
              <p className="text-xs text-muted-foreground">Process audio as you speak</p>
            </div>
            <Switch
              checked={settings.realTimeProcessing}
              onCheckedChange={(checked) => updateSetting("realTimeProcessing", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Language Hints</Label>
            <p className="text-xs text-muted-foreground">Help AI detect languages more accurately</p>
            <div className="flex flex-wrap gap-2">
              {languageHints.map((lang) => (
                <Badge
                  key={lang}
                  variant={settings.languageHints.includes(lang) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    settings.languageHints.includes(lang)
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                  }`}
                  onClick={() => {
                    const currentHints = settings.languageHints;
                    const newHints = currentHints.includes(lang)
                      ? currentHints.filter((h) => h !== lang)
                      : [...currentHints, lang];
                    updateSetting("languageHints", newHints);
                  }}
                >
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Performance Impact</span>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            <p>• Higher sample rates increase file size and processing time</p>
            <p>• Real-time processing requires more CPU resources</p>
            <p>• Noise reduction may introduce slight latency</p>
            <p>• Language hints improve accuracy but use more memory</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
