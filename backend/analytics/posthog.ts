import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { secret } from "encore.dev/config";

const posthogApiKey = secret("PostHogApiKey");

interface TrackEventRequest {
  event: string;
  properties?: Record<string, any>;
  distinctId?: string;
}

interface TrackEventResponse {
  success: boolean;
}

interface IdentifyUserRequest {
  distinctId: string;
  properties: Record<string, any>;
}

interface IdentifyUserResponse {
  success: boolean;
}

interface CapturePageViewRequest {
  url: string;
  title?: string;
  referrer?: string;
  properties?: Record<string, any>;
}

interface CapturePageViewResponse {
  success: boolean;
}

interface GetInsightsRequest {
  timeframe?: "hour" | "day" | "week" | "month";
  events?: string[];
}

interface GetInsightsResponse {
  insights: {
    totalEvents: number;
    uniqueUsers: number;
    topEvents: Array<{
      event: string;
      count: number;
    }>;
    userActivity: Array<{
      date: string;
      events: number;
      users: number;
    }>;
  };
}

// Tracks custom events for analytics.
export const trackEvent = api<TrackEventRequest, TrackEventResponse>(
  { expose: true, method: "POST", path: "/analytics/track" },
  async (req) => {
    try {
      const auth = getAuthData();
      const distinctId = req.distinctId || auth?.userID || "anonymous";

      const payload = {
        api_key: posthogApiKey(),
        event: req.event,
        properties: {
          distinct_id: distinctId,
          timestamp: new Date().toISOString(),
          ...req.properties,
        },
      };

      const response = await fetch("https://app.posthog.com/capture/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`PostHog API error: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Track event error:", error);
      throw APIError.internal("Failed to track event");
    }
  }
);

// Identifies a user with properties for analytics.
export const identifyUser = api<IdentifyUserRequest, IdentifyUserResponse>(
  { auth: true, expose: true, method: "POST", path: "/analytics/identify" },
  async (req) => {
    try {
      const payload = {
        api_key: posthogApiKey(),
        event: "$identify",
        properties: {
          distinct_id: req.distinctId,
          $set: req.properties,
          timestamp: new Date().toISOString(),
        },
      };

      const response = await fetch("https://app.posthog.com/capture/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`PostHog API error: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Identify user error:", error);
      throw APIError.internal("Failed to identify user");
    }
  }
);

// Captures page view events for analytics.
export const capturePageView = api<CapturePageViewRequest, CapturePageViewResponse>(
  { expose: true, method: "POST", path: "/analytics/pageview" },
  async (req) => {
    try {
      const auth = getAuthData();
      const distinctId = auth?.userID || "anonymous";

      const payload = {
        api_key: posthogApiKey(),
        event: "$pageview",
        properties: {
          distinct_id: distinctId,
          $current_url: req.url,
          $title: req.title,
          $referrer: req.referrer,
          timestamp: new Date().toISOString(),
          ...req.properties,
        },
      };

      const response = await fetch("https://app.posthog.com/capture/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`PostHog API error: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Capture page view error:", error);
      throw APIError.internal("Failed to capture page view");
    }
  }
);

// Gets analytics insights from PostHog.
export const getInsights = api<GetInsightsRequest, GetInsightsResponse>(
  { auth: true, expose: true, method: "GET", path: "/analytics/insights" },
  async (req) => {
    try {
      // This is a simplified version - in production you'd use PostHog's query API
      // For now, we'll return mock data based on the request
      const timeframe = req.timeframe || "week";
      const events = req.events || ["recording_started", "note_created", "ai_summary_generated"];

      // Mock insights data
      const insights = {
        totalEvents: Math.floor(Math.random() * 1000) + 100,
        uniqueUsers: Math.floor(Math.random() * 100) + 10,
        topEvents: events.map(event => ({
          event,
          count: Math.floor(Math.random() * 50) + 5,
        })),
        userActivity: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          events: Math.floor(Math.random() * 20) + 5,
          users: Math.floor(Math.random() * 10) + 2,
        })).reverse(),
      };

      return { insights };
    } catch (error) {
      console.error("Get insights error:", error);
      throw APIError.internal("Failed to get analytics insights");
    }
  }
);
