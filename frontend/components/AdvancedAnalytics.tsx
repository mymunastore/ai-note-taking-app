import React from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Clock, Languages, Tag, Calendar, BarChart3, PieChart, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import backend from "~backend/client";

interface AnalyticsData {
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

export default function AdvancedAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => backend.notes.getAnalytics(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border bg-card">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-2 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const data = analytics as AnalyticsData;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Recordings</p>
                <p className="text-2xl font-bold text-foreground">{data?.totalRecordings || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Duration</p>
                <p className="text-2xl font-bold text-foreground">{formatDuration(data?.totalDuration || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Length</p>
                <p className="text-2xl font-bold text-foreground">{formatDuration(data?.averageDuration || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">{data?.recentActivity?.thisMonth || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {data?.recentActivity?.lastMonth ? 
                    `${data.recentActivity.thisMonth > data.recentActivity.lastMonth ? '+' : ''}${data.recentActivity.thisMonth - data.recentActivity.lastMonth} from last month` 
                    : 'No previous data'
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-950/50 dark:to-red-950/50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="languages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="languages" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-emerald-600" />
                Language Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.languageBreakdown?.map((lang, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">{lang.language}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{lang.count} recordings</span>
                        <Badge variant="secondary">{lang.percentage.toFixed(1)}%</Badge>
                      </div>
                    </div>
                    <Progress value={lang.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                Popular Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.tagsBreakdown?.slice(0, 10).map((tag, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                      {tag.tag}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{tag.count} uses</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Monthly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.monthlyActivity?.map((month, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">{month.month}</span>
                      <div className="text-right">
                        <div className="text-sm text-foreground">{month.recordings} recordings</div>
                        <div className="text-xs text-muted-foreground">{formatDuration(month.duration)}</div>
                      </div>
                    </div>
                    <Progress 
                      value={data.monthlyActivity ? (month.recordings / Math.max(...data.monthlyActivity.map(m => m.recordings))) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
