// Clerk configuration
export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

// Auth0 configuration (for additional SSO options)
export const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN || "";
export const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "";

// PayPal configuration
export const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";
export const paypalEnvironment = import.meta.env.VITE_PAYPAL_ENVIRONMENT || "sandbox"; // "sandbox" or "live"

// Application URLs
export const appUrl = import.meta.env.VITE_APP_URL || "http://localhost:5173";
export const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Feature flags
export const enablePayments = import.meta.env.VITE_ENABLE_PAYMENTS === "true";
export const enableWorkflows = import.meta.env.VITE_ENABLE_WORKFLOWS === "true";
export const enableCohere = import.meta.env.VITE_ENABLE_COHERE === "true";
