import { api, APIError } from "encore.dev/api";
import { notesDB } from "./db";

interface ExportNotesRequest {
  noteIds?: number[];
  format: "json" | "csv" | "markdown";
  includeTranscripts?: boolean;
  includeSummaries?: boolean;
}

interface ExportNotesResponse {
  data: string;
  filename: string;
  mimeType: string;
}

// Exports notes in various formats.
export const exportNotes = api<ExportNotesRequest, ExportNotesResponse>(
  { expose: true, method: "POST", path: "/notes/export" },
  async (req) => {
    try {
      let whereClause = "WHERE 1=1";
      let queryParams: any[] = [];

      if (req.noteIds && req.noteIds.length > 0) {
        whereClause += " AND id = ANY($1)";
        queryParams.push(req.noteIds);
      }

      const notes = await notesDB.rawQueryAll<{
        id: number;
        title: string;
        transcript: string;
        summary: string;
        duration: number;
        original_language: string | null;
        translated: boolean | null;
        tags: string[];
        created_at: Date;
        updated_at: Date;
      }>(
        `SELECT id, title, transcript, summary, duration, original_language, translated, tags, created_at, updated_at
         FROM notes ${whereClause}
         ORDER BY created_at DESC`,
        ...queryParams
      );

      if (notes.length === 0) {
        throw APIError.notFound("No notes found to export");
      }

      const timestamp = new Date().toISOString().split('T')[0];
      let data: string;
      let filename: string;
      let mimeType: string;

      switch (req.format) {
        case "json":
          data = JSON.stringify(notes.map(note => ({
            id: note.id,
            title: note.title,
            ...(req.includeTranscripts !== false && { transcript: note.transcript }),
            ...(req.includeSummaries !== false && { summary: note.summary }),
            duration: note.duration,
            originalLanguage: note.original_language,
            translated: note.translated,
            tags: note.tags,
            createdAt: note.created_at,
            updatedAt: note.updated_at,
          })), null, 2);
          filename = `scribe-ai-notes-${timestamp}.json`;
          mimeType = "application/json";
          break;

        case "csv":
          const headers = [
            "ID", "Title", "Duration", "Original Language", "Translated", "Tags", "Created At"
          ];
          if (req.includeSummaries !== false) headers.splice(3, 0, "Summary");
          if (req.includeTranscripts !== false) headers.splice(req.includeSummaries !== false ? 4 : 3, 0, "Transcript");

          const csvRows = [headers.join(",")];
          
          notes.forEach(note => {
            const row = [
              note.id.toString(),
              `"${note.title.replace(/"/g, '""')}"`,
              note.duration.toString(),
              note.original_language || "en",
              note.translated ? "Yes" : "No",
              `"${note.tags.join(", ")}"`,
              note.created_at.toISOString(),
            ];

            if (req.includeSummaries !== false) {
              row.splice(3, 0, `"${note.summary.replace(/"/g, '""')}"`);
            }
            if (req.includeTranscripts !== false) {
              row.splice(req.includeSummaries !== false ? 4 : 3, 0, `"${note.transcript.replace(/"/g, '""')}"`);
            }

            csvRows.push(row.join(","));
          });

          data = csvRows.join("\n");
          filename = `scribe-ai-notes-${timestamp}.csv`;
          mimeType = "text/csv";
          break;

        case "markdown":
          const mdSections = notes.map(note => {
            let section = `# ${note.title}\n\n`;
            section += `**Created:** ${note.created_at.toLocaleDateString()}\n`;
            section += `**Duration:** ${Math.floor(note.duration / 60)}:${(note.duration % 60).toString().padStart(2, '0')}\n`;
            if (note.original_language && note.original_language !== "en") {
              section += `**Language:** ${note.original_language} ${note.translated ? "(Translated to English)" : ""}\n`;
            }
            if (note.tags.length > 0) {
              section += `**Tags:** ${note.tags.join(", ")}\n`;
            }
            section += "\n";

            if (req.includeSummaries !== false) {
              section += `## Summary\n\n${note.summary}\n\n`;
            }

            if (req.includeTranscripts !== false) {
              section += `## Transcript\n\n${note.transcript}\n\n`;
            }

            section += "---\n\n";
            return section;
          });

          data = `# SCRIBE AI Notes Export\n\nExported on ${new Date().toLocaleDateString()}\n\n${mdSections.join("")}`;
          filename = `scribe-ai-notes-${timestamp}.md`;
          mimeType = "text/markdown";
          break;

        default:
          throw APIError.invalidArgument("Invalid export format");
      }

      return { data, filename, mimeType };

    } catch (error) {
      console.error("Export error:", error);
      throw APIError.internal("Failed to export notes");
    }
  }
);
