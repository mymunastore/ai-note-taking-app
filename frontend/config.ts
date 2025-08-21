// Clerk configuration
export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

// Application configuration
export const appUrl = import.meta.env.VITE_APP_URL || "http://localhost:5173";
export const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Stripe configuration
export const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

// Feature flags
export const enableWorkflows = import.meta.env.VITE_ENABLE_WORKFLOWS === "true";
export const enableCohere = import.meta.env.VITE_ENABLE_COHERE === "true";

// Demo mode configuration - enable if no valid Clerk key is provided
// Check for placeholder values, empty strings, or keys that are too short to be valid
const isValidClerkKey = clerkPublishableKey && 
  clerkPublishableKey.length > 10 && 
  clerkPublishableKey.startsWith('pk_') &&
  !clerkPublishableKey.includes('your_clerk_key_here') &&
  !clerkPublishableKey.includes('placeholder') &&
  clerkPublishableKey !== 'pk_test_your_clerk_key_here';

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true" || !isValidClerkKey;
