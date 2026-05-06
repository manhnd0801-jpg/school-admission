/**
 * BullMQ Worker: lead-submission
 *
 * Processes lead submission jobs from the 'lead-submission' queue.
 * This worker runs as a separate Node.js process (not inside Next.js API Routes).
 *
 * Job flow:
 *   1. Receive job with RegistrationFormData + sourceIp
 *   2. Duplicate check (same phone within 24h)
 *   3. INSERT lead into DB with status NEW
 *   4. Send email notification via notifyTeam
 *
 * Requirements: 13.5
 *
 * Usage:
 *   node src/workers/lead-submission.worker.ts
 *   # or via npm script:
 *   npm run worker
 */

import { Worker, type Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { notifyTeam } from '../lib/email';
import type { LeadSubmissionJobData } from '../lib/queue';

const prisma = new PrismaClient();

/**
 * Redis connection options for BullMQ worker.
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
 * Processes a single lead submission job.
 * Performs duplicate check and inserts lead into DB, then sends email notification.
 */
async function processLeadSubmission(job: Job<LeadSubmissionJobData>): Promise<void> {
  const { formData, sourceIp } = job.data;

  console.log(`[Worker lead-submission] Processing job ${job.id} for phone: ${formData.phone}`);

  // Duplicate check + insert in transaction
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.lead.findFirst({
      where: {
        phone: formData.phone,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existing) {
      console.log(`[Worker lead-submission] Duplicate lead for phone ${formData.phone}, skipping insert`);
      return { duplicate: true, lead: existing };
    }

    const newLead = await tx.lead.create({
      data: {
        parentName: formData.parentName,
        phone: formData.phone,
        email: formData.email ?? null,
        studentName: formData.studentName,
        expectedYear: formData.expectedYear,
        note: formData.note ?? null,
        privacyConsent: formData.privacyConsent,
        sourceIp,
        // status defaults to NEW per Prisma schema
      },
    });

    return { duplicate: false, lead: newLead };
  });

  if (!result.duplicate) {
    // Send email notification after successful insert
    await notifyTeam({
      parentName: result.lead.parentName,
      phone: result.lead.phone,
      email: result.lead.email ?? undefined,
      studentName: result.lead.studentName,
      expectedYear: result.lead.expectedYear,
      note: result.lead.note ?? undefined,
    });

    console.log(`[Worker lead-submission] Lead created: ${result.lead.id}`);
  }
}

// Create the worker
const worker = new Worker<LeadSubmissionJobData>(
  'lead-submission',
  processLeadSubmission,
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

worker.on('completed', (job) => {
  console.log(`[Worker lead-submission] Job ${job.id} completed`);
});

worker.on('failed', (job, error) => {
  console.error(`[Worker lead-submission] Job ${job?.id} failed:`, error);
});

worker.on('error', (error) => {
  console.error('[Worker lead-submission] Worker error:', error);
});

console.log('[Worker lead-submission] Worker started, waiting for jobs...');

// Graceful shutdown
async function shutdown() {
  console.log('[Worker lead-submission] Shutting down gracefully...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { worker };
