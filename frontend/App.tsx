import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { NotesProvider } from "./contexts/NotesContext";
import { RecordingProvider } from "./contexts/RecordingContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { clerkPublishableKey } from "./config";
import Layout from "./components/Layout";
import ChatBot from "./components/ChatBot";

const LandingPage = React.lazy(() => import("./pages/LandingPage"));
const NotesListPage = React.lazy(() => import("./pages/NotesListPage"));
const NoteDetailPage = React.lazy(() => import("./pages/NoteDetailPage"));
const RecordingPage = React.lazy(() => import("./pages/RecordingPage"));
const LiveTranscriptionPage = React.lazy(() => import("./pages/LiveTranscriptionPage"));
const BillingPage = React.lazy(() => import("./pages/BillingPage"));
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={
          <Layout>
            <NotesListPage />
            <ChatBot />
          </Layout>
        } />
        <Route path="/note/:id" element={
          <Layout>
            <NoteDetailPage />
          </Layout>
        } />
        <Route path="/record" element={
          <Layout>
            <RecordingPage />
          </Layout>
        } />
        <Route path="/live" element={
          <Layout>
            <LiveTranscriptionPage />
          </Layout>
        } />
        <Route path="/billing" element={
          <Layout>
            <BillingPage />
          </Layout>
        } />
        <Route path="/settings" element={
          <Layout>
            <SettingsPage />
          </Layout>
        } />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
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
    </ClerkProvider>
  );
}
