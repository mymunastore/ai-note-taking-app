import React from "react";
import { FileText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SmartTemplates from "../components/SmartTemplates";

export default function TemplatesPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-8 h-8 text-emerald-600" />
            Smart Templates
            <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300">
              AI-Powered
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate professional templates from your meeting content using AI
          </p>
        </div>

        {/* Smart Templates Component */}
        <SmartTemplates />
      </div>
    </div>
  );
}
