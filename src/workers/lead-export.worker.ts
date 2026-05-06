/**
 * BullMQ Worker: lead-export
 *
 * Processes async lead export jobs from the 'lead-export' queue.
 * This worker runs as a separate Node.js process (not inside Next.js API Routes).
 *
 * Job flow:
 *   1. Receive job with filters + exportedById
 *   2. Fetch all matching leads from DB (no pagination limit)
 *   3. Generate Excel (.xlsx) using ExcelJS
 *   4. Upload Excel file to AWS S3 / Cloudflare R2
 *   5. Create ExportLog record in DB
 *   6. Store { s3Key } in job returnvalue (API route generates presigned URL on demand)
 *
 * Requirements: 10.9, 10.10
 *
 * Usage:
 *   node src/workers/lead-export.worker.ts
 *   # or via npm script:
 *   npm run worker
 */

import { Worker, type Job } from 'bullmq';
import { PrismaClient, type LeadStatus } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { buildExcelBuffer, type LeadExportJobData } from '../app/api/admin/leads/export/route';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Redis connection
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// S3 client
// ---------------------------------------------------------------------------

function createS3Client(): S3Client {
  const region = process.env['S3_REGION'] ?? 'ap-southeast-1';
  const endpoint = process.env['S3_ENDPOINT_URL'] || undefined;

  return new S3Client({
    region,
    credentials: {
      accessKeyId: process.env['S3_ACCESS_KEY_ID'] ?? '',
      secretAccessKey: process.env['S3_SECRET_ACCESS_KEY'] ?? '',
    },
    ...(endpoint ? { endpoint, forcePathStyle: false } : {}),
  });
}

// ---------------------------------------------------------------------------
// Job processor
// ---------------------------------------------------------------------------

/**
 * Processes a single lead export job.
 *
 * @returns { s3Key } — the S3 object key where the Excel file was uploaded.
 *   The API route (/api/admin/leads/export/:jobId) generates a presigned URL
 *   from this key on demand.
 */
async function processLeadExport(job: Job<LeadExportJobData>): Promise<{ s3Key: string }> {
  const { filters, exportedById, exportedByName } = job.data;

  console.log(`[Worker lead-export] Processing job ${job.id} for user: ${exportedByName}`);

  // Build Prisma where clause from filters
  const where: Record<string, unknown> = {};

  if (filters.status) {
    where['status'] = filters.status as LeadStatus;
  }

  if (filters.expectedYear !== undefined) {
    where['expectedYear'] = filters.expectedYear;
  }

  if (filters.startDate || filters.endDate) {
    const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
    const endDate = filters.endDate ? (() => {
      const d = new Date(filters.endDate!);
      d.setHours(23, 59, 59, 999);
      return d;
    })() : undefined;

    where['createdAt'] = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }

  if (filters.search) {
    where['OR'] = [
      { parentName: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  // Fetch all matching leads (no pagination limit for export)
  await job.updateProgress(10);

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      parentName: true,
      phone: true,
      email: true,
      studentName: true,
      expectedYear: true,
      note: true,
      status: true,
      privacyConsent: true,
      sourceIp: true,
      createdAt: true,
      updatedAt: true,
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  console.log(`[Worker lead-export] Fetched ${leads.length} leads for job ${job.id}`);
  await job.updateProgress(40);

  // Generate Excel buffer
  const buffer = await buildExcelBuffer(leads);
  await job.updateProgress(70);

  // Upload to S3
  const bucket = process.env['S3_BUCKET_NAME'];
  if (!bucket) {
    throw new Error('S3_BUCKET_NAME environment variable is not set');
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const s3Key = `exports/leads/${timestamp}-${randomUUID()}.xlsx`;

  const s3 = createS3Client();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: buffer,
      ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ContentDisposition: `attachment; filename="leads-export-${timestamp}.xlsx"`,
      // Exports are private — access via presigned URL only
    })
  );

  console.log(`[Worker lead-export] Uploaded to S3: ${s3Key}`);
  await job.updateProgress(90);

  // Create ExportLog record
  if (exportedById) {
    try {
      await prisma.exportLog.create({
        data: {
          exportedById,
          recordCount: leads.length,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          filters: Object.keys(filters).length > 0 ? (filters as any) : undefined,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: exportedById,
          action: 'LEAD_EXPORT',
          resource: 'Lead',
          metadata: {
            count: leads.length,
            filters,
            s3Key,
            jobId: job.id,
          },
        },
      });
    } catch (logErr) {
      // Never fail the job because of logging errors
      console.error(`[Worker lead-export] Failed to write ExportLog for job ${job.id}:`, logErr);
    }
  }

  await job.updateProgress(100);
  console.log(`[Worker lead-export] Job ${job.id} completed. S3 key: ${s3Key}`);

  return { s3Key };
}

// ---------------------------------------------------------------------------
// Worker instance
// ---------------------------------------------------------------------------

const worker = new Worker<LeadExportJobData, { s3Key: string }>(
  'lead-export',
  processLeadExport,
  {
    connection: redisConnection,
    concurrency: 2, // limit concurrent exports to avoid memory pressure
  }
);

worker.on('completed', (job, result) => {
  console.log(`[Worker lead-export] Job ${job.id} completed. S3 key: ${result.s3Key}`);
});

worker.on('failed', (job, error) => {
  console.error(`[Worker lead-export] Job ${job?.id} failed:`, error.message);
});

worker.on('error', (error) => {
  console.error('[Worker lead-export] Worker error:', error);
});

console.log('[Worker lead-export] Worker started, waiting for jobs...');

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

async function shutdown() {
  console.log('[Worker lead-export] Shutting down gracefully...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { worker };
