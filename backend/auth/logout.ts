import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { revokeSession, revokeAllSessions } from "./session";
import { authDB } from "./db";

interface LogoutRequest {
  refreshToken: string;
  allDevices?: boolean;
}

// Logs out the current user session.
export const logout = api<LogoutRequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/auth/logout", auth: true },
  async (req) => {
    const auth = getAuthData()!;

    try {
      if (req.allDevices) {
        // Revoke all sessions for the user
        await revokeAllSessions(auth.userID);
      } else {
        // Revoke specific session
        await revokeSession(req.refreshToken);
      }

      // Log audit event
      await authDB.exec`
        INSERT INTO audit_logs (user_id, action, details)
        VALUES (${auth.userID}, 'logout', ${JSON.stringify({ allDevices: req.allDevices || false })})
      `;

      return { success: true };

    } catch (error) {
      console.error("Logout error:", error);
      return { success: true }; // Always return success for logout
    }
  }
);
