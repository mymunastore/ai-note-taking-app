import { api, APIError } from "encore.dev/api";
import { Header } from "encore.dev/api";
import { authDB } from "./db";
import { verifyPassword, sanitizeUserData, getDeviceInfo } from "./utils";
import type { LoginRequest, AuthResponse } from "./types";
import { createSession } from "./session";
import { verify2FA } from "./two-factor";

interface LoginParams extends LoginRequest {
  userAgent?: Header<"User-Agent">;
  xForwardedFor?: Header<"X-Forwarded-For">;
}

// Authenticates user with email and password, supports 2FA.
export const login = api<LoginParams, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    try {
      // Find user by email
      const user = await authDB.queryRow<{
        id: string;
        email: string;
        phone: string | null;
        password_hash: string;
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
        email_verified: boolean;
        phone_verified: boolean;
        two_factor_enabled: boolean;
        two_factor_secret: string | null;
        status: string;
        last_login_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }>`
        SELECT id, email, phone, password_hash, first_name, last_name, avatar_url, 
               email_verified, phone_verified, two_factor_enabled, two_factor_secret,
               status, last_login_at, created_at, updated_at
        FROM users 
        WHERE email = ${req.email} AND status = 'active'
      `;

      if (!user) {
        throw APIError.unauthenticated("Invalid email or password");
      }

      // Verify password
      const passwordValid = await verifyPassword(req.password, user.password_hash);
      if (!passwordValid) {
        // Log failed login attempt
        await authDB.exec`
          INSERT INTO audit_logs (user_id, action, details)
          VALUES (${user.id}, 'login_failed', ${JSON.stringify({ reason: 'invalid_password' })})
        `;
        throw APIError.unauthenticated("Invalid email or password");
      }

      // Check 2FA if enabled
      if (user.two_factor_enabled) {
        if (!req.twoFactorCode) {
          throw APIError.failedPrecondition("Two-factor authentication code required");
        }

        const twoFactorValid = await verify2FA(user.two_factor_secret!, req.twoFactorCode);
        if (!twoFactorValid) {
          // Log failed 2FA attempt
          await authDB.exec`
            INSERT INTO audit_logs (user_id, action, details)
            VALUES (${user.id}, 'login_failed', ${JSON.stringify({ reason: 'invalid_2fa' })})
          `;
          throw APIError.unauthenticated("Invalid two-factor authentication code");
        }
      }

      // Get device info and IP
      const deviceInfo = getDeviceInfo(req.userAgent);
      const ipAddress = req.xForwardedFor?.split(',')[0] || null;

      // Create session
      const session = await createSession(user.id, deviceInfo, ipAddress, req.rememberMe);

      // Update last login
      await authDB.exec`
        UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}
      `;

      // Log successful login
      await authDB.exec`
        INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent)
        VALUES (${user.id}, 'login_success', ${JSON.stringify({ method: 'email_password' })}, ${ipAddress}, ${req.userAgent})
      `;

      return {
        user: sanitizeUserData({ ...user, last_login_at: new Date() }),
        token: session.token,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
      };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error("Login error:", error);
      throw APIError.internal("Failed to authenticate user");
    }
  }
);
