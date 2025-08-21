import React, { useState } from "react";
import { Settings, Mic, Volume2, Waves, Filter, Zap, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
  };
  onSettingsChange: (settings: any) => void;
}

export default function AdvancedRecordingControls({ 
  settings, 
  onSettingsChange 
}: AdvancedRecordingControlsProps) {
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
    "English", "Spanish", "French", "German", "Italian", "Portuguese",
    "Russian", "Japanese", "Korean", "Chinese", "Arabic", "Hindi"
  ];

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
                onCheckedChange={(checked) => updateSetting('noiseReduction', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto Gain Control</Label>
                <p className="text-xs text-muted-foreground">Normalize volume levels</p>
              </div>
              <Switch
                checked={settings.autoGainControl}
                onCheckedChange={(checked) => updateSetting('autoGainControl', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Echo Cancellation</Label>
                <p className="text-xs text-muted-foreground">Remove echo feedback</p>
              </div>
              <Switch
                checked={settings.echoCancellation}
                onCheckedChange={(checked) => updateSetting('echoCancellation', checked)}
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
              <Select 
                value={settings.audioFormat} 
                onValueChange={(value) => updateSetting('audioFormat', value)}
              >
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
                onValueChange={(value) => updateSetting('sampleRate', parseInt(value))}
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
            <Label className="text-sm font-medium">
              Microphone Sensitivity: {settings.sensitivity[0]}%
            </Label>
            <Slider
              value={settings.sensitivity}
              onValueChange={(value) => updateSetting('sensitivity', value)}
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
              onCheckedChange={(checked) => updateSetting('realTimeProcessing', checked)}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Language Hints</Label>
            <p className="text-xs text-muted-foreground">
              Help AI detect languages more accurately
            </p>
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
                      ? currentHints.filter(h => h !== lang)
                      : [...currentHints, lang];
                    updateSetting('languageHints', newHints);
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
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Performance Impact
            </span>
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
