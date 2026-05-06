/**
 * Redis-based rate limiting
 *
 * Uses Redis INCR + EXPIRE for atomic, O(1), auto-expiring rate limiting.
 * Does NOT use PostgreSQL — Redis is the correct tool for this hot path.
 *
 * Requirements: 3.9, 12.6
 */

import type { RateLimitResult } from '@/types';
import { redis } from './redis';

/**
 * Checks rate limit for a given key using Redis INCR/EXPIRE pattern.
 *
 * Algorithm:
 *   1. INCR the key (atomic counter increment)
 *   2. If count === 1 (first request in window), set EXPIRE
 *   3. If count > maxCount, fetch TTL and return blocked result
 *   4. Otherwise return allowed result with remaining count
 *
 * @param key - Unique key for the rate limit window (e.g., `form:${ip}`)
 * @param maxCount - Maximum number of requests allowed in the window
 * @param windowSeconds - Duration of the rate limit window in seconds
 * @returns RateLimitResult with allowed flag, remaining count, and retryAfter
 *
 * @example
 * // Form submission: 3 requests per IP per hour
 * const result = await checkRateLimit(`form:${ip}`, 3, 3600);
 *
 * // CMS IP block: 100 requests per IP per minute
 * const result = await checkRateLimit(`cms:${ip}`, 100, 60);
 */
export async function checkRateLimit(
  key: string,
  maxCount: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redisKey = `rate_limit:${key}`;

  // Atomic increment
  const count = await redis.incr(redisKey);

  // Set expiry only on first request to avoid resetting the window
  if (count === 1) {
    await redis.expire(redisKey, windowSeconds);
  }

  if (count > maxCount) {
    // Fetch remaining TTL so the caller can set Retry-After header
    const ttl = await redis.ttl(redisKey);
    return { allowed: false, remaining: 0, retryAfter: ttl > 0 ? ttl : windowSeconds };
  }

  return { allowed: true, remaining: maxCount - count };
}
