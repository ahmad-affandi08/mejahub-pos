type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function now() {
  return Date.now();
}

function getEntry(key: string, windowMs: number) {
  const current = rateLimitStore.get(key);
  const currentTime = now();

  if (!current || current.resetAt <= currentTime) {
    const nextEntry: RateLimitEntry = {
      count: 0,
      resetAt: currentTime + windowMs,
    };
    rateLimitStore.set(key, nextEntry);
    return nextEntry;
  }

  return current;
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const entry = getEntry(key, options.windowMs);
  entry.count += 1;
  rateLimitStore.set(key, entry);

  const allowed = entry.count <= options.limit;
  const remaining = Math.max(0, options.limit - entry.count);
  const retryAfter = Math.max(0, Math.ceil((entry.resetAt - now()) / 1000));

  return {
    allowed,
    remaining,
    retryAfter,
  };
}

export function clearRateLimit(key: string) {
  rateLimitStore.delete(key);
}

export function pruneRateLimitStore() {
  const currentTime = now();

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= currentTime) {
      rateLimitStore.delete(key);
    }
  }
}
