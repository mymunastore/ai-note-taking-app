import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mic, Globe, Sparkles, Zap, Shield, Users, Play, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Logo3D from "../components/Logo3D";

export default function WelcomePage() {
  const navigate = useNavigate();
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: Mic,
      title: "Smart Recording",
      description: "Crystal-clear audio capture with intelligent noise reduction",
      color: "from-red-500 to-rose-600"
    },
    {
      icon: Globe,
      title: "50+ Languages",
      description: "Automatic language detection and real-time translation",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: Sparkles,
      title: "AI Summaries",
      description: "Intelligent insights and action items extraction",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade encryption and privacy protection",
      color: "from-emerald-500 to-teal-600"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem("scribe-welcome-seen", "true");
    navigate("/home");
  };

  const handleLearnMore = () => {
    const element = document.getElementById("features-section");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-blue-950/20"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl animate-float-delay"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-float-delay-2"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 py-12">
          <div className="max-w-6xl mx-auto text-center">
            {/* 3D Logo */}
            <div className="mb-8 flex justify-center">
              <Logo3D size="xl" animated={true} showText={true} />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Transform Your Voice Into
              <span className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
                Intelligent Insights
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Experience the future of note-taking with AI-powered transcription, 
              real-time translation, and intelligent summaries across 50+ languages.
            </p>

            {/* Feature Showcase */}
            <div className="mb-12">
              <Card className="max-w-md mx-auto border-border bg-card/80 backdrop-blur-sm shadow-2xl card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-4">
                    {React.createElement(features[currentFeature].icon, {
                      className: `w-12 h-12 text-white p-2 rounded-lg bg-gradient-to-r ${features[currentFeature].color} animate-glow`
                    })}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {features[currentFeature].title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {features[currentFeature].description}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="btn-premium text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              >
                <Play className="w-5 h-5 mr-2" />
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button
                onClick={handleLearnMore}
                variant="outline"
                size="lg"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/20 shadow-lg hover:shadow-xl transition-all duration-300 glass"
              >
                Learn More
                <ChevronDown className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">50+</div>
                <div className="text-sm text-muted-foreground">Languages</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">99.9%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">10K+</div>
                <div className="text-sm text-muted-foreground">Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600 mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">AI Ready</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features-section" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Powered by Advanced AI Technology
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience the next generation of voice intelligence with cutting-edge features designed for modern professionals.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="border-border bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group card-hover">
                    <CardContent className="pt-6 text-center">
                      <div className="mb-4 flex justify-center">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-glow`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-12 text-white shadow-2xl animate-gradient">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Workflow?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of professionals who trust SCRIBE AI for their voice intelligence needs.
              </p>
              <Button
                onClick={handleGetStarted}
                size="lg"
                variant="secondary"
                className="bg-white text-emerald-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
