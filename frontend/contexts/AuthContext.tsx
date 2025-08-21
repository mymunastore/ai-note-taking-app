import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import backend from "~backend/client";
import type { User, AuthResponse } from "~backend/auth/types";

interface AuthContextType {
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string, twoFactorCode?: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  socialSignIn: (provider: string, code: string, redirectUri: string) => Promise<AuthResponse>;
  phoneSignIn: (phone: string, code: string) => Promise<AuthResponse>;
  ssoSignIn: (domain: string, samlResponse?: string, oidcCode?: string) => Promise<AuthResponse>;
  getToken: () => Promise<string | null>;
  organization: any;
  membership: any;
  refreshToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session on app load
    const storedToken = localStorage.getItem("auth-token");
    const storedRefreshToken = localStorage.getItem("auth-refresh-token");
    const storedUser = localStorage.getItem("auth-user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        localStorage.removeItem("auth-token");
        localStorage.removeItem("auth-refresh-token");
        localStorage.removeItem("auth-user");
      }
    }
    setIsLoaded(true);
  }, []);

  const signIn = async (email: string, password: string, twoFactorCode?: string): Promise<AuthResponse> => {
    try {
      const response = await backend.auth.login({
        email,
        password,
        twoFactorCode,
      });

      setUser(response.user);
      setToken(response.token);
      setRefreshToken(response.refreshToken);

      // Store in localStorage
      localStorage.setItem("auth-token", response.token);
      localStorage.setItem("auth-refresh-token", response.refreshToken);
      localStorage.setItem("auth-user", JSON.stringify(response.user));

      return response;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string): Promise<AuthResponse> => {
    try {
      const response = await backend.auth.register({
        email,
        password,
        firstName,
        lastName,
      });

      setUser(response.user);
      setToken(response.token);
      setRefreshToken(response.refreshToken);

      // Store in localStorage
      localStorage.setItem("auth-token", response.token);
      localStorage.setItem("auth-refresh-token", response.refreshToken);
      localStorage.setItem("auth-user", JSON.stringify(response.user));

      return response;
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      if (refreshToken) {
        await backend.auth.logout({ refreshToken });
      }
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      localStorage.removeItem("auth-token");
      localStorage.removeItem("auth-refresh-token");
      localStorage.removeItem("auth-user");
    }
  };

  const socialSignIn = async (provider: string, code: string, redirectUri: string): Promise<AuthResponse> => {
    try {
      const response = await backend.auth.socialLogin({
        provider: provider as any,
        code,
        redirectUri,
      });

      setUser(response.user);
      setToken(response.token);
      setRefreshToken(response.refreshToken);

      // Store in localStorage
      localStorage.setItem("auth-token", response.token);
      localStorage.setItem("auth-refresh-token", response.refreshToken);
      localStorage.setItem("auth-user", JSON.stringify(response.user));

      return response;
    } catch (error) {
      console.error("Social sign in error:", error);
      throw error;
    }
  };

  const phoneSignIn = async (phone: string, code: string): Promise<AuthResponse> => {
    try {
      const response = await backend.auth.phoneLogin({
        phone,
        verificationCode: code,
      });

      setUser(response.user);
      setToken(response.token);
      setRefreshToken(response.refreshToken);

      // Store in localStorage
      localStorage.setItem("auth-token", response.token);
      localStorage.setItem("auth-refresh-token", response.refreshToken);
      localStorage.setItem("auth-user", JSON.stringify(response.user));

      return response;
    } catch (error) {
      console.error("Phone sign in error:", error);
      throw error;
    }
  };

  const ssoSignIn = async (domain: string, samlResponse?: string, oidcCode?: string): Promise<AuthResponse> => {
    try {
      const response = await backend.auth.ssoLogin({
        domain,
        samlResponse,
        oidcCode,
      });

      setUser(response.user);
      setToken(response.token);
      setRefreshToken(response.refreshToken);

      // Store in localStorage
      localStorage.setItem("auth-token", response.token);
      localStorage.setItem("auth-refresh-token", response.refreshToken);
      localStorage.setItem("auth-user", JSON.stringify(response.user));

      return response;
    } catch (error) {
      console.error("SSO sign in error:", error);
      throw error;
    }
  };

  const getToken = async (): Promise<string | null> => {
    return token;
  };

  const value: AuthContextType = {
    user,
    isLoaded,
    isSignedIn: !!user,
    signIn,
    signUp,
    signOut,
    socialSignIn,
    phoneSignIn,
    ssoSignIn,
    getToken,
    organization: null,
    membership: null,
    refreshToken,
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
  const { getToken } = useAuth();
  return backend.with({
    auth: async () => {
      const token = await getToken();
      return token ? { authorization: `Bearer ${token}` } : {};
    }
  });
}
