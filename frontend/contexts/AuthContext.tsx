import React, { createContext, useContext, ReactNode } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
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
  const { user, isLoaded } = useUser();
  const { isSignedIn, signOut: clerkSignOut, getToken } = useClerkAuth();

  // Determine if user has premium features
  const userPlan = user?.publicMetadata?.plan as string;
  const orgPlan = user?.organizationMemberships?.[0]?.organization?.publicMetadata?.plan as string;
  const plan = orgPlan || userPlan || "free";
  const isPremium = plan === "pro" || plan === "enterprise";

  const value: AuthContextType = {
    user,
    isLoaded,
    isSignedIn: isSignedIn || false,
    signOut: clerkSignOut,
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
  
  if (!isSignedIn) {
    return backend;
  }
  
  return backend.with({
    auth: async () => {
      const token = await getToken();
      return token ? { authorization: `Bearer ${token}` } : {};
    }
  });
}
