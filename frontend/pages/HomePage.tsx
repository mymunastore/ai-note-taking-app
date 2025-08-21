import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, FileText, Sparkles, Globe, Shield, Zap, Check, X, Play, Users, Search, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Logo3D from "../components/Logo3D";

export default function HomePage() {
  const navigate = useNavigate();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("scribe-disclaimer-accepted");
    if (!accepted) {
      setShowDisclaimer(true);
    } else {
      setHasAcceptedDisclaimer(true);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem("scribe-disclaimer-accepted", "true");
    setHasAcceptedDisclaimer(true);
    setShowDisclaimer(false);
    navigate("/onboarding");
  };

  const handleDeclineDisclaimer = () => {
    setShowDisclaimer(false);
    window.location.href = "https://google.com";
  };

  const features = [
    {
      icon: Mic,
      title: "Smart Recording",
      description: "Record meetings, calls, and voice notes with intelligent pause/resume controls and background noise reduction."
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description: "Automatic language detection and real-time translation to English from 50+ languages worldwide."
    },
    {
      icon: Sparkles,
      title: "AI-Powered Summaries",
      description: "Get instant, intelligent summaries with key points, action items, and sentiment analysis."
    },
    {
      icon: Search,
      title: "Smart Search",
      description: "Full-text search across all transcripts and summaries with advanced filtering options."
    },
    {
      icon: Users,
      title: "Project Management",
      description: "Organize recordings into projects and folders for better collaboration and management."
    },
    {
      icon: Download,
      title: "Export & Share",
      description: "Export transcripts and summaries in multiple formats (PDF, DOCX, TXT) and share securely."
    }
  ];

  const benefits = [
    "Save 80% of time on meeting notes",
    "Never miss important details again",
    "Automatic action item extraction",
    "Secure local storage with encryption",
    "Real-time collaboration features",
    "GDPR compliant and privacy-focused"
  ];

  if (!hasAcceptedDisclaimer && !showDisclaimer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-border bg-card">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-950/50 dark:to-rose-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You must accept our terms and conditions to use SCRIBE AI.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-blue-950/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Logo3D size="lg" animated={true} showText={false} />
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                SCRIBE AI
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Transform your meetings and calls into actionable insights with AI-powered transcription, 
              translation, and intelligent summaries.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                onClick={() => navigate("/onboarding")}
                size="lg" 
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Play className="w-5 h-5 mr-2" />
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                onClick={() => navigate("/record")}
                size="lg" 
                variant="outline" 
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/20"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features for Modern Teams
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to capture, transcribe, and analyze your important conversations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-border bg-card hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <CardTitle className="text-foreground">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">50+</div>
              <div className="text-muted-foreground">Languages Supported</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">99.9%</div>
              <div className="text-muted-foreground">Transcription Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">80%</div>
              <div className="text-muted-foreground">Time Saved</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">24/7</div>
              <div className="text-muted-foreground">AI Processing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your data is protected with industry-leading security measures and privacy controls.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border bg-card text-center">
              <CardHeader>
                <Shield className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <CardTitle className="text-foreground">Local Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All recordings and transcripts are stored locally on your device with AES encryption.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card text-center">
              <CardHeader>
                <Globe className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <CardTitle className="text-foreground">GDPR Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Fully compliant with GDPR, CCPA, and other international privacy regulations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card text-center">
              <CardHeader>
                <Zap className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <CardTitle className="text-foreground">Zero Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  AI processing services don't store your data - everything is processed and discarded.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Meetings?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of professionals who trust SCRIBE AI for their meeting intelligence needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/onboarding")}
              size="lg" 
              variant="secondary" 
              className="bg-white text-emerald-600 hover:bg-gray-100"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Free Trial
            </Button>
            <Button 
              onClick={() => navigate("/record")}
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10"
            >
              <Mic className="w-5 h-5 mr-2" />
              Try Recording Now
            </Button>
          </div>
        </div>
      </section>

      {/* Disclaimer Dialog */}
      <Dialog open={showDisclaimer} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-600" />
              Terms of Service & Privacy Policy
            </DialogTitle>
            <DialogDescription className="text-left space-y-4 mt-4">
              <p>
                Welcome to SCRIBE AI. By using our service, you agree to the following terms:
              </p>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Data Processing:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Audio recordings are processed by OpenAI for transcription and summarization</li>
                  <li>All data is stored locally on your device</li>
                  <li>No personal data is shared with third parties beyond AI processing</li>
                  <li>You can delete your data at any time</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Recording Consent:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>You are responsible for obtaining consent before recording others</li>
                  <li>Comply with local laws regarding call and meeting recording</li>
                  <li>Use the service ethically and responsibly</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Service Usage:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Service is provided "as-is" without warranties</li>
                  <li>We reserve the right to modify or discontinue features</li>
                  <li>Fair use policy applies to AI processing resources</li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                By clicking "Accept", you acknowledge that you have read and agree to our terms of service and privacy policy.
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-4 mt-6">
            <Button 
              variant="outline" 
              onClick={handleDeclineDisclaimer}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Decline
            </Button>
            <Button 
              onClick={handleAcceptDisclaimer}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Accept & Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
