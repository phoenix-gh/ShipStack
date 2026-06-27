import { fail } from "./response";

export interface RateLimitOptions {
  key?: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  key: string;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  request: Request,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const key = options.key ?? getClientRateLimitKey(request, "api");
  const windowMs = options.windowSeconds * 1_000;
  const existing = buckets.get(key);
  const bucket =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + windowMs };

  deleteExpiredBuckets(now);

  if (bucket.count >= options.limit) {
    buckets.set(key, bucket);
    return toResult({ allowed: false, bucket, key, limit: options.limit, now });
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  return toResult({ allowed: true, bucket, key, limit: options.limit, now });
}

export function getClientRateLimitKey(request: Request, scope: string) {
  const clientIp =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous";

  return `${scope}:${clientIp}`;
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "retry-after": String(result.retryAfterSeconds),
    "x-ratelimit-limit": String(result.limit),
    "x-ratelimit-remaining": String(result.remaining),
    "x-ratelimit-reset": String(Math.ceil(result.resetAt.getTime() / 1_000)),
  };
}

export function rateLimitResponse(result: RateLimitResult) {
  return fail(
    {
      code: "RATE_LIMITED",
      message: "Too many requests. Please retry later.",
    },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    },
  );
}

export function resetRateLimitStoreForTests() {
  buckets.clear();
}

function toResult(input: {
  allowed: boolean;
  bucket: Bucket;
  key: string;
  limit: number;
  now: number;
}): RateLimitResult {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((input.bucket.resetAt - input.now) / 1_000),
  );

  return {
    allowed: input.allowed,
    key: input.key,
    limit: input.limit,
    remaining: Math.max(0, input.limit - input.bucket.count),
    resetAt: new Date(input.bucket.resetAt),
    retryAfterSeconds,
  };
}

function deleteExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}
