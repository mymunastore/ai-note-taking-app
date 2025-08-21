import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { hashPassword, validateEmail, validatePassword, generateSecureCode, sanitizeUserData } from "./utils";
import type { RegisterRequest, AuthResponse } from "./types";
import { sendVerificationEmail } from "./email";
import { createSession } from "./session";

// Registers a new user account with email and password.
export const register = api<RegisterRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/register" },
  async (req) => {
    // Validate input
    if (!validateEmail(req.email)) {
      throw APIError.invalidArgument("Invalid email address");
    }

    const passwordValidation = validatePassword(req.password);
    if (!passwordValidation.valid) {
      throw APIError.invalidArgument(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    try {
      // Check if user already exists
      const existingUser = await authDB.queryRow`
        SELECT id FROM users WHERE email = ${req.email}
      `;

      if (existingUser) {
        throw APIError.alreadyExists("User with this email already exists");
      }

      // Hash password
      const passwordHash = await hashPassword(req.password);

      // Create user
      const user = await authDB.queryRow<{
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
        INSERT INTO users (email, password_hash, first_name, last_name, phone)
        VALUES (${req.email}, ${passwordHash}, ${req.firstName || null}, ${req.lastName || null}, ${req.phone || null})
        RETURNING id, email, phone, first_name, last_name, avatar_url, email_verified, phone_verified, two_factor_enabled, status, last_login_at, created_at, updated_at
      `;

      if (!user) {
        throw APIError.internal("Failed to create user");
      }

      // Generate email verification code
      const verificationCode = generateSecureCode(6);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await authDB.exec`
        INSERT INTO verification_codes (user_id, email, code, type, expires_at)
        VALUES (${user.id}, ${req.email}, ${verificationCode}, 'email_verification', ${expiresAt})
      `;

      // Send verification email
      await sendVerificationEmail(req.email, verificationCode);

      // Create session
      const session = await createSession(user.id, null, null);

      // Log audit event
      await authDB.exec`
        INSERT INTO audit_logs (user_id, action, details)
        VALUES (${user.id}, 'user_registered', ${JSON.stringify({ email: req.email })})
      `;

      return {
        user: sanitizeUserData(user),
        token: session.token,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
      };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error("Registration error:", error);
      throw APIError.internal("Failed to register user");
    }
  }
);
