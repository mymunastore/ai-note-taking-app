import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import type { VerifyEmailRequest, VerifyPhoneRequest } from "./types";

// Verifies user email address with verification code.
export const verifyEmail = api<VerifyEmailRequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/auth/verify-email" },
  async (req) => {
    try {
      // Find verification code
      const verification = await authDB.queryRow<{
        id: string;
        user_id: string;
        expires_at: Date;
        used_at: Date | null;
      }>`
        SELECT id, user_id, expires_at, used_at
        FROM verification_codes
        WHERE code = ${req.token} AND type = 'email_verification'
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (!verification) {
        throw APIError.notFound("Invalid verification code");
      }

      if (verification.used_at) {
        throw APIError.alreadyExists("Verification code already used");
      }

      if (verification.expires_at < new Date()) {
        throw APIError.invalidArgument("Verification code expired");
      }

      // Mark email as verified
      await authDB.exec`
        UPDATE users SET email_verified = true WHERE id = ${verification.user_id}
      `;

      // Mark verification code as used
      await authDB.exec`
        UPDATE verification_codes SET used_at = NOW() WHERE id = ${verification.id}
      `;

      // Log audit event
      await authDB.exec`
        INSERT INTO audit_logs (user_id, action, details)
        VALUES (${verification.user_id}, 'email_verified', ${JSON.stringify({})})
      `;

      return { success: true };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error("Email verification error:", error);
      throw APIError.internal("Failed to verify email");
    }
  }
);

// Verifies user phone number with verification code.
export const verifyPhone = api<VerifyPhoneRequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/auth/verify-phone" },
  async (req) => {
    try {
      // Find verification code
      const verification = await authDB.queryRow<{
        id: string;
        user_id: string | null;
        expires_at: Date;
        used_at: Date | null;
      }>`
        SELECT id, user_id, expires_at, used_at
        FROM verification_codes
        WHERE phone = ${req.phone} AND code = ${req.code} AND type = 'phone_verification'
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (!verification) {
        throw APIError.notFound("Invalid verification code");
      }

      if (verification.used_at) {
        throw APIError.alreadyExists("Verification code already used");
      }

      if (verification.expires_at < new Date()) {
        throw APIError.invalidArgument("Verification code expired");
      }

      if (verification.user_id) {
        // Mark phone as verified for existing user
        await authDB.exec`
          UPDATE users SET phone_verified = true WHERE id = ${verification.user_id}
        `;

        // Log audit event
        await authDB.exec`
          INSERT INTO audit_logs (user_id, action, details)
          VALUES (${verification.user_id}, 'phone_verified', ${JSON.stringify({})})
        `;
      }

      // Mark verification code as used
      await authDB.exec`
        UPDATE verification_codes SET used_at = NOW() WHERE id = ${verification.id}
      `;

      return { success: true };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error("Phone verification error:", error);
      throw APIError.internal("Failed to verify phone");
    }
  }
);
