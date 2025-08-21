import React from "react";
import { Zap, Plus, Settings, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WorkflowAutomation from "../components/WorkflowAutomation";

export default function WorkflowsPage() {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Zap className="w-8 h-8 text-emerald-600" />
              Workflow Automation
              <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-950/50 dark:to-pink-950/50 dark:text-purple-300">
                Premium
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-2">
              Automate your meeting workflows with intelligent triggers and actions
            </p>
          </div>
        </div>

        {/* Workflow Automation Component */}
        <WorkflowAutomation />
      </div>
    </div>
  );
}
