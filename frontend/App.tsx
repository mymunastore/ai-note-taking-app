import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { NotesProvider } from "./contexts/NotesContext";
import { RecordingProvider } from "./contexts/RecordingContext";
import { PaymentProvider } from "./contexts/PaymentContext";
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
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import { clerkPublishableKey } from "./config";

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

  return (
    <>
      <SignedOut>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </SignedOut>
      
      <SignedIn>
        {!hasCompletedOnboarding ? (
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="*" element={<OnboardingPage />} />
          </Routes>
        ) : (
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
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/payment/cancel" element={<PaymentCancelPage />} />
            </Routes>
            <ChatBot />
          </Layout>
        )}
      </SignedIn>
    </>
  );
}

export default function App() {
  if (!clerkPublishableKey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Configuration Required</h1>
          <p className="text-muted-foreground">
            Please set your Clerk publishable key in the environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <PaymentProvider>
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
            </PaymentProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
