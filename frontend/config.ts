// Clerk configuration
export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_your_clerk_key_here";

// Application configuration
export const appUrl = import.meta.env.VITE_APP_URL || "http://localhost:5173";
export const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Stripe configuration
export const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_your_stripe_key_here";

// Feature flags
export const enableWorkflows = import.meta.env.VITE_ENABLE_WORKFLOWS === "true";
export const enableCohere = import.meta.env.VITE_ENABLE_COHERE === "true";

// Demo mode configuration
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";
