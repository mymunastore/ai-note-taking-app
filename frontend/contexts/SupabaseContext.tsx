import React, { createContext, useContext, ReactNode } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey, hasSupabase } from "../config";

interface SupabaseContextType {
  supabase: SupabaseClient | null;
  isEnabled: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

interface SupabaseProviderProps {
  children: ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const supabase = hasSupabase 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

  const value: SupabaseContextType = {
    supabase,
    isEnabled: hasSupabase,
  };

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
}
