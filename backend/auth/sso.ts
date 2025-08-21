import { api, APIError } from "encore.dev/api";
import { Header } from "encore.dev/api";
import { authDB } from "./db";
import { sanitizeUserData, getDeviceInfo } from "./utils";
import type { SSOLoginRequest, AuthResponse } from "./types";
import { createSession } from "./session";

interface SSOLoginParams extends SSOLoginRequest {
  userAgent?: Header<"User-Agent">;
  xForwardedFor?: Header<"X-Forwarded-For">;
}

// Authenticates user with enterprise SSO (SAML/OIDC).
export const ssoLogin = api<SSOLoginParams, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/sso" },
  async (req) => {
    try {
      // Find organization by domain
      const organization = await authDB.queryRow<{
        id: string;
        name: string;
        sso_enabled: boolean;
        sso_provider: string | null;
        sso_config: any;
      }>`
        SELECT id, name, sso_enabled, sso_provider, sso_config
        FROM organizations
        WHERE domain = ${req.domain} AND sso_enabled = true
      `;

      if (!organization) {
        throw APIError.notFound("SSO not configured for this domain");
      }

      // Validate SSO response based on provider
      let userData: any;
      if (organization.sso_provider === 'saml') {
        userData = await validateSAMLResponse(req.samlResponse!, organization.sso_config);
      } else if (organization.sso_provider === 'oidc') {
        userData = await validateOIDCCode(req.oidcCode!, organization.sso_config);
      } else {
        throw APIError.invalidArgument("Unsupported SSO provider");
      }

      if (!userData.email) {
        throw APIError.invalidArgument("Email is required from SSO provider");
      }

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
        WHERE email = ${userData.email} AND status = 'active'
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
          INSERT INTO users (email, first_name, last_name, email_verified)
          VALUES (${userData.email}, ${userData.firstName}, ${userData.lastName}, true)
          RETURNING id, email, phone, first_name, last_name, avatar_url, email_verified, phone_verified, two_factor_enabled, status, last_login_at, created_at, updated_at
        `;

        if (!user) {
          throw APIError.internal("Failed to create user");
        }

        // Add user to organization
        await authDB.exec`
          INSERT INTO organization_members (organization_id, user_id, role)
          VALUES (${organization.id}, ${user.id}, 'member')
        `;

        // Log user registration
        await authDB.exec`
          INSERT INTO audit_logs (user_id, action, details)
          VALUES (${user.id}, 'user_registered', ${JSON.stringify({ method: 'sso', domain: req.domain })})
        `;
      } else {
        // Check if user is already a member of the organization
        const membership = await authDB.queryRow`
          SELECT id FROM organization_members 
          WHERE organization_id = ${organization.id} AND user_id = ${user.id}
        `;

        if (!membership) {
          // Add user to organization
          await authDB.exec`
            INSERT INTO organization_members (organization_id, user_id, role)
            VALUES (${organization.id}, ${user.id}, 'member')
          `;
        }
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
        VALUES (${user.id}, 'login_success', ${JSON.stringify({ method: 'sso', domain: req.domain })}, ${ipAddress}, ${req.userAgent})
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
      console.error("SSO login error:", error);
      throw APIError.internal("Failed to authenticate with SSO");
    }
  }
);

async function validateSAMLResponse(samlResponse: string, ssoConfig: any): Promise<any> {
  // In a real implementation, use a proper SAML library like saml2-js
  // This is a simplified example
  try {
    const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf-8');
    
    // Parse SAML response (simplified)
    const emailMatch = decodedResponse.match(/<saml:Attribute Name="email".*?<saml:AttributeValue>(.*?)<\/saml:AttributeValue>/);
    const firstNameMatch = decodedResponse.match(/<saml:Attribute Name="firstName".*?<saml:AttributeValue>(.*?)<\/saml:AttributeValue>/);
    const lastNameMatch = decodedResponse.match(/<saml:Attribute Name="lastName".*?<saml:AttributeValue>(.*?)<\/saml:AttributeValue>/);

    return {
      email: emailMatch?.[1],
      firstName: firstNameMatch?.[1],
      lastName: lastNameMatch?.[1],
    };
  } catch (error) {
    throw APIError.unauthenticated("Invalid SAML response");
  }
}

async function validateOIDCCode(code: string, ssoConfig: any): Promise<any> {
  try {
    // Exchange code for access token
    const tokenResponse = await fetch(ssoConfig.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: ssoConfig.clientId,
        client_secret: ssoConfig.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: ssoConfig.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw APIError.unauthenticated("Failed to exchange OIDC code for token");
    }

    const tokenData = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch(ssoConfig.userInfoEndpoint, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      throw APIError.unauthenticated("Failed to get OIDC user info");
    }

    const userData = await userResponse.json();

    return {
      email: userData.email,
      firstName: userData.given_name || userData.first_name,
      lastName: userData.family_name || userData.last_name,
    };
  } catch (error) {
    throw APIError.unauthenticated("Invalid OIDC response");
  }
}
