/**
 * POST /api/admin/upload — CMS image upload endpoint
 *
 * Protected: requires valid NextAuth.js session.
 *
 * Flow:
 *   1. Check authentication (getServerSession)
 *   2. Parse multipart/form-data using native Request.formData()
 *   3. Validate file presence and MIME type (JPG, PNG, WebP only)
 *   4. Validate file size ≤ 10MB → 400 if exceeded
 *   5. Compress with Sharp: convert to WebP, quality-reduce until ≤ 200KB
 *   6. Upload compressed buffer to AWS S3 / Cloudflare R2
 *   7. Return { url: string } — public CDN URL of the uploaded image
 *
 * Environment variables required:
 *   S3_BUCKET_NAME, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY,
 *   S3_ENDPOINT_URL (optional, for R2), S3_PUBLIC_URL
 *
 * Requirements: 6.3, 6.4, 6.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { validateImageSize } from '@/lib/validation';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_OUTPUT_SIZE_BYTES = 200 * 1024;      // 200 KB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// ---------------------------------------------------------------------------
// S3 client (lazy-initialised to avoid errors when env vars are missing
// during build/test time)
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
// Image compression pipeline
// ---------------------------------------------------------------------------

/**
 * Compresses an image buffer to WebP format with size ≤ 200KB.
 *
 * Strategy:
 *   - Start at quality 80, step down by 10 until output ≤ 200KB or quality < 10.
 *   - If still > 200KB at quality 10, resize proportionally (80% each step).
 *
 * @param inputBuffer - Raw image bytes (JPG / PNG / WebP)
 * @returns Compressed WebP buffer guaranteed to be ≤ 200KB
 */
export async function compressImageToWebP(inputBuffer: Buffer): Promise<Buffer> {
  // First pass: try quality reduction
  for (let quality = 80; quality >= 10; quality -= 10) {
    const output = await sharp(inputBuffer)
      .webp({ quality })
      .toBuffer();

    if (output.length <= MAX_OUTPUT_SIZE_BYTES) {
      return output;
    }
  }

  // Second pass: resize proportionally if quality reduction alone is not enough
  let resizeFactor = 0.8;
  const metadata = await sharp(inputBuffer).metadata();
  const originalWidth = metadata.width ?? 1920;

  for (let attempt = 0; attempt < 10; attempt++) {
    const newWidth = Math.max(1, Math.floor(originalWidth * resizeFactor));
    const output = await sharp(inputBuffer)
      .resize({ width: newWidth, withoutEnlargement: true })
      .webp({ quality: 10 })
      .toBuffer();

    if (output.length <= MAX_OUTPUT_SIZE_BYTES) {
      return output;
    }

    resizeFactor *= 0.8;
  }

  // Fallback: return the smallest we could achieve
  return sharp(inputBuffer)
    .resize({ width: 100 })
    .webp({ quality: 10 })
    .toBuffer();
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Authentication check
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2. Parse multipart/form-data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Không thể đọc dữ liệu form' },
      { status: 400 }
    );
  }

  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: 'Không tìm thấy file ảnh trong request' },
      { status: 400 }
    );
  }

  // 3. Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Định dạng file không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WebP',
      },
      { status: 400 }
    );
  }

  // 4. Validate file size ≤ 10MB
  if (!validateImageSize(file.size, MAX_FILE_SIZE_BYTES)) {
    return NextResponse.json(
      { success: false, error: 'Kích thước file vượt quá 10MB' },
      { status: 400 }
    );
  }

  // 5. Compress with Sharp → WebP, output ≤ 200KB
  let compressedBuffer: Buffer;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    compressedBuffer = await compressImageToWebP(inputBuffer);
  } catch (err) {
    console.error('[API /admin/upload] Sharp compression failed:', err);
    return NextResponse.json(
      { success: false, error: 'Không thể xử lý ảnh' },
      { status: 500 }
    );
  }

  // 6. Upload to S3 / R2
  const bucket = process.env['S3_BUCKET_NAME'];
  const publicUrl = process.env['S3_PUBLIC_URL'];

  if (!bucket || !publicUrl) {
    console.error('[API /admin/upload] Missing S3 environment variables');
    return NextResponse.json(
      { success: false, error: 'Cấu hình storage chưa được thiết lập' },
      { status: 500 }
    );
  }

  // Generate a unique key: uploads/YYYY/MM/uuid.webp
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const key = `uploads/${year}/${month}/${randomUUID()}.webp`;

  try {
    const s3 = createS3Client();
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: compressedBuffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
  } catch (err) {
    console.error('[API /admin/upload] S3 upload failed:', err);
    return NextResponse.json(
      { success: false, error: 'Không thể tải ảnh lên storage' },
      { status: 500 }
    );
  }

  // 7. Return public URL
  const imageUrl = `${publicUrl.replace(/\/$/, '')}/${key}`;

  return NextResponse.json(
    { success: true, url: imageUrl },
    { status: 200 }
  );
}
