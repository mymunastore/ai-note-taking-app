import React from "react";
import { Check, Sparkles, Zap, Crown, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export default function PricingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      icon: Sparkles,
      features: [
        "5 recordings per month",
        "Basic transcription",
        "AI summaries",
        "Local storage",
        "Basic search",
        "50+ language support",
        "Auto-translation to English",
      ],
      limitations: [
        "No real-time transcription",
        "No team collaboration",
        "No priority support",
      ],
      buttonText: "Current Plan",
      buttonVariant: "outline" as const,
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: "$19",
      period: "per month",
      description: "For professionals and teams",
      icon: Zap,
      features: [
        "Unlimited recordings",
        "Real-time transcription",
        "50+ language support",
        "Auto-translation",
        "Advanced AI summaries",
        "Team collaboration",
        "Priority support",
        "Export to multiple formats",
        "Advanced search & filters",
        "Project management",
      ],
      buttonText: "Contact Sales",
      buttonVariant: "default" as const,
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$49",
      period: "per month",
      description: "For large organizations",
      icon: Crown,
      features: [
        "Everything in Pro",
        "Custom integrations",
        "Advanced workflows",
        "SSO & SAML",
        "Advanced security",
        "Dedicated support",
        "Custom AI models",
        "API access",
        "White-label options",
        "On-premise deployment",
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
      popular: false,
    },
  ];

  const handleContactSales = (planName: string) => {
    const subject = `Interested in SCRIBE AI ${planName} Plan`;
    const body = `Hi,

I'm interested in learning more about the SCRIBE AI ${planName} plan. Could you please provide more information about:

- Pricing details
- Available features
- Implementation timeline
- Support options

Thank you!

Best regards,
${user?.firstName || 'User'}`;

    const mailtoLink = `mailto:sales@scribeai.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    toast({
      title: "Email Client Opened",
      description: "Your default email client should open with a pre-filled message to our sales team.",
    });
  };

  const handleCurrentPlan = () => {
    toast({
      title: "Current Plan",
      description: "You're currently on the free plan with full access to core features.",
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock the full potential of AI-powered note-taking with our flexible pricing options.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card 
                key={plan.id} 
                className={`relative border-border bg-card hover:shadow-lg transition-all duration-200 ${
                  plan.popular ? "border-emerald-500 shadow-lg scale-105" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </div>
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.limitations && plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-center gap-3 opacity-60">
                        <div className="w-5 h-5 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="w-3 h-3 text-gray-400">×</span>
                        </div>
                        <span className="text-sm text-muted-foreground line-through">{limitation}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => plan.id === "free" ? handleCurrentPlan() : handleContactSales(plan.name)}
                    variant={plan.buttonVariant}
                    className={`w-full ${
                      plan.popular 
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white" 
                        : ""
                    }`}
                    disabled={plan.id === "free"}
                  >
                    {plan.id === "free" ? (
                      plan.buttonText
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        {plan.buttonText}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Information */}
        <div className="text-center mb-12">
          <Card className="max-w-2xl mx-auto border-border bg-card">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Ready to upgrade? Let's talk!
              </h3>
              <p className="text-muted-foreground mb-6">
                Contact our sales team to discuss your needs and get a custom quote for Pro or Enterprise plans.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => handleContactSales("Pro")}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Sales
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const mailtoLink = `mailto:support@scribeai.com?subject=SCRIBE AI Demo Request`;
                    window.location.href = mailtoLink;
                  }}
                >
                  Request Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Can I change my plan anytime?
                </h3>
                <p className="text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Contact our sales team to discuss plan changes and billing adjustments.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Is my data secure?
                </h3>
                <p className="text-muted-foreground">
                  Absolutely. All your recordings and transcripts are stored locally on your device with enterprise-grade encryption. We never store your personal data on our servers.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-2">
                  What's included in the free plan?
                </h3>
                <p className="text-muted-foreground">
                  The free plan includes 5 recordings per month, basic transcription, AI summaries, 50+ language support, and auto-translation to English. Perfect for trying out SCRIBE AI!
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-2">
                  How do I get started with a paid plan?
                </h3>
                <p className="text-muted-foreground">
                  Simply contact our sales team using the "Contact Sales" button above. We'll discuss your needs, provide a custom quote, and help you get set up with the perfect plan for your organization.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
