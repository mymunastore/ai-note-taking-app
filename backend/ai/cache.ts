import { aiDB } from "./db";

export interface CacheOptions {
  ttlSeconds: number;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const row = await aiDB.rawQueryRow<{ value: any }>(
    `SELECT value FROM ai_cache WHERE key = $1 AND expires_at > NOW()`,
    key
  );
  return row ? (row.value as T) : null;
}

export async function setCached<T>(key: string, value: T, opts: CacheOptions): Promise<void> {
  const expires = new Date(Date.now() + opts.ttlSeconds * 1000);
  await aiDB.rawExec(
    `INSERT INTO ai_cache (key, value, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (key)
     DO UPDATE SET value = EXCLUDED.value, expires_at = EXCLUDED.expires_at, updated_at = NOW()`,
    key,
    value as any,
    expires
  );

  // Opportunistic cleanup of expired entries (lightweight)
  if (Math.random() < 0.05) {
    await purgeExpired();
  }
}

export async function purgeExpired(): Promise<void> {
  await aiDB.rawExec(`DELETE FROM ai_cache WHERE expires_at <= NOW()`);
}
