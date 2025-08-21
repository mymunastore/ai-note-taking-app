import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { secret } from "encore.dev/config";

const scryptAsync = promisify(scrypt);
const jwtSecret = secret("JWTSecret");

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
}

export function generateSecureCode(length: number = 6): string {
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += digits[Math.floor(Math.random() * digits.length)];
  }
  return result;
}

export function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

export function generate2FASecret(): string {
  return randomBytes(16).toString('base32');
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateSecureCode(8));
  }
  return codes;
}

export async function createJWT(payload: any, expiresIn: string = '24h'): Promise<string> {
  // In a real implementation, use a proper JWT library like jsonwebtoken
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (expiresIn === '24h' ? 24 * 60 * 60 : 7 * 24 * 60 * 60); // 24h or 7d
  
  const payloadWithExp = { ...payload, iat: now, exp };
  const payloadEncoded = Buffer.from(JSON.stringify(payloadWithExp)).toString('base64url');
  
  const signature = await createSignature(`${header}.${payloadEncoded}`);
  return `${header}.${payloadEncoded}.${signature}`;
}

export async function verifyJWT(token: string): Promise<any> {
  const [header, payload, signature] = token.split('.');
  
  // Verify signature
  const expectedSignature = await createSignature(`${header}.${payload}`);
  if (signature !== expectedSignature) {
    throw new Error('Invalid token signature');
  }
  
  // Decode payload
  const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
  
  // Check expiration
  if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  
  return decodedPayload;
}

async function createSignature(data: string): Promise<string> {
  const key = await scryptAsync(jwtSecret(), 'salt', 32) as Buffer;
  const hmac = require('crypto').createHmac('sha256', key);
  hmac.update(data);
  return hmac.digest('base64url');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { valid: errors.length === 0, errors };
}

export function sanitizeUserData(user: any): User {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.first_name,
    lastName: user.last_name,
    avatarUrl: user.avatar_url,
    emailVerified: user.email_verified,
    phoneVerified: user.phone_verified,
    twoFactorEnabled: user.two_factor_enabled,
    status: user.status,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export function getDeviceInfo(userAgent?: string): any {
  if (!userAgent) return null;
  
  // Simple device detection - in production, use a proper library
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const browser = userAgent.includes('Chrome') ? 'Chrome' : 
                 userAgent.includes('Firefox') ? 'Firefox' : 
                 userAgent.includes('Safari') ? 'Safari' : 'Unknown';
  
  return {
    isMobile,
    browser,
    userAgent: userAgent.substring(0, 200) // Truncate for storage
  };
}
