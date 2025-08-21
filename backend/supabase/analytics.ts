import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { supabase } from "./client";

interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data: Record<string, any>;
  created_at: string;
}

interface UserPreferences {
  id: string;
  user_id: string;
  preferences: Record<string, any>;
  updated_at: string;
}

interface LogActivityRequest {
  activityType: string;
  activityData: Record<string, any>;
}

interface LogActivityResponse {
  success: boolean;
}

interface GetUserActivitiesRequest {
  limit?: number;
  offset?: number;
  activityType?: string;
}

interface GetUserActivitiesResponse {
  activities: UserActivity[];
  total: number;
}

interface UpdateUserPreferencesRequest {
  preferences: Record<string, any>;
}

interface UpdateUserPreferencesResponse {
  success: boolean;
}

interface GetUserPreferencesResponse {
  preferences: Record<string, any>;
}

interface GetAnalyticsRequest {
  timeframe?: "day" | "week" | "month" | "year";
}

interface GetAnalyticsResponse {
  analytics: {
    totalActivities: number;
    activitiesByType: Record<string, number>;
    dailyActivity: Array<{
      date: string;
      count: number;
    }>;
    topFeatures: Array<{
      feature: string;
      usage: number;
    }>;
  };
}

// Logs user activity to Supabase for analytics.
export const logActivity = api<LogActivityRequest, LogActivityResponse>(
  { auth: true, expose: true, method: "POST", path: "/supabase/activity" },
  async (req) => {
    try {
      const auth = getAuthData()!;

      const { error } = await supabase.insert("user_activities", {
        user_id: auth.userID,
        activity_type: req.activityType,
        activity_data: req.activityData,
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Log activity error:", error);
      throw APIError.internal("Failed to log activity");
    }
  }
);

// Gets user activities from Supabase.
export const getUserActivities = api<GetUserActivitiesRequest, GetUserActivitiesResponse>(
  { auth: true, expose: true, method: "GET", path: "/supabase/activities" },
  async (req) => {
    try {
      const auth = getAuthData()!;
      const limit = req.limit || 50;
      const offset = req.offset || 0;

      let filters: Record<string, any> = { user_id: auth.userID };
      if (req.activityType) {
        filters.activity_type = req.activityType;
      }

      const { data: activities, error } = await supabase.select<UserActivity>(
        "user_activities",
        "*",
        filters
      );

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      // Get total count
      const { data: countData, error: countError } = await supabase.rpc<{ count: number }>(
        "count_user_activities",
        { user_id: auth.userID, activity_type: req.activityType }
      );

      const total = countData?.count || activities?.length || 0;

      return {
        activities: activities || [],
        total,
      };
    } catch (error) {
      console.error("Get user activities error:", error);
      throw APIError.internal("Failed to get user activities");
    }
  }
);

// Updates user preferences in Supabase.
export const updateUserPreferences = api<UpdateUserPreferencesRequest, UpdateUserPreferencesResponse>(
  { auth: true, expose: true, method: "PUT", path: "/supabase/preferences" },
  async (req) => {
    try {
      const auth = getAuthData()!;

      // First, try to get existing preferences
      const { data: existing } = await supabase.select<UserPreferences>(
        "user_preferences",
        "*",
        { user_id: auth.userID }
      );

      if (existing && existing.length > 0) {
        // Update existing preferences
        const { error } = await supabase.update(
          "user_preferences",
          {
            preferences: req.preferences,
            updated_at: new Date().toISOString(),
          },
          { user_id: auth.userID }
        );

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }
      } else {
        // Insert new preferences
        const { error } = await supabase.insert("user_preferences", {
          user_id: auth.userID,
          preferences: req.preferences,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Update user preferences error:", error);
      throw APIError.internal("Failed to update user preferences");
    }
  }
);

// Gets user preferences from Supabase.
export const getUserPreferences = api<void, GetUserPreferencesResponse>(
  { auth: true, expose: true, method: "GET", path: "/supabase/preferences" },
  async () => {
    try {
      const auth = getAuthData()!;

      const { data: preferences, error } = await supabase.select<UserPreferences>(
        "user_preferences",
        "*",
        { user_id: auth.userID }
      );

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return {
        preferences: preferences?.[0]?.preferences || {},
      };
    } catch (error) {
      console.error("Get user preferences error:", error);
      throw APIError.internal("Failed to get user preferences");
    }
  }
);

// Gets analytics data from Supabase.
export const getAnalytics = api<GetAnalyticsRequest, GetAnalyticsResponse>(
  { auth: true, expose: true, method: "GET", path: "/supabase/analytics" },
  async (req) => {
    try {
      const auth = getAuthData()!;
      const timeframe = req.timeframe || "month";

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case "day":
          startDate.setDate(now.getDate() - 1);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get activities within timeframe
      const { data: activities, error } = await supabase.select<UserActivity>(
        "user_activities",
        "*",
        { user_id: auth.userID }
      );

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      const filteredActivities = (activities || []).filter(
        activity => new Date(activity.created_at) >= startDate
      );

      // Process analytics
      const totalActivities = filteredActivities.length;
      
      const activitiesByType = filteredActivities.reduce((acc, activity) => {
        acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by day for daily activity chart
      const dailyActivity = filteredActivities.reduce((acc, activity) => {
        const date = new Date(activity.created_at).toISOString().split('T')[0];
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, [] as Array<{ date: string; count: number }>);

      // Top features by usage
      const topFeatures = Object.entries(activitiesByType)
        .map(([feature, usage]) => ({ feature, usage }))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 5);

      return {
        analytics: {
          totalActivities,
          activitiesByType,
          dailyActivity: dailyActivity.sort((a, b) => a.date.localeCompare(b.date)),
          topFeatures,
        },
      };
    } catch (error) {
      console.error("Get analytics error:", error);
      throw APIError.internal("Failed to get analytics");
    }
  }
);
