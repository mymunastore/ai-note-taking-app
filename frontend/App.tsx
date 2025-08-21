import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { NotesProvider } from "./contexts/NotesContext";
import { RecordingProvider } from "./contexts/RecordingContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import ChatBot from "./components/ChatBot";
import HomePage from "./pages/HomePage";
import OnboardingPage from "./pages/OnboardingPage";
import NotesListPage from "./pages/NotesListPage";
import NoteDetailPage from "./pages/NoteDetailPage";
import RecordingPage from "./pages/RecordingPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import PricingPage from "./pages/PricingPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const hasAcceptedDisclaimer = localStorage.getItem("scribe-disclaimer-accepted");
  const hasCompletedOnboarding = localStorage.getItem("scribe-onboarding-completed");

  // Show homepage if disclaimer not accepted
  if (!hasAcceptedDisclaimer) {
    return <HomePage />;
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<OnboardingPage />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<NotesListPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/note/:id" element={<NoteDetailPage />} />
        <Route path="/record" element={<RecordingPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
      </Routes>
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
