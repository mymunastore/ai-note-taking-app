import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, TrendingUp, Calendar, Download, Filter, Sparkles, BarChart3, PieChart, LineChart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AdvancedAnalytics from "../components/AdvancedAnalytics";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import { useBackend } from "../contexts/AuthContext";

export default function AdvancedAnalyticsPage() {
  const backend = useBackend();
  const [timeframe, setTimeframe] = useState<"week" | "month" | "quarter" | "year">("month");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => backend.notes.getAnalytics(),
  });

  const { data: insights } = useQuery({
    queryKey: ["smart-insights", timeframe],
    queryFn: () => backend.ai.generateSmartInsights({
      timeframe,
      includeComparisons: true
    }),
  });

  const exportAnalytics = async (format: "pdf" | "csv" | "json") => {
    try {
      // Implementation for exporting analytics data
      console.log(`Exporting analytics as ${format}`);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Brain className="w-8 h-8 text-emerald-600" />
              Advanced Analytics
              <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300">
                AI-Powered
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-2">
              Deep insights, predictive analytics, and performance metrics for your voice data
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => exportAnalytics("pdf")}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedAnalytics timeframe={timeframe} />
          </TabsContent>

          <TabsContent value="trends">
            <div className="grid gap-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Usage Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <LineChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Detailed trend analysis coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid gap-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Performance analytics coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
