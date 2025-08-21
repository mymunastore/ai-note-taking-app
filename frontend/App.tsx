import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { NotesProvider } from "./contexts/NotesContext";
import { RecordingProvider } from "./contexts/RecordingContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import ChatBot from "./components/ChatBot";

const HomePage = React.lazy(() => import("./pages/HomePage"));
const NotesListPage = React.lazy(() => import("./pages/NotesListPage"));
const NoteDetailPage = React.lazy(() => import("./pages/NoteDetailPage"));
const RecordingPage = React.lazy(() => import("./pages/RecordingPage"));
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
});

function AppContent() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-1/4"></div>
                <div className="h-10 bg-muted rounded"></div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<NotesListPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/note/:id" element={<NoteDetailPage />} />
          <Route path="/record" element={<RecordingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
      <ChatBot />
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotesProvider>
            <RecordingProvider>
              <Router>
                <div className="min-h-screen bg-background transition-colors duration-300">
                  <AppContent />
                  <Toaster />
                </div>
              </Router>
            </RecordingProvider>
          </NotesProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
