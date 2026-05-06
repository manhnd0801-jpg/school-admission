/**
 * GET /api/admin/leads/export/:jobId — Poll async export job status
 *
 * Returns:
 *   - { status: 'waiting' | 'active' | 'delayed' }  while job is in progress
 *   - { status: 'completed', url: string }           when done (presigned S3 URL, 1 hour TTL)
 *   - { status: 'failed', error: string }            if job failed
 *   - 404 if jobId not found
 *
 * Requirements: 10.9, 10.10
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Queue } from 'bullmq';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { authOptions } from '@/lib/auth';
import type { LeadExportJobData } from '../route';

// ---------------------------------------------------------------------------
// BullMQ queue (read-only — we only inspect jobs here)
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

let leadExportQueue: Queue<LeadExportJobData> | null = null;

function getLeadExportQueue(): Queue<LeadExportJobData> {
  if (!leadExportQueue) {
    leadExportQueue = new Queue<LeadExportJobData>('lead-export', {
      connection: redisConnection,
    });
  }
  return leadExportQueue;
}

// ---------------------------------------------------------------------------
// S3 presigned URL helper
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

/**
 * Generates a presigned GET URL for an S3 object, valid for 1 hour.
 */
async function getPresignedUrl(s3Key: string): Promise<string> {
  const bucket = process.env['S3_BUCKET_NAME'] ?? '';
  const s3 = createS3Client();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key,
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
): Promise<NextResponse> {
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = params;

  if (!jobId) {
    return NextResponse.json({ success: false, error: 'jobId là bắt buộc' }, { status: 400 });
  }

  try {
    const queue = getLeadExportQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy job export' },
        { status: 404 }
      );
    }

    const state = await job.getState();

    // Job is still in progress
    if (state === 'waiting' || state === 'active' || state === 'delayed' || state === 'prioritized') {
      return NextResponse.json(
        { success: true, status: state },
        { status: 200 }
      );
    }

    // Job failed
    if (state === 'failed') {
      return NextResponse.json(
        {
          success: false,
          status: 'failed',
          error: job.failedReason ?? 'Export thất bại',
        },
        { status: 200 }
      );
    }

    // Job completed — return presigned S3 URL
    if (state === 'completed') {
      const returnValue = job.returnvalue as { s3Key?: string; url?: string } | undefined;

      // Worker stores the S3 key in returnvalue.s3Key
      if (returnValue?.s3Key) {
        try {
          const presignedUrl = await getPresignedUrl(returnValue.s3Key);
          return NextResponse.json(
            { success: true, status: 'completed', url: presignedUrl },
            { status: 200 }
          );
        } catch (err) {
          console.error('[API GET /admin/leads/export/:jobId] Failed to generate presigned URL:', err);
          return NextResponse.json(
            { success: false, error: 'Không thể tạo link tải xuống' },
            { status: 500 }
          );
        }
      }

      // Fallback: worker stored a direct URL
      if (returnValue?.url) {
        return NextResponse.json(
          { success: true, status: 'completed', url: returnValue.url },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Kết quả export không hợp lệ' },
        { status: 500 }
      );
    }

    // Unknown state
    return NextResponse.json(
      { success: true, status: state },
      { status: 200 }
    );
  } catch (err) {
    console.error('[API GET /admin/leads/export/:jobId] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    );
  }
}
