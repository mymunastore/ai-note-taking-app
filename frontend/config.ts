// Application configuration
export const appUrl = import.meta.env.VITE_APP_URL || "http://localhost:5173";
export const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Feature flags
export const enableWorkflows = import.meta.env.VITE_ENABLE_WORKFLOWS === "true";
export const enableCohere = import.meta.env.VITE_ENABLE_COHERE === "true";

// Demo mode configuration
export const isDemoMode = true;
