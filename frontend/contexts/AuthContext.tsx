import React, { createContext, useContext, ReactNode } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { isDemoMode } from "../config";
import backend from "~backend/client";

interface AuthContextType {
  user: any;
  isLoaded: boolean;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  organization: any;
  membership: any;
  isPremium: boolean;
  features: {
    realTimeTranscription: boolean;
    enhancedAnalytics: boolean;
    cloudSync: boolean;
    advancedWorkflows: boolean;
    prioritySupport: boolean;
    unlimitedRecordings: boolean;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Use Clerk hooks only if not in demo mode
  const clerkUser = isDemoMode ? { user: null, isLoaded: true } : useUser();
  const clerkAuth = isDemoMode ? { isSignedIn: false, signOut: async () => {}, getToken: async () => null } : useClerkAuth();

  // Demo mode user
  const demoUser = isDemoMode ? {
    id: "demo-user",
    firstName: "Demo",
    lastName: "User",
    email: "demo@scribeai.com",
    imageUrl: "",
    publicMetadata: { plan: "free" },
    organizationMemberships: []
  } : null;

  const user = isDemoMode ? demoUser : clerkUser?.user;
  const isLoaded = isDemoMode ? true : clerkUser?.isLoaded || false;
  const isSignedIn = isDemoMode ? true : clerkAuth?.isSignedIn || false;

  // Determine if user has premium features
  const userPlan = user?.publicMetadata?.plan as string;
  const orgPlan = user?.organizationMemberships?.[0]?.organization?.publicMetadata?.plan as string;
  const plan = orgPlan || userPlan || "free";
  const isPremium = plan === "pro" || plan === "enterprise";

  const signOut = async () => {
    if (isDemoMode) {
      // In demo mode, just reload the page
      window.location.reload();
    } else {
      await clerkAuth?.signOut();
    }
  };

  const getToken = async () => {
    if (isDemoMode) {
      return null;
    }
    return clerkAuth?.getToken() || null;
  };

  const value: AuthContextType = {
    user,
    isLoaded,
    isSignedIn,
    signOut,
    getToken,
    organization: user?.organizationMemberships?.[0]?.organization,
    membership: user?.organizationMemberships?.[0],
    isPremium,
    features: {
      realTimeTranscription: isPremium,
      enhancedAnalytics: isPremium,
      cloudSync: true,
      advancedWorkflows: plan === "enterprise",
      prioritySupport: isPremium,
      unlimitedRecordings: isPremium,
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Enhanced backend client with authentication
export function useBackend() {
  const { getToken, isSignedIn } = useAuth();
  
  if (!isSignedIn || isDemoMode) {
    return backend;
  }
  
  return backend.with({
    auth: async () => {
      const token = await getToken();
      return token ? { authorization: `Bearer ${token}` } : {};
    }
  });
}
