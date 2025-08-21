import React from "react";
import { CreditCard, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import BillingCard from "../components/BillingCard";
import SignInButton from "../components/SignInButton";

export default function BillingPage() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-600" />
              Billing & Subscription
            </h1>
            <p className="text-muted-foreground">
              Sign in to manage your subscription and view usage
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-8 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Unlock Premium Features
            </h2>
            <p className="text-muted-foreground mb-6">
              Sign in to access your billing dashboard and upgrade to premium plans
            </p>
            <SignInButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription, view usage, and upgrade your plan
          </p>
        </div>

        <BillingCard />
      </div>
    </div>
  );
}
