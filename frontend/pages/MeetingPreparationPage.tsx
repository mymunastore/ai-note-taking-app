import React from "react";
import { Brain, Calendar, Users, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MeetingPreparation from "../components/MeetingPreparation";

export default function MeetingPreparationPage() {
  const handlePreparationComplete = (data: any) => {
    console.log("Meeting preparation complete:", data);
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Brain className="w-8 h-8 text-emerald-600" />
            Meeting Preparation Assistant
            <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300">
              AI-Powered
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Let AI analyze your meeting history to suggest agendas, prepare briefings, and recommend discussion points
          </p>
        </div>

        {/* Feature Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <Calendar className="w-8 h-8 text-emerald-600 mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Smart Agenda Generation</h3>
            <p className="text-sm text-muted-foreground">
              AI analyzes previous meetings with the same participants to suggest relevant agenda items and time allocations.
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Users className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Participant Insights</h3>
            <p className="text-sm text-muted-foreground">
              Get context on each participant's communication style, expertise, and recent contributions to discussions.
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <Target className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Discussion Points</h3>
            <p className="text-sm text-muted-foreground">
              Receive AI-generated questions and talking points based on previous meeting outcomes and unresolved topics.
            </p>
          </div>
        </div>

        {/* Meeting Preparation Component */}
        <MeetingPreparation onPreparationComplete={handlePreparationComplete} />
      </div>
    </div>
  );
}
