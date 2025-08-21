export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  status: 'active' | 'suspended' | 'deleted';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  tokenHash: string;
  deviceInfo?: any;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface SocialAccount {
  id: string;
  userId: string;
  provider: 'google' | 'github' | 'microsoft' | 'apple' | 'facebook' | 'twitter';
  providerUserId: string;
  providerEmail?: string;
  providerData?: any;
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  ssoEnabled: boolean;
  ssoProvider?: string;
  ssoConfig?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface VerificationCode {
  id: string;
  userId?: string;
  email?: string;
  phone?: string;
  code: string;
  type: 'email_verification' | 'phone_verification' | 'password_reset' | 'two_factor';
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export interface AuthData {
  userID: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  organizationId?: string;
  role?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
  rememberMe?: boolean;
}

export interface SocialLoginRequest {
  provider: 'google' | 'github' | 'microsoft' | 'apple' | 'facebook' | 'twitter';
  code: string;
  redirectUri: string;
}

export interface PhoneLoginRequest {
  phone: string;
  verificationCode: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyPhoneRequest {
  phone: string;
  code: string;
}

export interface Enable2FARequest {
  password: string;
}

export interface Confirm2FARequest {
  secret: string;
  code: string;
}

export interface Disable2FARequest {
  password: string;
  code: string;
}

export interface SSOLoginRequest {
  domain: string;
  samlResponse?: string;
  oidcCode?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}
