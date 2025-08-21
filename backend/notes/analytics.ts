import { api } from "encore.dev/api";
import { notesDB } from "./db";

interface AnalyticsResponse {
  totalRecordings: number;
  totalDuration: number;
  averageDuration: number;
  languageBreakdown: Array<{
    language: string;
    count: number;
    percentage: number;
  }>;
  tagsBreakdown: Array<{
    tag: string;
    count: number;
  }>;
  monthlyActivity: Array<{
    month: string;
    recordings: number;
    duration: number;
  }>;
  recentActivity: {
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
}

// Provides analytics and insights about user's recordings.
export const getAnalytics = api<void, AnalyticsResponse>(
  { expose: true, method: "GET", path: "/notes/analytics" },
  async () => {
    try {
      // Get basic statistics
      const basicStats = await notesDB.queryRow<{
        total_recordings: number;
        total_duration: number;
        average_duration: number;
      }>`
        SELECT 
          COUNT(*) as total_recordings,
          SUM(duration) as total_duration,
          AVG(duration) as average_duration
        FROM notes
      `;

      // Get language breakdown
      const languageStats = await notesDB.queryAll<{
        language: string;
        count: number;
      }>`
        SELECT 
          COALESCE(original_language, 'en') as language,
          COUNT(*) as count
        FROM notes
        GROUP BY COALESCE(original_language, 'en')
        ORDER BY count DESC
      `;

      // Calculate language percentages
      const totalRecordings = basicStats?.total_recordings || 0;
      const languageBreakdown = languageStats.map(stat => ({
        language: stat.language,
        count: stat.count,
        percentage: totalRecordings > 0 ? (stat.count / totalRecordings) * 100 : 0
      }));

      // Get tags breakdown (fix: proper unnest and group by)
      const tagsStats = await notesDB.rawQueryAll<{
        tag: string;
        count: number;
      }>(
        `
        SELECT tag, COUNT(*) as count
        FROM notes, unnest(tags) AS tag
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 10
        `
      );

      // Get monthly activity for the last 6 months
      const monthlyStats = await notesDB.queryAll<{
        month: string;
        recordings: number;
        duration: number;
      }>`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(*) as recordings,
          SUM(duration) as duration
        FROM notes
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month DESC
      `;

      // Get recent activity
      const recentStats = await notesDB.queryRow<{
        this_week: number;
        this_month: number;
        last_month: number;
      }>`
        SELECT 
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as this_week,
          COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) as this_month,
          COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month' 
                          AND created_at < DATE_TRUNC('month', NOW())) as last_month
        FROM notes
      `;

      return {
        totalRecordings: basicStats?.total_recordings || 0,
        totalDuration: basicStats?.total_duration || 0,
        averageDuration: Math.round(basicStats?.average_duration || 0),
        languageBreakdown,
        tagsBreakdown: tagsStats,
        monthlyActivity: monthlyStats,
        recentActivity: {
          thisWeek: recentStats?.this_week || 0,
          thisMonth: recentStats?.this_month || 0,
          lastMonth: recentStats?.last_month || 0,
        }
      };

    } catch (error) {
      console.error("Analytics error:", error);
      return {
        totalRecordings: 0,
        totalDuration: 0,
        averageDuration: 0,
        languageBreakdown: [],
        tagsBreakdown: [],
        monthlyActivity: [],
        recentActivity: {
          thisWeek: 0,
          thisMonth: 0,
          lastMonth: 0,
        }
      };
    }
  }
);
