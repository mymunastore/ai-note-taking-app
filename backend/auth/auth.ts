import { authHandler } from "encore.dev/auth";
import { Header, Cookie, APIError } from "encore.dev/api";
import { validateSession } from "./session";
import type { AuthData } from "./types";

interface AuthParams {
  authorization?: Header<"Authorization">;
  session?: Cookie<"session">;
}

const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    // Resolve the authenticated user from the authorization header or session cookie
    const token = data.authorization?.replace("Bearer ", "") ?? data.session?.value;
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const authData = await validateSession(token);
      return authData;
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err);
    }
  }
);

export default auth;
