import React, { createContext, useContext, ReactNode } from "react";
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
  // Mock user data for demo purposes
  const mockUser = {
    id: "user_123",
    firstName: "Demo",
    lastName: "User",
    imageUrl: "",
    emailAddresses: [{ emailAddress: "demo@example.com" }]
  };

  const value: AuthContextType = {
    user: mockUser,
    isLoaded: true,
    isSignedIn: true,
    signOut: async () => {
      // Mock sign out
      console.log("Signing out...");
    },
    getToken: async () => null,
    organization: null,
    membership: null,
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

// Returns the backend client without authentication for demo.
export function useBackend() {
  return backend;
}
