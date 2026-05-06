/**
 * BullMQ Worker: scheduled-publish
 *
 * Polls every minute for Articles with `scheduledAt <= now()` and `status = DRAFT`,
 * then publishes them by updating `status = PUBLISHED` and `publishedAt = now()`.
 *
 * This worker runs as a separate Node.js process (NOT inside Next.js API Routes).
 * It does NOT call revalidatePath directly (that only works inside Next.js context).
 * Instead, it relies on the ISR 60-second revalidation interval on /tin-tuc pages.
 *
 * Job flow:
 *   1. Repeatable job triggers every 60 seconds
 *   2. Query DB for Articles WHERE scheduledAt <= now() AND status = DRAFT
 *   3. For each article: UPDATE status = PUBLISHED, publishedAt = now()
 *   4. Log results
 *
 * Requirements: 7.6
 *
 * Usage:
 *   node src/workers/scheduled-publish.worker.ts
 *   # or via npm script:
 *   npm run worker
 */

import { Worker, Queue, type Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Queue name for scheduled publish jobs.
 */
const QUEUE_NAME = 'scheduled-publish';

/**
 * Repeatable job name.
 */
const JOB_NAME = 'poll-scheduled-articles';

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
 * Processes the scheduled-publish poll job.
 * Finds all DRAFT articles whose scheduledAt <= now() and publishes them.
 */
async function processScheduledPublish(_job: Job): Promise<void> {
  const now = new Date();

  console.log(`[Worker scheduled-publish] Polling for scheduled articles at ${now.toISOString()}`);

  // Find all DRAFT articles that are due for publishing
  const dueArticles = await prisma.article.findMany({
    where: {
      status: 'DRAFT',
      scheduledAt: {
        lte: now,
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      scheduledAt: true,
    },
  });

  if (dueArticles.length === 0) {
    console.log('[Worker scheduled-publish] No scheduled articles due for publishing.');
    return;
  }

  console.log(`[Worker scheduled-publish] Found ${dueArticles.length} article(s) to publish.`);

  let publishedCount = 0;
  let failedCount = 0;

  for (const article of dueArticles) {
    try {
      await prisma.article.update({
        where: { id: article.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: now,
        },
      });

      publishedCount++;
      console.log(
        `[Worker scheduled-publish] Published article: "${article.title}" (slug: ${article.slug}, scheduledAt: ${article.scheduledAt?.toISOString()})`
      );

      // NOTE: revalidatePath('/tin-tuc') and revalidatePath('/tin-tuc/' + article.slug)
      // cannot be called here because this worker runs outside Next.js context.
      // The ISR revalidation interval (60 seconds) on /tin-tuc pages will pick up
      // the newly published article automatically.
    } catch (error) {
      failedCount++;
      console.error(
        `[Worker scheduled-publish] Failed to publish article "${article.title}" (id: ${article.id}):`,
        error
      );
      // Continue processing remaining articles — do not crash the worker
    }
  }

  console.log(
    `[Worker scheduled-publish] Poll complete. Published: ${publishedCount}, Failed: ${failedCount}`
  );
}

// Create the queue to register the repeatable job
const scheduledPublishQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
});

// Create the worker
const worker = new Worker(QUEUE_NAME, processScheduledPublish, {
  connection: redisConnection,
  concurrency: 1, // Only one poll at a time to avoid duplicate publishes
});

worker.on('completed', (job) => {
  console.log(`[Worker scheduled-publish] Job ${job.id} completed`);
});

worker.on('failed', (job, error) => {
  console.error(`[Worker scheduled-publish] Job ${job?.id} failed:`, error);
});

worker.on('error', (error) => {
  console.error('[Worker scheduled-publish] Worker error:', error);
});

/**
 * Register the repeatable job that polls every 60 seconds.
 * BullMQ deduplicates repeatable jobs by name+pattern, so this is safe to call on startup.
 */
async function registerRepeatableJob(): Promise<void> {
  await scheduledPublishQueue.add(
    JOB_NAME,
    {}, // No job data needed — the processor queries the DB directly
    {
      repeat: {
        every: 60_000, // every 60 seconds
      },
      jobId: JOB_NAME, // Stable jobId prevents duplicate registrations
    }
  );

  console.log('[Worker scheduled-publish] Repeatable job registered (every 60 seconds).');
}

registerRepeatableJob().catch((error) => {
  console.error('[Worker scheduled-publish] Failed to register repeatable job:', error);
});

console.log('[Worker scheduled-publish] Worker started, waiting for jobs...');

// Graceful shutdown
async function shutdown() {
  console.log('[Worker scheduled-publish] Shutting down gracefully...');
  await worker.close();
  await scheduledPublishQueue.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { worker, scheduledPublishQueue };
