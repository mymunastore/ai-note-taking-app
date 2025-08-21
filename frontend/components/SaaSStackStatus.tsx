import React from "react";
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { hasStripe, hasPostHog, hasSupabase } from "../config";

interface ServiceStatus {
  name: string;
  enabled: boolean;
  description: string;
  setupUrl: string;
  envVars: string[];
}

export default function SaaSStackStatus() {
  const services: ServiceStatus[] = [
    {
      name: "Stripe",
      enabled: hasStripe,
      description: "Payment processing and subscription management",
      setupUrl: "https://dashboard.stripe.com/apikeys",
      envVars: ["VITE_STRIPE_PUBLISHABLE_KEY", "StripeSecretKey", "StripeWebhookSecret"],
    },
    {
      name: "Resend",
      enabled: true, // Always available via backend
      description: "Transactional email delivery",
      setupUrl: "https://resend.com/api-keys",
      envVars: ["ResendApiKey"],
    },
    {
      name: "PostHog",
      enabled: hasPostHog,
      description: "Product analytics and user tracking",
      setupUrl: "https://app.posthog.com/project/settings",
      envVars: ["VITE_POSTHOG_KEY", "VITE_POSTHOG_HOST"],
    },
    {
      name: "Supabase",
      enabled: hasSupabase,
      description: "Enhanced database and real-time features",
      setupUrl: "https://app.supabase.com/project/_/settings/api",
      envVars: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "SupabaseServiceKey"],
    },
  ];

  const enabledCount = services.filter(service => service.enabled).length;
  const totalCount = services.length;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          SaaS Stack Status
          <Badge variant={enabledCount === totalCount ? "default" : "secondary"}>
            {enabledCount}/{totalCount} Enabled
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabledCount < totalCount && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              Some SaaS services are not configured. Add the required environment variables to enable full functionality.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                {service.enabled ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <div className="font-medium text-foreground">{service.name}</div>
                  <div className="text-sm text-muted-foreground">{service.description}</div>
                  {!service.enabled && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Required: {service.envVars.join(", ")}
                    </div>
                  )}
                </div>
              </div>
              
              {!service.enabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(service.setupUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Setup
                </Button>
              )}
            </div>
          ))}
        </div>

        {enabledCount === totalCount && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Complete SaaS Stack Enabled!</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              All services are configured and ready for production use.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
