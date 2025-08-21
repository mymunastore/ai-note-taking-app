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
  // Enhanced mock user data with premium features
  const mockUser = {
    id: "user_premium_123",
    firstName: "Premium",
    lastName: "User",
    imageUrl: "",
    emailAddresses: [{ emailAddress: "premium@scribeai.com" }],
    plan: "premium",
    subscription: {
      status: "active",
      plan: "premium",
      features: [
        "real_time_transcription",
        "enhanced_analytics", 
        "cloud_sync",
        "advanced_workflows",
        "priority_support",
        "unlimited_recordings"
      ]
    }
  };

  const mockOrganization = {
    id: "org_premium_456",
    name: "Premium Organization",
    plan: "enterprise",
    features: ["team_collaboration", "advanced_security", "custom_integrations"]
  };

  const value: AuthContextType = {
    user: mockUser,
    isLoaded: true,
    isSignedIn: true,
    signOut: async () => {
      console.log("Signing out...");
    },
    getToken: async () => "premium_token_123",
    organization: mockOrganization,
    membership: {
      role: "admin",
      permissions: ["read", "write", "admin"]
    },
    isPremium: true,
    features: {
      realTimeTranscription: true,
      enhancedAnalytics: true,
      cloudSync: true,
      advancedWorkflows: true,
      prioritySupport: true,
      unlimitedRecordings: true,
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

// Enhanced backend client with premium features and retry logic
export function useBackend() {
  const { getToken } = useAuth();
  
  // Create enhanced backend client with automatic retry and error handling
  const enhancedBackend = {
    ...backend,
    
    // Enhanced AI methods with retry logic
    ai: {
      ...backend.ai,
      
      transcribe: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.ai.transcribe(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
      
      summarize: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.ai.summarize(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
      
      chat: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.ai.chat(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
          }
        }
      },
      
      advancedAnalysis: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.ai.advancedAnalysis(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
      
      generateSmartInsights: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.ai.generateSmartInsights(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
      
      createWorkflow: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.ai.createWorkflow(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
      
      listWorkflows: async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.ai.listWorkflows();
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
      
      generateSmartTemplate: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.ai.generateSmartTemplate(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
    },
    
    // Enhanced notes methods with retry logic
    notes: {
      ...backend.notes,
      
      create: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.notes.create(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
      
      list: async (params: any = {}, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.notes.list(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
          }
        }
      },
      
      get: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.notes.get(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
          }
        }
      },
      
      update: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.notes.update(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
      
      deleteNote: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.notes.deleteNote(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
      
      getAnalytics: async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.notes.getAnalytics();
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
      
      searchNotes: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.notes.searchNotes(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
      
      exportNotes: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.notes.exportNotes(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
    },
    
    // Enhanced projects methods
    projects: {
      ...backend.projects,
      
      create: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.projects.create(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
      
      list: async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.projects.list();
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
          }
        }
      },
      
      get: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.projects.get(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
          }
        }
      },
      
      update: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.projects.update(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
      
      deleteProject: async (params: any, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const token = await getToken();
            const client = token ? backend.with({ auth: { authorization: `Bearer ${token}` } }) : backend;
            return await client.projects.deleteProject(params);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      },
    },
  };
  
  return enhancedBackend;
}
