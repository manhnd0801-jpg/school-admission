/**
 * Property-based tests for image compression pipeline
 *
 * Property 9: Nén ảnh đảm bảo output ≤ 200KB
 *   Validates: Requirements 6.5
 *
 * Strategy:
 *   - Use Sharp to generate synthetic solid-color images of various dimensions
 *   - Use fc.record() to generate (width, height) pairs
 *   - Test that compressImageToWebP always produces output ≤ 200KB
 *   - Test that output is a valid WebP image (magic bytes: RIFF...WEBP)
 *
 * Note: Image generation with Sharp is slow, so numRuns is set to 20.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import sharp from 'sharp';
import { compressImageToWebP } from '@/app/api/admin/upload/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_OUTPUT_SIZE_BYTES = 200 * 1024; // 200 KB

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generates a synthetic solid-color PNG image buffer using Sharp.
 * This simulates a real image input without needing actual image files.
 *
 * @param width  - Image width in pixels
 * @param height - Image height in pixels
 * @param r      - Red channel (0–255)
 * @param g      - Green channel (0–255)
 * @param b      - Blue channel (0–255)
 * @returns PNG buffer
 */
async function generateSyntheticImage(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number
): Promise<Buffer> {
  // Create a raw RGB buffer filled with the given color
  const channels = 3;
  const rawData = Buffer.alloc(width * height * channels);
  for (let i = 0; i < width * height; i++) {
    rawData[i * channels] = r;
    rawData[i * channels + 1] = g;
    rawData[i * channels + 2] = b;
  }

  return sharp(rawData, {
    raw: { width, height, channels },
  })
    .png()
    .toBuffer();
}

/**
 * Checks whether a buffer is a valid WebP image by inspecting magic bytes.
 *
 * WebP format:
 *   - Bytes 0–3: "RIFF" (0x52 0x49 0x46 0x46)
 *   - Bytes 4–7: file size (little-endian, ignored here)
 *   - Bytes 8–11: "WEBP" (0x57 0x45 0x42 0x50)
 *
 * @param buffer - Buffer to check
 * @returns true if the buffer starts with RIFF...WEBP magic bytes
 */
function isValidWebP(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  const riff = buffer.toString('ascii', 0, 4);
  const webp = buffer.toString('ascii', 8, 12);

  return riff === 'RIFF' && webp === 'WEBP';
}

// ---------------------------------------------------------------------------
// Arbitraries (generators)
// ---------------------------------------------------------------------------

/**
 * Generates image dimensions for small images (≤ 200×200).
 * These are fast to generate and compress easily.
 */
const smallImageDimensionsArb = fc.record({
  width: fc.integer({ min: 1, max: 200 }),
  height: fc.integer({ min: 1, max: 200 }),
  r: fc.integer({ min: 0, max: 255 }),
  g: fc.integer({ min: 0, max: 255 }),
  b: fc.integer({ min: 0, max: 255 }),
});

/**
 * Generates image dimensions for medium images (201×201 to 800×800).
 * These represent typical web images that may need compression.
 */
const mediumImageDimensionsArb = fc.record({
  width: fc.integer({ min: 201, max: 800 }),
  height: fc.integer({ min: 201, max: 800 }),
  r: fc.integer({ min: 0, max: 255 }),
  g: fc.integer({ min: 0, max: 255 }),
  b: fc.integer({ min: 0, max: 255 }),
});

/**
 * Generates image dimensions for large images (801×801 to 2000×2000).
 * These represent high-resolution images that definitely need compression.
 */
const largeImageDimensionsArb = fc.record({
  width: fc.integer({ min: 801, max: 2000 }),
  height: fc.integer({ min: 801, max: 2000 }),
  r: fc.integer({ min: 0, max: 255 }),
  g: fc.integer({ min: 0, max: 255 }),
  b: fc.integer({ min: 0, max: 255 }),
});

// ---------------------------------------------------------------------------
// Property 9 — compressImageToWebP
// Validates: Requirements 6.5
// ---------------------------------------------------------------------------

describe('Property 9: Nén ảnh đảm bảo output ≤ 200KB', () => {
  // -------------------------------------------------------------------------
  // Small images: output ≤ 200KB
  // -------------------------------------------------------------------------

  it('ảnh nhỏ (≤ 200×200): output luôn ≤ 200KB và là WebP hợp lệ', async () => {
    /**
     * **Validates: Requirements 6.5**
     * Với bất kỳ ảnh nhỏ nào (kích thước ≤ 200×200 pixels),
     * compressImageToWebP phải trả về buffer ≤ 200KB và là WebP hợp lệ.
     */
    await fc.assert(
      fc.asyncProperty(smallImageDimensionsArb, async ({ width, height, r, g, b }) => {
        const inputBuffer = await generateSyntheticImage(width, height, r, g, b);
        const outputBuffer = await compressImageToWebP(inputBuffer);

        expect(outputBuffer.length).toBeLessThanOrEqual(MAX_OUTPUT_SIZE_BYTES);
        expect(isValidWebP(outputBuffer)).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  // -------------------------------------------------------------------------
  // Medium images: output ≤ 200KB
  // -------------------------------------------------------------------------

  it('ảnh trung bình (201–800px): output luôn ≤ 200KB và là WebP hợp lệ', async () => {
    /**
     * **Validates: Requirements 6.5**
     * Với bất kỳ ảnh trung bình nào (kích thước 201–800 pixels),
     * compressImageToWebP phải trả về buffer ≤ 200KB và là WebP hợp lệ.
     */
    await fc.assert(
      fc.asyncProperty(mediumImageDimensionsArb, async ({ width, height, r, g, b }) => {
        const inputBuffer = await generateSyntheticImage(width, height, r, g, b);
        const outputBuffer = await compressImageToWebP(inputBuffer);

        expect(outputBuffer.length).toBeLessThanOrEqual(MAX_OUTPUT_SIZE_BYTES);
        expect(isValidWebP(outputBuffer)).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  // -------------------------------------------------------------------------
  // Large images: output ≤ 200KB (requires resize)
  // -------------------------------------------------------------------------

  it('ảnh lớn (801–2000px): output luôn ≤ 200KB và là WebP hợp lệ', async () => {
    /**
     * **Validates: Requirements 6.5**
     * Với bất kỳ ảnh lớn nào (kích thước 801–2000 pixels),
     * compressImageToWebP phải trả về buffer ≤ 200KB và là WebP hợp lệ.
     * Điều này kiểm tra cả nhánh resize trong pipeline nén.
     */
    await fc.assert(
      fc.asyncProperty(largeImageDimensionsArb, async ({ width, height, r, g, b }) => {
        const inputBuffer = await generateSyntheticImage(width, height, r, g, b);
        const outputBuffer = await compressImageToWebP(inputBuffer);

        expect(outputBuffer.length).toBeLessThanOrEqual(MAX_OUTPUT_SIZE_BYTES);
        expect(isValidWebP(outputBuffer)).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  // -------------------------------------------------------------------------
  // Output is always a non-empty buffer
  // -------------------------------------------------------------------------

  it('output luôn là buffer không rỗng', async () => {
    /**
     * **Validates: Requirements 6.5**
     * compressImageToWebP không bao giờ trả về buffer rỗng.
     */
    await fc.assert(
      fc.asyncProperty(smallImageDimensionsArb, async ({ width, height, r, g, b }) => {
        const inputBuffer = await generateSyntheticImage(width, height, r, g, b);
        const outputBuffer = await compressImageToWebP(inputBuffer);

        expect(outputBuffer.length).toBeGreaterThan(0);
      }),
      { numRuns: 20 }
    );
  });

  // -------------------------------------------------------------------------
  // Concrete examples: specific known image sizes
  // -------------------------------------------------------------------------

  it('xác nhận các kích thước ảnh cụ thể: 1920×1080, 800×600, 400×300', async () => {
    /**
     * **Validates: Requirements 6.5**
     * Kiểm tra các kích thước ảnh phổ biến thực tế.
     */
    const testCases = [
      { width: 1920, height: 1080, r: 255, g: 0, b: 0 },   // Full HD red
      { width: 800, height: 600, r: 0, g: 255, b: 0 },      // SVGA green
      { width: 400, height: 300, r: 0, g: 0, b: 255 },      // Small blue
      { width: 1280, height: 720, r: 128, g: 128, b: 128 }, // HD gray
    ];

    for (const { width, height, r, g, b } of testCases) {
      const inputBuffer = await generateSyntheticImage(width, height, r, g, b);
      const outputBuffer = await compressImageToWebP(inputBuffer);

      expect(outputBuffer.length).toBeLessThanOrEqual(MAX_OUTPUT_SIZE_BYTES);
      expect(isValidWebP(outputBuffer)).toBe(true);
    }
  });
});
