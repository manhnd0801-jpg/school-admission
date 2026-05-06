/**
 * Property-based tests for image size validation
 *
 * Property 8: Validation kích thước file ảnh tải lên
 *   Validates: Requirements 6.3, 6.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateImageSize } from '../validation';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB = 10_485_760 bytes

// ---------------------------------------------------------------------------
// Property 8 — validateImageSize
// Validates: Requirements 6.3, 6.4
// ---------------------------------------------------------------------------

describe('Property 8: validateImageSize — validation kích thước file ảnh tải lên', () => {
  it('chấp nhận mọi kích thước file ≤ 10MB', () => {
    /**
     * **Validates: Requirements 6.3, 6.4**
     * Với bất kỳ kích thước file nào từ 0 đến 10MB (bao gồm),
     * validateImageSize phải trả về true.
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MAX_FILE_SIZE_BYTES }),
        (size) => {
          expect(validateImageSize(size, MAX_FILE_SIZE_BYTES)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('từ chối mọi kích thước file > 10MB', () => {
    /**
     * **Validates: Requirements 6.3, 6.4**
     * Với bất kỳ kích thước file nào lớn hơn 10MB,
     * validateImageSize phải trả về false.
     */
    fc.assert(
      fc.property(
        fc.integer({ min: MAX_FILE_SIZE_BYTES + 1, max: MAX_FILE_SIZE_BYTES * 10 }),
        (size) => {
          expect(validateImageSize(size, MAX_FILE_SIZE_BYTES)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('chấp nhận đúng 10MB (boundary: kích thước tối đa cho phép)', () => {
    /**
     * **Validates: Requirements 6.3, 6.4**
     * Kích thước đúng bằng 10MB phải được chấp nhận (biên trên hợp lệ).
     */
    fc.assert(
      fc.property(
        fc.constant(MAX_FILE_SIZE_BYTES),
        (size) => {
          expect(validateImageSize(size, MAX_FILE_SIZE_BYTES)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('từ chối 10MB + 1 byte (boundary: vượt quá kích thước tối đa)', () => {
    /**
     * **Validates: Requirements 6.3, 6.4**
     * Kích thước 10MB + 1 byte phải bị từ chối (vượt biên trên).
     */
    fc.assert(
      fc.property(
        fc.constant(MAX_FILE_SIZE_BYTES + 1),
        (size) => {
          expect(validateImageSize(size, MAX_FILE_SIZE_BYTES)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
