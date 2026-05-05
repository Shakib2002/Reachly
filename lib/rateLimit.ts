import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

/**
 * Rate limiting utility using Upstash Redis.
 * 
 * If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set,
 * rate limiting is disabled (allows all requests) — this prevents
 * breaking the app in development.
 */

const isConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// Create Redis client only if configured
const redis = isConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Pre-configured rate limiters for different API tiers.
 * - `standard`: 30 requests per 60 seconds (general API routes)
 * - `sensitive`: 10 requests per 60 seconds (email send, AI generation)
 * - `auth`: 5 requests per 60 seconds (login/register)
 * - `search`: 20 requests per 60 seconds (job/lead search)
 */
export const rateLimiters = {
  standard: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '60 s'), prefix: 'rl:standard' })
    : null,
  sensitive: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '60 s'), prefix: 'rl:sensitive' })
    : null,
  auth: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '60 s'), prefix: 'rl:auth' })
    : null,
  search: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '60 s'), prefix: 'rl:search' })
    : null,
};

export type RateLimitTier = keyof typeof rateLimiters;

/**
 * Apply rate limiting to an API route handler.
 * Returns a 429 response if the limit is exceeded, or null if allowed.
 * 
 * Usage:
 * ```ts
 * const rateLimited = await applyRateLimit(request, 'sensitive');
 * if (rateLimited) return rateLimited;
 * ```
 */
export async function applyRateLimit(
  request: Request,
  tier: RateLimitTier = 'standard'
): Promise<NextResponse | null> {
  const limiter = rateLimiters[tier];
  if (!limiter) return null; // Rate limiting not configured — allow through

  // Use IP + path as the identifier
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  const identifier = `${ip}:${new URL(request.url).pathname}`;

  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null; // Request allowed
}
