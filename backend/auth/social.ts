import { api, APIError } from "encore.dev/api";
import { Header } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { authDB } from "./db";
import { sanitizeUserData, getDeviceInfo } from "./utils";
import type { SocialLoginRequest, AuthResponse } from "./types";
import { createSession } from "./session";

const googleClientId = secret("GoogleClientId");
const googleClientSecret = secret("GoogleClientSecret");
const githubClientId = secret("GitHubClientId");
const githubClientSecret = secret("GitHubClientSecret");
const microsoftClientId = secret("MicrosoftClientId");
const microsoftClientSecret = secret("MicrosoftClientSecret");

interface SocialLoginParams extends SocialLoginRequest {
  userAgent?: Header<"User-Agent">;
  xForwardedFor?: Header<"X-Forwarded-For">;
}

// Authenticates user with social media providers (Google, GitHub, Microsoft, etc.).
export const socialLogin = api<SocialLoginParams, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/social" },
  async (req) => {
    try {
      // Exchange code for access token and get user info
      const socialUserData = await exchangeCodeForUserData(req.provider, req.code, req.redirectUri);

      if (!socialUserData.email) {
        throw APIError.invalidArgument("Email is required from social provider");
      }

      // Check if user exists
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
        SELECT u.id, u.email, u.phone, u.first_name, u.last_name, u.avatar_url, 
               u.email_verified, u.phone_verified, u.two_factor_enabled,
               u.status, u.last_login_at, u.created_at, u.updated_at
        FROM users u
        LEFT JOIN social_accounts sa ON u.id = sa.user_id
        WHERE u.email = ${socialUserData.email} OR (sa.provider = ${req.provider} AND sa.provider_user_id = ${socialUserData.id})
      `;

      if (!user) {
        // Create new user
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
          INSERT INTO users (email, first_name, last_name, avatar_url, email_verified)
          VALUES (${socialUserData.email}, ${socialUserData.firstName}, ${socialUserData.lastName}, ${socialUserData.avatarUrl}, true)
          RETURNING id, email, phone, first_name, last_name, avatar_url, email_verified, phone_verified, two_factor_enabled, status, last_login_at, created_at, updated_at
        `;

        if (!user) {
          throw APIError.internal("Failed to create user");
        }

        // Log user registration
        await authDB.exec`
          INSERT INTO audit_logs (user_id, action, details)
          VALUES (${user.id}, 'user_registered', ${JSON.stringify({ method: 'social', provider: req.provider })})
        `;
      }

      // Check if social account is already linked
      const existingSocialAccount = await authDB.queryRow`
        SELECT id FROM social_accounts 
        WHERE user_id = ${user.id} AND provider = ${req.provider}
      `;

      if (!existingSocialAccount) {
        // Link social account
        await authDB.exec`
          INSERT INTO social_accounts (user_id, provider, provider_user_id, provider_email, provider_data)
          VALUES (${user.id}, ${req.provider}, ${socialUserData.id}, ${socialUserData.email}, ${JSON.stringify(socialUserData)})
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
        VALUES (${user.id}, 'login_success', ${JSON.stringify({ method: 'social', provider: req.provider })}, ${ipAddress}, ${req.userAgent})
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
      console.error("Social login error:", error);
      throw APIError.internal("Failed to authenticate with social provider");
    }
  }
);

async function exchangeCodeForUserData(provider: string, code: string, redirectUri: string): Promise<any> {
  switch (provider) {
    case 'google':
      return await exchangeGoogleCode(code, redirectUri);
    case 'github':
      return await exchangeGitHubCode(code, redirectUri);
    case 'microsoft':
      return await exchangeMicrosoftCode(code, redirectUri);
    default:
      throw APIError.invalidArgument(`Unsupported provider: ${provider}`);
  }
}

async function exchangeGoogleCode(code: string, redirectUri: string): Promise<any> {
  // Exchange code for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: googleClientId(),
      client_secret: googleClientSecret(),
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    throw APIError.internal('Failed to exchange Google code for token');
  }

  const tokenData = await tokenResponse.json();

  // Get user info
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userResponse.ok) {
    throw APIError.internal('Failed to get Google user info');
  }

  const userData = await userResponse.json();

  return {
    id: userData.id,
    email: userData.email,
    firstName: userData.given_name,
    lastName: userData.family_name,
    avatarUrl: userData.picture,
  };
}

async function exchangeGitHubCode(code: string, redirectUri: string): Promise<any> {
  // Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: githubClientId(),
      client_secret: githubClientSecret(),
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    throw APIError.internal('Failed to exchange GitHub code for token');
  }

  const tokenData = await tokenResponse.json();

  // Get user info
  const userResponse = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userResponse.ok) {
    throw APIError.internal('Failed to get GitHub user info');
  }

  const userData = await userResponse.json();

  // Get user email (GitHub might not provide it in the user endpoint)
  const emailResponse = await fetch('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  let email = userData.email;
  if (!email && emailResponse.ok) {
    const emails = await emailResponse.json();
    const primaryEmail = emails.find((e: any) => e.primary);
    email = primaryEmail?.email;
  }

  return {
    id: userData.id.toString(),
    email,
    firstName: userData.name?.split(' ')[0],
    lastName: userData.name?.split(' ').slice(1).join(' '),
    avatarUrl: userData.avatar_url,
  };
}

async function exchangeMicrosoftCode(code: string, redirectUri: string): Promise<any> {
  // Exchange code for access token
  const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: microsoftClientId(),
      client_secret: microsoftClientSecret(),
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      scope: 'openid profile email',
    }),
  });

  if (!tokenResponse.ok) {
    throw APIError.internal('Failed to exchange Microsoft code for token');
  }

  const tokenData = await tokenResponse.json();

  // Get user info
  const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userResponse.ok) {
    throw APIError.internal('Failed to get Microsoft user info');
  }

  const userData = await userResponse.json();

  return {
    id: userData.id,
    email: userData.mail || userData.userPrincipalName,
    firstName: userData.givenName,
    lastName: userData.surname,
    avatarUrl: null, // Microsoft Graph doesn't provide avatar URL directly
  };
}
