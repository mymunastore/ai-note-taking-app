import React, { createContext, useContext, ReactNode } from "react";
import { useUser, useAuth as useClerkAuth, useOrganization } from "@clerk/clerk-react";
import backend from "~backend/client";

interface AuthContextType {
  user: any;
  isLoaded: boolean;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  organization: any;
  membership: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, isLoaded } = useUser();
  const { isSignedIn, signOut, getToken } = useClerkAuth();
  const { organization, membership } = useOrganization();

  const value: AuthContextType = {
    user,
    isLoaded,
    isSignedIn: isSignedIn || false,
    signOut,
    getToken,
    organization,
    membership,
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

// Returns the backend client with authentication.
export function useBackend() {
  const { getToken, isSignedIn } = useAuth();
  
  if (!isSignedIn) return backend;
  
  return backend.with({
    auth: async () => {
      const token = await getToken();
      return token ? { authorization: `Bearer ${token}` } : {};
    }
  });
}
