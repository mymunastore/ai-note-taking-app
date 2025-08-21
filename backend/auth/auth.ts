import { createClerkClient, verifyToken } from "@clerk/backend";
import { Header, Cookie, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

interface AuthParams {
  authorization?: Header<"Authorization">;
  session?: Cookie<"session">;
}

export interface AuthData {
  userID: string;
  imageUrl: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
  plan: "free" | "pro" | "enterprise";
  organizationId?: string;
  organizationRole?: string;
}

// Configure the authorized parties.
// TODO: Configure this for your own domain when deploying to production.
const AUTHORIZED_PARTIES = [
  "https://*.lp.dev",
  "http://localhost:5173",
  "http://localhost:3000",
];

const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    // Resolve the authenticated user from the authorization header or session cookie.
    const token = data.authorization?.replace("Bearer ", "") ?? data.session?.value;
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const verifiedToken = await verifyToken(token, {
        authorizedParties: AUTHORIZED_PARTIES,
        secretKey: clerkSecretKey(),
      });

      const user = await clerkClient.users.getUser(verifiedToken.sub);
      
      // Get user's organization membership
      const organizationMemberships = await clerkClient.users.getOrganizationMembershipList({
        userId: user.id,
      });

      const primaryMembership = organizationMemberships[0];
      
      // Determine user's plan based on organization or individual subscription
      let plan: "free" | "pro" | "enterprise" = "free";
      
      if (primaryMembership?.organization) {
        // Check organization plan from metadata
        const orgPlan = primaryMembership.organization.publicMetadata?.plan as string;
        if (orgPlan === "enterprise") {
          plan = "enterprise";
        } else if (orgPlan === "pro") {
          plan = "pro";
        }
      } else {
        // Check individual user plan from metadata
        const userPlan = user.publicMetadata?.plan as string;
        if (userPlan === "pro") {
          plan = "pro";
        } else if (userPlan === "enterprise") {
          plan = "enterprise";
        }
      }

      return {
        userID: user.id,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0]?.emailAddress ?? null,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        plan,
        organizationId: primaryMembership?.organization?.id,
        organizationRole: primaryMembership?.role,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err);
    }
  }
);

// Configure the API gateway to use the auth handler.
export const gw = new Gateway({ authHandler: auth });
