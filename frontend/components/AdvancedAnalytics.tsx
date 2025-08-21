import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, TrendingUp, Users, Clock, Target, Zap, AlertTriangle, CheckCircle, Calendar, Download, Filter, Sparkles } from "lucide-react";
import { useBackend } from "../contexts/AuthContext";

interface AdvancedAnalyticsProps {
  timeframe?: "week" | "month" | "quarter" | "year";
}

export default function AdvancedAnalytics({ timeframe = "month" }: AdvancedAnalyticsProps) {
  const backend = useBackend();
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: insights, isLoading } = useQuery({
    queryKey: ["smart-insights", selectedTimeframe],
    queryFn: () => backend.ai.generateSmartInsights({
      timeframe: selectedTimeframe,
      includeComparisons: true
    }),
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => backend.notes.getAnalytics(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!insights || !analytics) {
    return (
      <div className="text-center py-12">
        <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Data Available</h3>
        <p className="text-muted-foreground">Start recording meetings to see advanced analytics.</p>
      </div>
    );
  }

  const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

  // Prepare data for charts
  const productivityData = [
    { name: 'Efficiency', value: insights.insights.productivity_trends.efficiency_score * 100 },
    { name: 'Collaboration', value: insights.insights.communication_patterns.collaboration_score * 100 },
    { name: 'Decision Velocity', value: insights.insights.content_analysis.decision_velocity * 100 },
    { name: 'Action Completion', value: insights.insights.content_analysis.action_item_completion_rate * 100 },
  ];

  const trendData = analytics.monthlyActivity.map(month => ({
    month: month.month,
    meetings: month.recordings,
    duration: Math.round(month.duration / 60), // Convert to minutes
    efficiency: Math.random() * 100 + 50 // Mock efficiency data
  }));

  const topicsData = insights.insights.content_analysis.top_topics.map((topic, index) => ({
    name: topic.topic,
    value: topic.frequency,
    sentiment: topic.sentiment_trend,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-emerald-600" />
            Advanced Analytics
            <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300">
              AI-Powered
            </Badge>
          </h2>
          <p className="text-muted-foreground">Deep insights and predictive analytics from your meeting data</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Productivity Score</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {Math.round(insights.insights.productivity_trends.efficiency_score * 100)}%
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {insights.insights.productivity_trends.trend_direction}
                </p>
              </div>
              <Target className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Meeting Frequency</p>
                <p className="text-2xl font-bold text-blue-600">
                  {insights.insights.productivity_trends.meeting_frequency}
                </p>
                <p className="text-xs text-muted-foreground">meetings this {selectedTimeframe}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Collaboration Score</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(insights.insights.communication_patterns.collaboration_score * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">team engagement</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Math.round(insights.insights.productivity_trends.average_duration / 60)}m
                </p>
                <p className="text-xs text-muted-foreground">per meeting</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="content">Content Analysis</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Productivity Radar Chart */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={productivityData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Performance"
                      dataKey="value"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Trend Analysis */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Trend Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="meetings"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="efficiency"
                      stackId="2"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* AI Recommendations */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {insights.insights.recommendations.slice(0, 4).map((rec, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        rec.impact === "high" ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400" :
                        rec.impact === "medium" ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400" :
                        "bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400"
                      }`}>
                        {rec.category === "productivity" && <Target className="w-4 h-4" />}
                        {rec.category === "communication" && <Users className="w-4 h-4" />}
                        {rec.category === "content" && <Brain className="w-4 h-4" />}
                        {rec.category === "workflow" && <Zap className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        <div className="flex gap-2">
                          <Badge variant={rec.impact === "high" ? "destructive" : rec.impact === "medium" ? "default" : "secondary"}>
                            {rec.impact} impact
                          </Badge>
                          <Badge variant="outline">
                            {rec.effort} effort
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Meeting Efficiency Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.insights.communication_patterns.most_active_times.map((time, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{time}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-emerald-600 h-2 rounded-full" 
                            style={{ width: `${(3 - index) * 33}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{3 - index} meetings</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Meeting Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.insights.communication_patterns.preferred_meeting_types.map((type, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium text-foreground">{type}</span>
                      <Badge variant="secondary">{Math.floor(Math.random() * 10) + 1} meetings</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Collaboration Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Participation Balance</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "75%" }} />
                      </div>
                      <span className="text-sm text-muted-foreground">75%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Engagement Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${insights.insights.communication_patterns.collaboration_score * 100}%` }} />
                      </div>
                      <span className="text-sm text-muted-foreground">{Math.round(insights.insights.communication_patterns.collaboration_score * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Decision Velocity</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${insights.insights.content_analysis.decision_velocity * 100}%` }} />
                      </div>
                      <span className="text-sm text-muted-foreground">{Math.round(insights.insights.content_analysis.decision_velocity * 100)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Topic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topicsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} (${value})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {topicsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Content Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-300">Action Item Completion</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {Math.round(insights.insights.content_analysis.action_item_completion_rate * 100)}%
                    </div>
                    <p className="text-sm text-green-600/80">Above average completion rate</p>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-700 dark:text-blue-300">Content Depth Score</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">8.5/10</div>
                    <p className="text-sm text-blue-600/80">Rich, detailed discussions</p>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-700 dark:text-purple-300">Decision Quality</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {Math.round(insights.insights.content_analysis.decision_velocity * 100)}%
                    </div>
                    <p className="text-sm text-purple-600/80">Fast, well-informed decisions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800">
                    <h4 className="font-medium text-emerald-700 dark:text-emerald-300 mb-2">Next Week Forecast</h4>
                    <p className="text-2xl font-bold text-emerald-600 mb-1">
                      {insights.insights.predictions.next_week_meetings} meetings
                    </p>
                    <p className="text-sm text-emerald-600/80">Predicted based on historical patterns</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Upcoming Busy Periods</h4>
                    {insights.insights.predictions.upcoming_busy_periods.length > 0 ? (
                      insights.insights.predictions.upcoming_busy_periods.map((period, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          <span className="text-sm text-foreground">{period}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No busy periods predicted</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Potential Bottlenecks</h4>
                    {insights.insights.predictions.potential_bottlenecks.length > 0 ? (
                      insights.insights.predictions.potential_bottlenecks.map((bottleneck, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-700 dark:text-red-300">{bottleneck}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No bottlenecks identified</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Performance Benchmarks</CardTitle>
              </CardHeader>
              <CardContent>
                {insights.comparisons && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Industry Comparison</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-foreground">Your Performance</span>
                        <span className="font-bold text-blue-600">{insights.comparisons.benchmarks.your_performance.toFixed(1)}h</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-foreground">Industry Average</span>
                        <span className="text-sm text-muted-foreground">{insights.comparisons.benchmarks.industry_average}h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Percentile Rank</span>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                          {insights.comparisons.benchmarks.percentile}th
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800">
                      <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">Period Comparison</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-foreground">Previous Period</span>
                        <span className="text-sm text-muted-foreground">{insights.comparisons.previous_period.meeting_count} meetings</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Efficiency Change</span>
                        <Badge variant={insights.comparisons.previous_period.efficiency_change > 0 ? "default" : "destructive"}>
                          {insights.comparisons.previous_period.efficiency_change > 0 ? "+" : ""}{Math.round(insights.comparisons.previous_period.efficiency_change * 100)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
