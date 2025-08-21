import { api, APIError } from "encore.dev/api";
import { Header } from "encore.dev/api";
import { authDB } from "./db";
import { validatePhone, generateSecureCode, sanitizeUserData, getDeviceInfo } from "./utils";
import type { PhoneLoginRequest, AuthResponse } from "./types";
import { createSession } from "./session";
import { sendSMS } from "./sms";

interface PhoneLoginParams extends PhoneLoginRequest {
  userAgent?: Header<"User-Agent">;
  xForwardedFor?: Header<"X-Forwarded-For">;
}

interface SendPhoneCodeRequest {
  phone: string;
}

// Sends verification code to phone number for authentication.
export const sendPhoneCode = api<SendPhoneCodeRequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/auth/phone/send-code" },
  async (req) => {
    if (!validatePhone(req.phone)) {
      throw APIError.invalidArgument("Invalid phone number format");
    }

    try {
      // Generate verification code
      const code = generateSecureCode(6);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store verification code
      await authDB.exec`
        INSERT INTO verification_codes (phone, code, type, expires_at)
        VALUES (${req.phone}, ${code}, 'phone_verification', ${expiresAt})
      `;

      // Send SMS
      await sendSMS(req.phone, `Your SCRIBE AI verification code is: ${code}. Valid for 10 minutes.`);

      return { success: true };

    } catch (error) {
      console.error("Send phone code error:", error);
      throw APIError.internal("Failed to send verification code");
    }
  }
);

// Authenticates user with phone number and verification code.
export const phoneLogin = api<PhoneLoginParams, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/phone/login" },
  async (req) => {
    if (!validatePhone(req.phone)) {
      throw APIError.invalidArgument("Invalid phone number format");
    }

    try {
      // Verify code
      const verificationCode = await authDB.queryRow<{
        id: string;
        user_id: string | null;
        expires_at: Date;
        used_at: Date | null;
      }>`
        SELECT id, user_id, expires_at, used_at
        FROM verification_codes
        WHERE phone = ${req.phone} AND code = ${req.verificationCode} AND type = 'phone_verification'
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (!verificationCode) {
        throw APIError.unauthenticated("Invalid verification code");
      }

      if (verificationCode.used_at) {
        throw APIError.unauthenticated("Verification code already used");
      }

      if (verificationCode.expires_at < new Date()) {
        throw APIError.unauthenticated("Verification code expired");
      }

      // Mark code as used
      await authDB.exec`
        UPDATE verification_codes SET used_at = NOW() WHERE id = ${verificationCode.id}
      `;

      // Find or create user
      let user = await authDB.queryRow<{
        id: string;
        email: string;
        phone: string | null;
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
        email_verified: boolean;
        phone_verified: boolean;
        two_factor_enabled: boolean;
        status: string;
        last_login_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }>`
        SELECT id, email, phone, first_name, last_name, avatar_url, 
               email_verified, phone_verified, two_factor_enabled,
               status, last_login_at, created_at, updated_at
        FROM users 
        WHERE phone = ${req.phone} AND status = 'active'
      `;

      if (!user) {
        // Create new user with phone number
        const tempEmail = `${req.phone.replace(/\D/g, '')}@phone.scribeai.com`;
        user = await authDB.queryRow<{
          id: string;
          email: string;
          phone: string | null;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          email_verified: boolean;
          phone_verified: boolean;
          two_factor_enabled: boolean;
          status: string;
          last_login_at: Date | null;
          created_at: Date;
          updated_at: Date;
        }>`
          INSERT INTO users (email, phone, phone_verified)
          VALUES (${tempEmail}, ${req.phone}, true)
          RETURNING id, email, phone, first_name, last_name, avatar_url, email_verified, phone_verified, two_factor_enabled, status, last_login_at, created_at, updated_at
        `;

        if (!user) {
          throw APIError.internal("Failed to create user");
        }

        // Log user registration
        await authDB.exec`
          INSERT INTO audit_logs (user_id, action, details)
          VALUES (${user.id}, 'user_registered', ${JSON.stringify({ method: 'phone' })})
        `;
      } else {
        // Update phone verification status
        await authDB.exec`
          UPDATE users SET phone_verified = true WHERE id = ${user.id}
        `;
      }

      // Get device info and IP
      const deviceInfo = getDeviceInfo(req.userAgent);
      const ipAddress = req.xForwardedFor?.split(',')[0] || null;

      // Create session
      const session = await createSession(user.id, deviceInfo, ipAddress);

      // Update last login
      await authDB.exec`
        UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}
      `;

      // Log successful login
      await authDB.exec`
        INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent)
        VALUES (${user.id}, 'login_success', ${JSON.stringify({ method: 'phone' })}, ${ipAddress}, ${req.userAgent})
      `;

      return {
        user: sanitizeUserData({ ...user, last_login_at: new Date(), phone_verified: true }),
        token: session.token,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
      };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error("Phone login error:", error);
      throw APIError.internal("Failed to authenticate with phone");
    }
  }
);
