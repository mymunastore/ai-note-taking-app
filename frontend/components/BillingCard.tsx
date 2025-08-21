import React from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Crown, Zap, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import backend from "~backend/client";

export default function BillingCard() {
  const { user, isPremium } = useAuth();
  const { toast } = useToast();

  const { data: billing, isLoading } = useQuery({
    queryKey: ["billing"],
    queryFn: () => backend.billing.getSubscription(),
    enabled: !!user,
  });

  const handleUpgrade = async (plan: "pro" | "enterprise") => {
    try {
      const priceId = plan === "pro" ? "price_pro_monthly" : "price_enterprise_monthly";
      const response = await backend.billing.createCheckoutSession({
        priceId,
        successUrl: `${window.location.origin}/billing/success`,
        cancelUrl: `${window.location.origin}/billing`,
      });
      
      window.location.href = response.sessionUrl;
    } catch (error) {
      console.error("Upgrade error:", error);
      toast({
        title: "Upgrade Error",
        description: "Failed to start upgrade process. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await backend.billing.createPortalSession({
        returnUrl: window.location.href,
      });
      
      window.location.href = response.sessionUrl;
    } catch (error) {
      console.error("Billing portal error:", error);
      toast({
        title: "Billing Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const usage = billing?.usage;
  const limits = billing?.limits;
  const subscription = billing?.subscription;

  const planFeatures = {
    free: [
      "10 recordings per month",
      "60 minutes transcription",
      "100MB storage",
      "Basic AI summaries",
      "Email support",
    ],
    pro: [
      "1,000 recordings per month",
      "1,000 minutes transcription",
      "10GB storage",
      "Advanced AI analysis",
      "Real-time transcription",
      "Priority support",
      "Export & sharing",
    ],
    enterprise: [
      "Unlimited recordings",
      "Unlimited transcription",
      "Unlimited storage",
      "Advanced AI workflows",
      "Team collaboration",
      "Custom integrations",
      "Dedicated support",
      "SSO & security",
    ],
  };

  const currentPlan = subscription?.plan || (isPremium ? "pro" : "free");

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentPlan === "enterprise" ? (
              <Crown className="w-5 h-5 text-yellow-600" />
            ) : currentPlan === "pro" ? (
              <Zap className="w-5 h-5 text-blue-600" />
            ) : (
              <CreditCard className="w-5 h-5 text-gray-600" />
            )}
            Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            {subscription?.status && (
              <Badge variant={subscription.status === "active" ? "default" : "destructive"}>
                {subscription.status}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {usage && limits && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Recordings this month</span>
                  <span>
                    {usage.recordingsThisMonth} / {limits.maxRecordings === -1 ? "∞" : limits.maxRecordings}
                  </span>
                </div>
                <Progress 
                  value={limits.maxRecordings === -1 ? 0 : (usage.recordingsThisMonth / limits.maxRecordings) * 100} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Transcription minutes</span>
                  <span>
                    {usage.transcriptionMinutesThisMonth} / {limits.maxTranscriptionMinutes === -1 ? "∞" : limits.maxTranscriptionMinutes}
                  </span>
                </div>
                <Progress 
                  value={limits.maxTranscriptionMinutes === -1 ? 0 : (usage.transcriptionMinutesThisMonth / limits.maxTranscriptionMinutes) * 100} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Storage used</span>
                  <span>
                    {usage.storageUsedMB}MB / {limits.maxStorageMB === -1 ? "∞" : `${limits.maxStorageMB}MB`}
                  </span>
                </div>
                <Progress 
                  value={limits.maxStorageMB === -1 ? 0 : (usage.storageUsedMB / limits.maxStorageMB) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          )}

          {subscription ? (
            <div className="flex gap-2">
              <Button onClick={handleManageBilling} variant="outline">
                Manage Billing
              </Button>
              {currentPlan !== "enterprise" && (
                <Button 
                  onClick={() => handleUpgrade(currentPlan === "free" ? "pro" : "enterprise")}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  Upgrade Plan
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={() => handleUpgrade("pro")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                Upgrade to Pro
              </Button>
              <Button 
                onClick={() => handleUpgrade("enterprise")}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
              >
                Enterprise
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(planFeatures).map(([plan, features]) => (
          <Card 
            key={plan} 
            className={`border-border bg-card ${
              plan === currentPlan ? "ring-2 ring-emerald-500" : ""
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plan === "enterprise" ? (
                  <Crown className="w-5 h-5 text-yellow-600" />
                ) : plan === "pro" ? (
                  <Zap className="w-5 h-5 text-blue-600" />
                ) : (
                  <CreditCard className="w-5 h-5 text-gray-600" />
                )}
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
                {plan === currentPlan && (
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    Current
                  </Badge>
                )}
              </CardTitle>
              <div className="text-2xl font-bold">
                {plan === "free" ? "Free" : plan === "pro" ? "$29/mo" : "$99/mo"}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {plan !== currentPlan && (
                <Button 
                  onClick={() => handleUpgrade(plan as "pro" | "enterprise")}
                  className="w-full mt-4"
                  variant={plan === "enterprise" ? "default" : "outline"}
                >
                  {plan === "free" ? "Downgrade" : "Upgrade"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
