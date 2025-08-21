import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { NotesProvider } from "./contexts/NotesContext";
import { RecordingProvider } from "./contexts/RecordingContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import ChatBot from "./components/ChatBot";
import NotesListPage from "./pages/NotesListPage";
import NoteDetailPage from "./pages/NoteDetailPage";
import RecordingPage from "./pages/RecordingPage";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NotesProvider>
          <RecordingProvider>
            <Router>
              <div className="min-h-screen bg-background transition-colors duration-300">
                <Layout>
                  <Routes>
                    <Route path="/" element={<NotesListPage />} />
                    <Route path="/note/:id" element={<NoteDetailPage />} />
                    <Route path="/record" element={<RecordingPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </Layout>
                <ChatBot />
                <Toaster />
              </div>
            </Router>
          </RecordingProvider>
        </NotesProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
