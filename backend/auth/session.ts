import { authDB } from "./db";
import { createJWT, generateSecureToken } from "./utils";

export async function createSession(
  userId: string, 
  deviceInfo: any = null, 
  ipAddress: string | null = null,
  rememberMe: boolean = false
): Promise<{ token: string; refreshToken: string; expiresAt: Date }> {
  const expiresIn = rememberMe ? '7d' : '24h';
  const expiresAt = new Date(Date.now() + (rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
  
  // Create JWT token
  const token = await createJWT({ userId }, expiresIn);
  
  // Create refresh token
  const refreshToken = generateSecureToken();
  const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
  
  // Store session in database
  await authDB.exec`
    INSERT INTO user_sessions (user_id, token_hash, device_info, ip_address, expires_at)
    VALUES (${userId}, ${tokenHash}, ${deviceInfo ? JSON.stringify(deviceInfo) : null}, ${ipAddress}, ${expiresAt})
  `;
  
  return { token, refreshToken, expiresAt };
}

export async function validateSession(token: string): Promise<any> {
  try {
    const payload = await import("./utils").then(m => m.verifyJWT(token));
    
    // Check if user still exists and is active
    const user = await authDB.queryRow`
      SELECT id, email, first_name, last_name, avatar_url, status
      FROM users 
      WHERE id = ${payload.userId} AND status = 'active'
    `;
    
    if (!user) {
      throw new Error('User not found or inactive');
    }
    
    return {
      userID: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
    };
  } catch (error) {
    throw new Error('Invalid session');
  }
}

export async function refreshSession(refreshToken: string): Promise<{ token: string; refreshToken: string; expiresAt: Date }> {
  const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
  
  // Find valid session
  const session = await authDB.queryRow<{
    user_id: string;
    expires_at: Date;
  }>`
    SELECT user_id, expires_at
    FROM user_sessions
    WHERE token_hash = ${tokenHash} AND expires_at > NOW()
  `;
  
  if (!session) {
    throw new Error('Invalid refresh token');
  }
  
  // Delete old session
  await authDB.exec`
    DELETE FROM user_sessions WHERE token_hash = ${tokenHash}
  `;
  
  // Create new session
  return await createSession(session.user_id);
}

export async function revokeSession(refreshToken: string): Promise<void> {
  const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
  
  await authDB.exec`
    DELETE FROM user_sessions WHERE token_hash = ${tokenHash}
  `;
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await authDB.exec`
    DELETE FROM user_sessions WHERE user_id = ${userId}
  `;
}
