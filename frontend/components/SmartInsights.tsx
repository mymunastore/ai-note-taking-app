import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, TrendingUp, Clock, Users, Target, Lightbulb, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import backend from "~backend/client";

interface SmartInsightsData {
  insights: {
    productivity_trends: {
      meeting_frequency: number;
      average_duration: number;
      efficiency_score: number;
      trend_direction: "increasing" | "decreasing" | "stable";
    };
    communication_patterns: {
      most_active_times: string[];
      preferred_meeting_types: string[];
      collaboration_score: number;
    };
    content_analysis: {
      top_topics: Array<{
        topic: string;
        frequency: number;
        sentiment_trend: "positive" | "negative" | "neutral";
      }>;
      action_item_completion_rate: number;
      decision_velocity: number;
    };
    recommendations: Array<{
      category: "productivity" | "communication" | "content" | "workflow";
      title: string;
      description: string;
      impact: "high" | "medium" | "low";
      effort: "low" | "medium" | "high";
    }>;
    predictions: {
      next_week_meetings: number;
      upcoming_busy_periods: string[];
      potential_bottlenecks: string[];
    };
  };
}

export default function SmartInsights() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ["smart-insights"],
    queryFn: () => backend.ai.generateSmartInsights({ timeframe: "month" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = insights as SmartInsightsData;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "text-red-600 bg-red-100 dark:bg-red-950/50 dark:text-red-300";
      case "medium": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-950/50 dark:text-yellow-300";
      case "low": return "text-green-600 bg-green-100 dark:bg-green-950/50 dark:text-green-300";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-950/50 dark:text-gray-300";
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "high": return "text-red-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Productivity Overview */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-600" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="text-2xl font-bold text-emerald-600 mb-1">
                {Math.round((data?.insights?.productivity_trends?.efficiency_score || 0) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Efficiency Score</div>
              <div className="flex items-center justify-center mt-2">
                <TrendingUp className={`w-4 h-4 mr-1 ${
                  data?.insights?.productivity_trends?.trend_direction === "increasing" ? "text-green-600" :
                  data?.insights?.productivity_trends?.trend_direction === "decreasing" ? "text-red-600" :
                  "text-gray-600"
                }`} />
                <span className="text-xs capitalize">{data?.insights?.productivity_trends?.trend_direction}</span>
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {Math.round((data?.insights?.communication_patterns?.collaboration_score || 0) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Collaboration Score</div>
              <div className="flex items-center justify-center mt-2">
                <Users className="w-4 h-4 mr-1 text-blue-600" />
                <span className="text-xs">Team Synergy</span>
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {Math.round((data?.insights?.content_analysis?.decision_velocity || 0) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Decision Velocity</div>
              <div className="flex items-center justify-center mt-2">
                <Target className="w-4 h-4 mr-1 text-purple-600" />
                <span className="text-xs">Action Rate</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication Patterns */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Communication Patterns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-3">Most Active Times</h4>
              <div className="space-y-2">
                {data?.insights?.communication_patterns?.most_active_times?.map((time, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{time}</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                      Peak
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-3">Preferred Meeting Types</h4>
              <div className="space-y-2">
                {data?.insights?.communication_patterns?.preferred_meeting_types?.map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{type}</span>
                    <Badge variant="outline" className="border-teal-200 text-teal-700 dark:border-teal-800 dark:text-teal-300">
                      Frequent
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Topics */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Content Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-3">Top Discussion Topics</h4>
              <div className="space-y-3">
                {data?.insights?.content_analysis?.top_topics?.map((topic, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">{topic.topic}</span>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={
                            topic.sentiment_trend === "positive" ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300" :
                            topic.sentiment_trend === "negative" ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300" :
                            "bg-gray-100 text-gray-800 dark:bg-gray-950/50 dark:text-gray-300"
                          }
                        >
                          {topic.sentiment_trend}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{topic.frequency} mentions</span>
                      </div>
                    </div>
                    <Progress value={(topic.frequency / 10) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {Math.round((data?.insights?.content_analysis?.action_item_completion_rate || 0) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Action Item Completion</div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {data?.insights?.predictions?.next_week_meetings || 0}
                </div>
                <div className="text-sm text-muted-foreground">Predicted Next Week</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-emerald-600" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.insights?.recommendations?.map((rec, index) => (
              <Alert key={index} className="border-border">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {rec.category === "productivity" && <TrendingUp className="w-4 h-4 text-emerald-600" />}
                    {rec.category === "communication" && <Users className="w-4 h-4 text-blue-600" />}
                    {rec.category === "content" && <Target className="w-4 h-4 text-purple-600" />}
                    {rec.category === "workflow" && <CheckCircle className="w-4 h-4 text-orange-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-foreground">{rec.title}</h4>
                      <Badge className={getImpactColor(rec.impact)}>
                        {rec.impact} impact
                      </Badge>
                      <span className={`text-xs ${getEffortColor(rec.effort)}`}>
                        {rec.effort} effort
                      </span>
                    </div>
                    <AlertDescription className="text-muted-foreground">
                      {rec.description}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictions & Alerts */}
      {(data?.insights?.predictions?.upcoming_busy_periods?.length > 0 || 
        data?.insights?.predictions?.potential_bottlenecks?.length > 0) && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Predictions & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.insights?.predictions?.upcoming_busy_periods?.length > 0 && (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <strong>Upcoming Busy Periods:</strong> {data.insights.predictions.upcoming_busy_periods.join(", ")}
                </AlertDescription>
              </Alert>
            )}

            {data?.insights?.predictions?.potential_bottlenecks?.length > 0 && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <strong>Potential Bottlenecks:</strong> {data.insights.predictions.potential_bottlenecks.join(", ")}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
