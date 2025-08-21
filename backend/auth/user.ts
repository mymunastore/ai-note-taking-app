import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface UserInfo {
  id: string;
  email: string | null;
  imageUrl: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  role?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
}

// Retrieves the current user's information.
export const getUserInfo = api<void, UserInfo>(
  { auth: true, expose: true, method: "GET", path: "/auth/user/me" },
  async () => {
    const auth = getAuthData()!; // guaranteed to be non-null since `auth: true` is set.
    return {
      id: auth.userID,
      email: auth.email,
      imageUrl: auth.imageUrl,
      firstName: auth.firstName,
      lastName: auth.lastName,
      organizationId: auth.organizationId,
      role: auth.role,
    };
  }
);

// Updates the current user's profile.
export const updateProfile = api<UpdateProfileRequest, UserInfo>(
  { auth: true, expose: true, method: "PATCH", path: "/auth/user/me" },
  async (req) => {
    const auth = getAuthData()!;
    
    try {
      const updatedUser = await clerkClient.users.updateUser(auth.userID, {
        firstName: req.firstName,
        lastName: req.lastName,
      });

      return {
        id: updatedUser.id,
        email: updatedUser.emailAddresses[0]?.emailAddress ?? null,
        imageUrl: updatedUser.imageUrl,
        firstName: updatedUser.firstName ?? undefined,
        lastName: updatedUser.lastName ?? undefined,
        organizationId: auth.organizationId,
        role: auth.role,
      };
    } catch (error) {
      console.error("Update profile error:", error);
      throw APIError.internal("Failed to update user profile");
    }
  }
);
