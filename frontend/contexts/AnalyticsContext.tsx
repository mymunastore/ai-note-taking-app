import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { posthogKey, posthogHost, hasPostHog } from "../config";
import { useAuth } from "./AuthContext";
import backend from "~backend/client";

interface AnalyticsContextType {
  trackEvent: (event: string, properties?: Record<string, any>) => void;
  identifyUser: (userId: string, properties: Record<string, any>) => void;
  capturePageView: (url: string, title?: string) => void;
  isEnabled: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

// PostHog client for frontend tracking
let posthog: any = null;

if (hasPostHog && typeof window !== 'undefined') {
  import('posthog-js').then((module) => {
    posthog = module.default;
    posthog.init(posthogKey, {
      api_host: posthogHost,
      loaded: (posthog: any) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.debug();
        }
      },
    });
  });
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { user, isSignedIn } = useAuth();

  useEffect(() => {
    if (hasPostHog && posthog && isSignedIn && user) {
      // Identify user in PostHog
      posthog.identify(user.id, {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: user.publicMetadata?.plan || 'free',
      });

      // Also identify in backend
      backend.analytics.identifyUser({
        distinctId: user.id,
        properties: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          plan: user.publicMetadata?.plan || 'free',
          signedUpAt: user.createdAt,
        },
      }).catch(console.error);
    }
  }, [user, isSignedIn]);

  const trackEvent = (event: string, properties?: Record<string, any>) => {
    if (!hasPostHog) return;

    // Track in PostHog (frontend)
    if (posthog) {
      posthog.capture(event, properties);
    }

    // Track in backend
    backend.analytics.trackEvent({
      event,
      properties,
      distinctId: user?.id,
    }).catch(console.error);
  };

  const identifyUser = (userId: string, properties: Record<string, any>) => {
    if (!hasPostHog) return;

    // Identify in PostHog (frontend)
    if (posthog) {
      posthog.identify(userId, properties);
    }

    // Identify in backend
    backend.analytics.identifyUser({
      distinctId: userId,
      properties,
    }).catch(console.error);
  };

  const capturePageView = (url: string, title?: string) => {
    if (!hasPostHog) return;

    // Capture in PostHog (frontend)
    if (posthog) {
      posthog.capture('$pageview', {
        $current_url: url,
        $title: title,
      });
    }

    // Capture in backend
    backend.analytics.capturePageView({
      url,
      title,
      referrer: document.referrer,
    }).catch(console.error);
  };

  const value: AnalyticsContextType = {
    trackEvent,
    identifyUser,
    capturePageView,
    isEnabled: hasPostHog,
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}
