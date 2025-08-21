import { secret } from "encore.dev/config";
import crypto from "node:crypto";

export const openAIKey = secret("OpenAIKey");

const RETRY_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  input: string | URL | Request,
  init: RequestInit = {},
  opts?: {
    retries?: number;
    backoffMs?: number;
    retryStatus?: number[];
  }
): Promise<Response> {
  const retries = opts?.retries ?? 3;
  const baseBackoff = opts?.backoffMs ?? 500;
  const retryStatus = opts?.retryStatus ? new Set(opts.retryStatus) : RETRY_STATUS;

  let attempt = 0;
  let lastErr: any = null;

  while (attempt <= retries) {
    try {
      const res = await fetch(input, init);
      if (res.ok) {
        return res;
      }
      if (!retryStatus.has(res.status) || attempt === retries) {
        // Return the non-ok response if we are out of retries or status is not retryable
        return res;
      }
      // fallthrough to retry
    } catch (err) {
      lastErr = err;
      if (attempt === retries) {
        throw err;
      }
    }
    const jitter = Math.random() * 100;
    const backoff = baseBackoff * Math.pow(2, attempt) + jitter;
    await sleep(backoff);
    attempt++;
  }
  if (lastErr) throw lastErr;
  throw new Error("fetchWithRetry: exhausted retries");
}

export async function openAIChat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }
): Promise<string> {
  const res = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openAIKey()}`,
    },
    body: JSON.stringify({
      model: options?.model ?? "gpt-4o-mini",
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.max_tokens ?? 1000,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenAI chat error: ${res.status} ${txt}`);
  }
  const json = await res.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("OpenAI chat: empty content");
  }
  return content;
}

export async function concurrentMap<T, R>(
  list: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (concurrency <= 0) concurrency = 1;
  const results: R[] = new Array(list.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const current = nextIndex++;
      if (current >= list.length) break;
      results[current] = await fn(list[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, list.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export function hashString(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}
