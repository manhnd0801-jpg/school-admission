/**
 * BullMQ Queue instances
 *
 * Provides queue instances for background job processing.
 * The lead-submission queue is used as a fallback when the DB is unavailable.
 *
 * Requirements: 13.5
 */

import { Queue } from 'bullmq';
import type { RegistrationFormData } from '@/types';

/**
 * Job data for the lead-submission queue.
 */
export interface LeadSubmissionJobData {
  formData: RegistrationFormData;
  sourceIp: string;
}

/**
 * Redis connection options for BullMQ.
 * BullMQ requires its own connection (separate from ioredis singleton).
 */
const redisConnection = {
  host: (() => {
    const url = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
    try {
      return new URL(url).hostname;
    } catch {
      return 'localhost';
    }
  })(),
  port: (() => {
    const url = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
    try {
      return parseInt(new URL(url).port || '6379', 10);
    } catch {
      return 6379;
    }
  })(),
};

/**
 * BullMQ Queue for lead submission fallback.
 * Used when the DB is temporarily unavailable.
 * The worker (src/workers/lead-submission.worker.ts) processes jobs from this queue.
 */
export const leadSubmissionQueue = new Queue<LeadSubmissionJobData>('lead-submission', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
