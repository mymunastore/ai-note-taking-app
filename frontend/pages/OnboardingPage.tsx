import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Mic, FileText, Sparkles, FolderOpen, Search, Download, Check, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Mic,
      title: "Record Meetings & Calls",
      description: "Start recording with a single click. SCRIBE AI captures high-quality audio with intelligent noise reduction.",
      features: [
        "One-click recording start/stop",
        "Pause and resume functionality", 
        "Background noise reduction",
        "Real-time duration tracking"
      ],
      demo: "Click the red record button to start capturing audio. You can pause anytime and resume when needed."
    },
    {
      icon: FileText,
      title: "Automatic Transcription",
      description: "Watch as your audio is converted to text in real-time with 99.9% accuracy across 50+ languages.",
      features: [
        "Real-time speech-to-text",
        "50+ language support",
        "Automatic language detection",
        "Speaker identification"
      ],
      demo: "Your recordings are automatically transcribed using advanced AI. Non-English content is translated to English."
    },
    {
      icon: Sparkles,
      title: "AI-Generated Summaries",
      description: "Get intelligent summaries with key points, action items, and insights extracted automatically.",
      features: [
        "Key points extraction",
        "Action items identification",
        "Sentiment analysis",
        "Meeting insights"
      ],
      demo: "AI analyzes your transcripts to create concise summaries highlighting the most important information."
    },
    {
      icon: FolderOpen,
      title: "Project Management",
      description: "Organize your recordings into projects and folders for better collaboration and management.",
      features: [
        "Create custom projects",
        "Folder organization",
        "Team collaboration",
        "Access controls"
      ],
      demo: "Group related recordings together in projects. Share with team members and manage permissions."
    },
    {
      icon: Search,
      title: "Smart Search",
      description: "Find any information instantly with full-text search across all your transcripts and summaries.",
      features: [
        "Full-text search",
        "Advanced filters",
        "Date range selection",
        "Content type filtering"
      ],
      demo: "Search for specific topics, speakers, or keywords across all your recordings and notes."
    },
    {
      icon: Download,
      title: "Export & Share",
      description: "Export your transcripts and summaries in multiple formats and share them securely with your team.",
      features: [
        "PDF, DOCX, TXT export",
        "Secure sharing links",
        "Email integration",
        "Cloud storage sync"
      ],
      demo: "Export your content in various formats or generate secure sharing links for team collaboration."
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("scribe-onboarding-completed", "true");
    navigate("/");
  };

  const handleComplete = () => {
    localStorage.setItem("scribe-onboarding-completed", "true");
    navigate("/record");
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to SCRIBE AI</h1>
          </div>
          <p className="text-muted-foreground">Let's get you started with a quick tour of our features</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Content */}
        <Card className="border-border bg-card mb-8">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl text-foreground">{currentStepData.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground text-lg">
              {currentStepData.description}
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Features List */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Key Features:</h3>
                <div className="space-y-3">
                  {currentStepData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Demo/Preview */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">How it works:</h3>
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                    {currentStepData.demo}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <SkipForward className="w-4 h-4" />
              Skip Tour
            </Button>

            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white flex items-center gap-2"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="w-4 h-4" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentStep
                  ? "bg-emerald-600"
                  : index < currentStep
                  ? "bg-emerald-300"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
