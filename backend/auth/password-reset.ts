import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { generateSecureToken, hashPassword, validatePassword } from "./utils";
import { sendPasswordResetEmail } from "./email";
import type { ResetPasswordRequest, ConfirmResetPasswordRequest } from "./types";

// Initiates password reset process by sending reset email.
export const resetPassword = api<ResetPasswordRequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/auth/reset-password" },
  async (req) => {
    try {
      // Check if user exists
      const user = await authDB.queryRow<{ id: string }>`
        SELECT id FROM users WHERE email = ${req.email} AND status = 'active'
      `;

      // Always return success to prevent email enumeration
      if (!user) {
        return { success: true };
      }

      // Generate reset token
      const resetToken = generateSecureToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await authDB.exec`
        INSERT INTO verification_codes (user_id, email, code, type, expires_at)
        VALUES (${user.id}, ${req.email}, ${resetToken}, 'password_reset', ${expiresAt})
      `;

      // Send reset email
      await sendPasswordResetEmail(req.email, resetToken);

      // Log audit event
      await authDB.exec`
        INSERT INTO audit_logs (user_id, action, details)
        VALUES (${user.id}, 'password_reset_requested', ${JSON.stringify({})})
      `;

      return { success: true };

    } catch (error) {
      console.error("Password reset error:", error);
      // Always return success to prevent information leakage
      return { success: true };
    }
  }
);

// Confirms password reset with token and sets new password.
export const confirmResetPassword = api<ConfirmResetPasswordRequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/auth/reset-password/confirm" },
  async (req) => {
    try {
      // Validate new password
      const passwordValidation = validatePassword(req.newPassword);
      if (!passwordValidation.valid) {
        throw APIError.invalidArgument(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Find reset token
      const verification = await authDB.queryRow<{
        id: string;
        user_id: string;
        expires_at: Date;
        used_at: Date | null;
      }>`
        SELECT id, user_id, expires_at, used_at
        FROM verification_codes
        WHERE code = ${req.token} AND type = 'password_reset'
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (!verification) {
        throw APIError.notFound("Invalid reset token");
      }

      if (verification.used_at) {
        throw APIError.alreadyExists("Reset token already used");
      }

      if (verification.expires_at < new Date()) {
        throw APIError.invalidArgument("Reset token expired");
      }

      // Hash new password
      const passwordHash = await hashPassword(req.newPassword);

      // Update password
      await authDB.exec`
        UPDATE users SET password_hash = ${passwordHash} WHERE id = ${verification.user_id}
      `;

      // Mark reset token as used
      await authDB.exec`
        UPDATE verification_codes SET used_at = NOW() WHERE id = ${verification.id}
      `;

      // Revoke all existing sessions for security
      await authDB.exec`
        DELETE FROM user_sessions WHERE user_id = ${verification.user_id}
      `;

      // Log audit event
      await authDB.exec`
        INSERT INTO audit_logs (user_id, action, details)
        VALUES (${verification.user_id}, 'password_reset_completed', ${JSON.stringify({})})
      `;

      return { success: true };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error("Confirm password reset error:", error);
      throw APIError.internal("Failed to reset password");
    }
  }
);
