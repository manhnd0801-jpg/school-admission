/**
 * Redis client singleton using ioredis
 *
 * Provides a single shared Redis connection for the application.
 * Used for rate limiting, BullMQ queue, and other caching needs.
 */

import Redis from 'ioredis';

// Singleton instance
let redisInstance: Redis | null = null;

/**
 * Returns the shared Redis client instance.
 * Creates a new connection on first call.
 */
export function getRedis(): Redis {
  if (!redisInstance) {
    const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
    redisInstance = new Redis(redisUrl, {
      // Reconnect on connection loss
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redisInstance.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });

    redisInstance.on('connect', () => {
      if (process.env['NODE_ENV'] !== 'test') {
        console.log('[Redis] Connected');
      }
    });
  }

  return redisInstance;
}

/**
 * The shared Redis client instance.
 * Import this directly for convenience.
 */
export const redis = getRedis();
