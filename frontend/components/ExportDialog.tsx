import React, { useState } from "react";
import { Download, FileText, FileSpreadsheet, FileCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

interface ExportDialogProps {
  selectedNotes?: number[];
  trigger?: React.ReactNode;
}

export default function ExportDialog({ selectedNotes = [], trigger }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<"json" | "csv" | "markdown">("json");
  const [includeTranscripts, setIncludeTranscripts] = useState(true);
  const [includeSummaries, setIncludeSummaries] = useState(true);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const response = await backend.notes.exportNotes({
        noteIds: selectedNotes.length > 0 ? selectedNotes : undefined,
        format,
        includeTranscripts,
        includeSummaries,
      });

      // Create and download file
      const blob = new Blob([response.data], { type: response.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Successfully exported ${selectedNotes.length > 0 ? selectedNotes.length : 'all'} notes as ${format.toUpperCase()}.`,
      });

      setIsOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (fmt: string) => {
    switch (fmt) {
      case "json": return <FileCode className="w-4 h-4" />;
      case "csv": return <FileSpreadsheet className="w-4 h-4" />;
      case "markdown": return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="hover:border-emerald-500">
            <Download className="w-4 h-4 mr-2" />
            Export Notes
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600" />
            Export Notes
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(value: "json" | "csv" | "markdown") => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    JSON - Structured data
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    CSV - Spreadsheet format
                  </div>
                </SelectItem>
                <SelectItem value="markdown">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Markdown - Readable format
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Include Content</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="transcripts" 
                  checked={includeTranscripts}
                  onCheckedChange={setIncludeTranscripts}
                />
                <Label htmlFor="transcripts" className="text-sm">
                  Include transcripts
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="summaries" 
                  checked={includeSummaries}
                  onCheckedChange={setIncludeSummaries}
                />
                <Label htmlFor="summaries" className="text-sm">
                  Include summaries
                </Label>
              </div>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {selectedNotes.length > 0 
                ? `Exporting ${selectedNotes.length} selected notes`
                : "Exporting all notes"
              } as {format.toUpperCase()} format.
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  {getFormatIcon(format)}
                  <span className="ml-2">Export</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
