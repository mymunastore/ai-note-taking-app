import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { generate2FASecret, generateBackupCodes } from "./utils";
import type { Enable2FARequest, Confirm2FARequest, Disable2FARequest, TwoFactorSetupResponse } from "./types";
import { getAuthData } from "~encore/auth";

// Enables two-factor authentication for the current user.
export const enable2FA = api<Enable2FARequest, TwoFactorSetupResponse>(
  { expose: true, method: "POST", path: "/auth/2fa/enable", auth: true },
  async (req) => {
    const auth = getAuthData()!;

    try {
      // Verify current password
      const user = await authDB.queryRow<{
        password_hash: string;
        two_factor_enabled: boolean;
      }>`
        SELECT password_hash, two_factor_enabled FROM users WHERE id = ${auth.userID}
      `;

      if (!user) {
        throw APIError.notFound("User not found");
      }

      if (user.two_factor_enabled) {
        throw APIError.alreadyExists("Two-factor authentication is already enabled");
      }

      // Verify password
      const { verifyPassword } = await import("./utils");
      const passwordValid = await verifyPassword(req.password, user.password_hash);
      if (!passwordValid) {
        throw APIError.unauthenticated("Invalid password");
      }

      // Generate 2FA secret and backup codes
      const secret = generate2FASecret();
      const backupCodes = generateBackupCodes();

      // Store secret temporarily (not enabled until confirmed)
      await authDB.exec`
        UPDATE users 
        SET two_factor_secret = ${secret}, backup_codes = ${backupCodes}
        WHERE id = ${auth.userID}
      `;

      // Generate QR code URL
      const qrCodeUrl = `otpauth://totp/SCRIBE%20AI:${auth.email}?secret=${secret}&issuer=SCRIBE%20AI`;

      return {
        secret,
        qrCodeUrl,
        backupCodes,
      };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error("Enable 2FA error:", error);
      throw APIError.internal("Failed to enable two-factor authentication");
    }
  }
);

// Confirms and activates two-factor authentication.
export const confirm2FA = api<Confirm2FARequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/auth/2fa/confirm", auth: true },
  async (req) => {
    const auth = getAuthData()!;

    try {
      // Verify 2FA code
      const isValid = await verify2FA(req.secret, req.code);
      if (!isValid) {
        throw APIError.unauthenticated("Invalid two-factor authentication code");
      }

      // Enable 2FA
      await authDB.exec`
        UPDATE users SET two_factor_enabled = true WHERE id = ${auth.userID}
      `;

      // Log audit event
      await authDB.exec`
        INSERT INTO audit_logs (user_id, action, details)
        VALUES (${auth.userID}, '2fa_enabled', ${JSON.stringify({})})
      `;

      return { success: true };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error("Confirm 2FA error:", error);
      throw APIError.internal("Failed to confirm two-factor authentication");
    }
  }
);

// Disables two-factor authentication for the current user.
export const disable2FA = api<Disable2FARequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/auth/2fa/disable", auth: true },
  async (req) => {
    const auth = getAuthData()!;

    try {
      // Get user data
      const user = await authDB.queryRow<{
        password_hash: string;
        two_factor_enabled: boolean;
        two_factor_secret: string | null;
      }>`
        SELECT password_hash, two_factor_enabled, two_factor_secret 
        FROM users WHERE id = ${auth.userID}
      `;

      if (!user) {
        throw APIError.notFound("User not found");
      }

      if (!user.two_factor_enabled) {
        throw APIError.invalidArgument("Two-factor authentication is not enabled");
      }

      // Verify password
      const { verifyPassword } = await import("./utils");
      const passwordValid = await verifyPassword(req.password, user.password_hash);
      if (!passwordValid) {
        throw APIError.unauthenticated("Invalid password");
      }

      // Verify 2FA code
      const twoFactorValid = await verify2FA(user.two_factor_secret!, req.code);
      if (!twoFactorValid) {
        throw APIError.unauthenticated("Invalid two-factor authentication code");
      }

      // Disable 2FA
      await authDB.exec`
        UPDATE users 
        SET two_factor_enabled = false, two_factor_secret = NULL, backup_codes = NULL
        WHERE id = ${auth.userID}
      `;

      // Log audit event
      await authDB.exec`
        INSERT INTO audit_logs (user_id, action, details)
        VALUES (${auth.userID}, '2fa_disabled', ${JSON.stringify({})})
      `;

      return { success: true };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error("Disable 2FA error:", error);
      throw APIError.internal("Failed to disable two-factor authentication");
    }
  }
);

export async function verify2FA(secret: string, code: string): Promise<boolean> {
  // Simple TOTP verification - in production, use a proper library like speakeasy
  const window = 30; // 30 second window
  const currentTime = Math.floor(Date.now() / 1000 / window);
  
  // Check current window and adjacent windows for clock drift
  for (let i = -1; i <= 1; i++) {
    const timeStep = currentTime + i;
    const expectedCode = generateTOTP(secret, timeStep);
    if (expectedCode === code) {
      return true;
    }
  }
  
  return false;
}

function generateTOTP(secret: string, timeStep: number): string {
  // Simple TOTP implementation - in production, use a proper library
  const crypto = require('crypto');
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(timeStep, 4);
  
  const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
  hmac.update(buffer);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0xf;
  const code = ((hash[offset] & 0x7f) << 24) |
               ((hash[offset + 1] & 0xff) << 16) |
               ((hash[offset + 2] & 0xff) << 8) |
               (hash[offset + 3] & 0xff);
  
  return (code % 1000000).toString().padStart(6, '0');
}
