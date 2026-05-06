/**
 * Property-based tests for rate limiting logic
 *
 * Property 5: Rate limiting chặn đúng sau khi vượt ngưỡng
 *   Validates: Requirements 3.9, 12.6
 *
 * Since Redis is an external dependency, we test the rate limiting logic
 * using a mock Redis client that simulates INCR/EXPIRE/TTL behaviour in memory.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Mock Redis client
// ---------------------------------------------------------------------------

/**
 * In-memory mock that simulates Redis INCR / EXPIRE / TTL semantics.
 * Each key has a counter and an optional expiry timestamp.
 */
function createMockRedis() {
  const store = new Map<string, { count: number; expiresAt: number | null }>();

  return {
    /** Increment key and return new value (creates key at 0 if absent) */
    async incr(key: string): Promise<number> {
      const entry = store.get(key) ?? { count: 0, expiresAt: null };
      entry.count += 1;
      store.set(key, entry);
      return entry.count;
    },

    /** Set expiry in seconds (only if key exists and has no expiry yet) */
    async expire(key: string, seconds: number): Promise<number> {
      const entry = store.get(key);
      if (!entry) return 0;
      if (entry.expiresAt === null) {
        entry.expiresAt = Date.now() + seconds * 1000;
        store.set(key, entry);
      }
      return 1;
    },

    /** Return remaining TTL in seconds (-1 if no expiry, -2 if key missing) */
    async ttl(key: string): Promise<number> {
      const entry = store.get(key);
      if (!entry) return -2;
      if (entry.expiresAt === null) return -1;
      const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
      return remaining > 0 ? remaining : -2;
    },

    /** Reset all keys (used between test runs) */
    _reset() {
      store.clear();
    },
  };
}

// ---------------------------------------------------------------------------
// Rate limit logic under test (extracted so we can inject the mock)
// ---------------------------------------------------------------------------

type MockRedis = ReturnType<typeof createMockRedis>;

/**
 * Pure rate-limit logic identical to src/lib/rate-limit.ts but accepts
 * an injected Redis client so we can test without a real Redis connection.
 */
async function checkRateLimitWithClient(
  redisClient: MockRedis,
  key: string,
  maxCount: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const redisKey = `rate_limit:${key}`;

  const count = await redisClient.incr(redisKey);

  if (count === 1) {
    await redisClient.expire(redisKey, windowSeconds);
  }

  if (count > maxCount) {
    const ttl = await redisClient.ttl(redisKey);
    return { allowed: false, remaining: 0, retryAfter: ttl > 0 ? ttl : windowSeconds };
  }

  return { allowed: true, remaining: maxCount - count };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 5: Rate limiting chặn đúng sau khi vượt ngưỡng', () => {
  let mockRedis: MockRedis;

  beforeEach(() => {
    mockRedis = createMockRedis();
  });

  // -------------------------------------------------------------------------
  // Property: After maxCount requests, the (maxCount+1)th request is blocked
  // Validates: Requirements 3.9, 12.6
  // -------------------------------------------------------------------------

  it('chặn request thứ (maxCount+1) sau khi đã đạt ngưỡng', async () => {
    /**
     * **Validates: Requirements 3.9, 12.6**
     * Với bất kỳ maxCount (1–10) và windowSeconds (60–3600) nào,
     * sau khi gửi đúng maxCount request, request tiếp theo phải bị chặn
     * với allowed = false và remaining = 0.
     */
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 60, max: 3600 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        async (maxCount, windowSeconds, ipSuffix) => {
          // Fresh mock for each property run
          const redis = createMockRedis();
          const key = `form:192.168.1.${ipSuffix}`;

          // Send exactly maxCount requests — all should be allowed
          for (let i = 0; i < maxCount; i++) {
            const result = await checkRateLimitWithClient(redis, key, maxCount, windowSeconds);
            expect(result.allowed).toBe(true);
          }

          // The (maxCount+1)th request must be blocked
          const blocked = await checkRateLimitWithClient(redis, key, maxCount, windowSeconds);
          expect(blocked.allowed).toBe(false);
          expect(blocked.remaining).toBe(0);
          expect(blocked.retryAfter).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Property: Before maxCount requests, all requests are allowed
  // Validates: Requirements 3.9, 12.6
  // -------------------------------------------------------------------------

  it('cho phép tất cả request trước khi đạt ngưỡng', async () => {
    /**
     * **Validates: Requirements 3.9, 12.6**
     * Với bất kỳ maxCount (1–10) nào, mỗi request từ 1 đến maxCount
     * phải được cho phép (allowed = true) và remaining phải giảm dần đúng.
     */
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 60, max: 3600 }),
        async (maxCount, windowSeconds) => {
          const redis = createMockRedis();
          const key = `form:test-ip-${maxCount}`;

          for (let i = 1; i <= maxCount; i++) {
            const result = await checkRateLimitWithClient(redis, key, maxCount, windowSeconds);
            expect(result.allowed).toBe(true);
            // remaining decreases: after i-th request, remaining = maxCount - i
            expect(result.remaining).toBe(maxCount - i);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Property: Subsequent requests after block are also blocked
  // Validates: Requirements 3.9, 12.6
  // -------------------------------------------------------------------------

  it('tiếp tục chặn các request sau khi đã vượt ngưỡng', async () => {
    /**
     * **Validates: Requirements 3.9, 12.6**
     * Sau khi bị chặn, mọi request tiếp theo trong cùng cửa sổ thời gian
     * cũng phải bị chặn (allowed = false).
     */
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        async (maxCount, extraRequests) => {
          const redis = createMockRedis();
          const key = `form:overflow-test-${maxCount}`;
          const windowSeconds = 3600;

          // Exhaust the limit
          for (let i = 0; i < maxCount; i++) {
            await checkRateLimitWithClient(redis, key, maxCount, windowSeconds);
          }

          // All extra requests must be blocked
          for (let i = 0; i < extraRequests; i++) {
            const result = await checkRateLimitWithClient(redis, key, maxCount, windowSeconds);
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Property: Different keys are independent (no cross-contamination)
  // Validates: Requirements 3.9, 12.6
  // -------------------------------------------------------------------------

  it('các key khác nhau hoạt động độc lập', async () => {
    /**
     * **Validates: Requirements 3.9, 12.6**
     * Rate limit của một IP không ảnh hưởng đến IP khác.
     * Sau khi IP A bị chặn, IP B vẫn phải được cho phép.
     */
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (maxCount) => {
          const redis = createMockRedis();
          const keyA = 'form:ip-A';
          const keyB = 'form:ip-B';
          const windowSeconds = 3600;

          // Exhaust limit for key A
          for (let i = 0; i < maxCount; i++) {
            await checkRateLimitWithClient(redis, keyA, maxCount, windowSeconds);
          }
          const blockedA = await checkRateLimitWithClient(redis, keyA, maxCount, windowSeconds);
          expect(blockedA.allowed).toBe(false);

          // Key B should still be allowed (first request)
          const allowedB = await checkRateLimitWithClient(redis, keyB, maxCount, windowSeconds);
          expect(allowedB.allowed).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
