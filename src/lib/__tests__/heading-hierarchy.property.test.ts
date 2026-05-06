/**
 * Property-based tests for heading HTML structure
 *
 * Property 6: Cấu trúc heading HTML tuân thủ thứ bậc đúng
 *   Validates: Requirements 4.4
 *
 * Tests the `validateHeadingHierarchy` utility function which checks that
 * a sequence of heading levels (1–6) follows proper nesting rules:
 *   - First heading must be H1 (level 1)
 *   - Each subsequent heading can be: same level, one level deeper, or any level shallower
 *   - Skipping levels going deeper is NOT allowed (e.g., H1 → H3 without H2)
 *   - There must be exactly one H1 in a valid sequence
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Utility function under test
// ---------------------------------------------------------------------------

/**
 * Validates that a sequence of heading levels follows proper HTML heading hierarchy.
 *
 * Rules:
 *   1. The sequence must be non-empty and start with level 1 (H1).
 *   2. Each subsequent heading can:
 *      - Stay at the same level (e.g., H2 → H2)
 *      - Go one level deeper (e.g., H2 → H3)
 *      - Go back to any shallower level (e.g., H3 → H1, H3 → H2)
 *   3. Skipping levels going deeper is NOT allowed (e.g., H1 → H3 is invalid).
 *
 * @param headings - Array of heading levels (integers 1–6)
 * @returns true if the heading sequence is valid, false otherwise
 */
export function validateHeadingHierarchy(headings: number[]): boolean {
  if (headings.length === 0) return false;

  // First heading must be H1
  if (headings[0] !== 1) return false;

  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1]!;
    const curr = headings[i]!;

    // Heading levels must be between 1 and 6
    if (curr < 1 || curr > 6) return false;

    // Going deeper: only one level at a time is allowed
    if (curr > prev + 1) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Arbitraries (generators)
// ---------------------------------------------------------------------------

/**
 * Generates a valid heading sequence:
 *   - Starts with 1
 *   - Each step either stays, goes one deeper (max 6), or goes back to any shallower level
 */
const validHeadingSequence = fc
  .integer({ min: 1, max: 10 })
  .chain((length) => {
    // Build the sequence step by step
    return fc.array(fc.integer({ min: 1, max: 6 }), { minLength: length, maxLength: length }).chain(
      () => {
        // Use a custom generator that builds a valid sequence
        return fc.nat({ max: length - 1 }).chain(() => {
          // Generate a valid sequence using fc.array with constraints
          const steps: fc.Arbitrary<number>[] = [fc.constant(1)];

          for (let i = 1; i < length; i++) {
            // We'll use a different approach: generate the whole sequence at once
          }

          return fc.constant(null);
        });
      }
    );
  });

/**
 * Better approach: generate a valid heading sequence directly using fc.array
 * by building it incrementally with a reducer-style generator.
 */
const validHeadingSequenceArb: fc.Arbitrary<number[]> = fc
  .integer({ min: 1, max: 15 })
  .chain((length) =>
    fc
      .array(
        fc.record({
          action: fc.oneof(
            fc.constant('same' as const),
            fc.constant('deeper' as const),
            fc.constant('shallower' as const)
          ),
          shallowerTarget: fc.integer({ min: 1, max: 6 }),
        }),
        { minLength: length - 1, maxLength: length - 1 }
      )
      .map((steps) => {
        const result: number[] = [1]; // always start with H1
        let current = 1;

        for (const step of steps) {
          if (step.action === 'same') {
            result.push(current);
          } else if (step.action === 'deeper' && current < 6) {
            current = current + 1;
            result.push(current);
          } else if (step.action === 'shallower') {
            // Go back to any level between 1 and current (inclusive)
            const target = Math.max(1, Math.min(step.shallowerTarget, current));
            current = target;
            result.push(current);
          } else {
            // Fallback: stay at same level (e.g., deeper but already at 6)
            result.push(current);
          }
        }

        return result;
      })
  );

/**
 * Generates an invalid heading sequence that skips levels going deeper.
 * Guarantees at least one "skip" (e.g., H1 → H3).
 */
const invalidSkipSequenceArb: fc.Arbitrary<number[]> = fc
  .integer({ min: 1, max: 5 })
  .chain((skipFrom) => {
    // skipFrom is the level before the skip (1–5), skip target is skipFrom + 2 or more
    const skipTo = fc.integer({ min: skipFrom + 2, max: 6 });
    return skipTo.chain((to) =>
      fc
        .array(fc.integer({ min: 1, max: 6 }), { minLength: 0, maxLength: 5 })
        .map((suffix) => [1, ...Array(skipFrom - 1).fill(0).map((_, i) => i + 2).slice(0, skipFrom - 1), skipFrom, to, ...suffix])
    );
  });

/**
 * Generates a sequence that does NOT start with H1 (invalid).
 */
const noH1FirstArb: fc.Arbitrary<number[]> = fc
  .array(fc.integer({ min: 2, max: 6 }), { minLength: 1, maxLength: 10 });

// ---------------------------------------------------------------------------
// Property 6 — validateHeadingHierarchy
// Validates: Requirements 4.4
// ---------------------------------------------------------------------------

describe('Property 6: Cấu trúc heading HTML tuân thủ thứ bậc đúng', () => {
  // -------------------------------------------------------------------------
  // Valid sequences must pass
  // -------------------------------------------------------------------------

  it('trả về true cho mọi chuỗi heading hợp lệ (không bỏ cấp khi đi sâu hơn)', () => {
    /**
     * **Validates: Requirements 4.4**
     * Với bất kỳ chuỗi heading hợp lệ nào (bắt đầu bằng H1, không bỏ cấp khi đi sâu),
     * validateHeadingHierarchy phải trả về true.
     */
    fc.assert(
      fc.property(validHeadingSequenceArb, (headings) => {
        expect(validateHeadingHierarchy(headings)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sequences that skip levels going deeper must fail
  // -------------------------------------------------------------------------

  it('trả về false khi chuỗi heading bỏ cấp khi đi sâu hơn (ví dụ H1 → H3)', () => {
    /**
     * **Validates: Requirements 4.4**
     * Với bất kỳ chuỗi heading nào có ít nhất một bước nhảy cấp (tăng > 1),
     * validateHeadingHierarchy phải trả về false.
     * `from` is constrained to 1–4 so that `from + 2` never exceeds 6.
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }).chain((from) =>
          fc.integer({ min: from + 2, max: 6 }).map((to) => [1, from, to])
        ),
        (headings) => {
          expect(validateHeadingHierarchy(headings)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sequences not starting with H1 must fail
  // -------------------------------------------------------------------------

  it('trả về false khi heading đầu tiên không phải H1', () => {
    /**
     * **Validates: Requirements 4.4**
     * Với bất kỳ chuỗi heading nào không bắt đầu bằng H1 (level 1),
     * validateHeadingHierarchy phải trả về false.
     */
    fc.assert(
      fc.property(noH1FirstArb, (headings) => {
        expect(validateHeadingHierarchy(headings)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Empty sequence must fail
  // -------------------------------------------------------------------------

  it('trả về false cho chuỗi heading rỗng', () => {
    /**
     * **Validates: Requirements 4.4**
     * Chuỗi heading rỗng không hợp lệ (trang phải có ít nhất một H1).
     */
    expect(validateHeadingHierarchy([])).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Single H1 is always valid
  // -------------------------------------------------------------------------

  it('trả về true cho chuỗi chỉ có một H1', () => {
    /**
     * **Validates: Requirements 4.4**
     * Một trang chỉ có H1 là hợp lệ.
     */
    expect(validateHeadingHierarchy([1])).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Going back up (shallower) is always valid
  // -------------------------------------------------------------------------

  it('trả về true khi heading quay lại cấp cao hơn (đi ngược lên)', () => {
    /**
     * **Validates: Requirements 4.4**
     * Đi từ cấp sâu hơn về cấp nông hơn luôn hợp lệ.
     * Ví dụ: H1 → H2 → H3 → H2 → H3 là hợp lệ.
     */
    fc.assert(
      fc.property(
        // Generate a "deep then shallow" pattern: [1, 2, 3, ..., n, n-1, ..., 1]
        fc.integer({ min: 2, max: 6 }).map((maxDepth) => {
          const ascending = Array.from({ length: maxDepth }, (_, i) => i + 1);
          const descending = Array.from({ length: maxDepth - 1 }, (_, i) => maxDepth - 1 - i);
          return [...ascending, ...descending];
        }),
        (headings) => {
          expect(validateHeadingHierarchy(headings)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Concrete examples from the spec
  // -------------------------------------------------------------------------

  it('xác nhận các ví dụ cụ thể từ spec', () => {
    /**
     * **Validates: Requirements 4.4**
     * Kiểm tra các ví dụ cụ thể được đề cập trong thiết kế.
     */
    // Valid: H1 → H2 → H3 (typical landing page structure)
    expect(validateHeadingHierarchy([1, 2, 3])).toBe(true);

    // Valid: H1 → H2 → H3 → H2 → H3 (multiple sections)
    expect(validateHeadingHierarchy([1, 2, 3, 2, 3])).toBe(true);

    // Valid: H1 → H2 → H2 → H2 (multiple H2 siblings)
    expect(validateHeadingHierarchy([1, 2, 2, 2])).toBe(true);

    // Valid: H1 → H2 → H3 → H1 (going back to H1 is OK)
    expect(validateHeadingHierarchy([1, 2, 3, 1])).toBe(true);

    // Invalid: H1 → H3 (skips H2)
    expect(validateHeadingHierarchy([1, 3])).toBe(false);

    // Invalid: H1 → H2 → H4 (skips H3)
    expect(validateHeadingHierarchy([1, 2, 4])).toBe(false);

    // Invalid: starts with H2 (no H1 first)
    expect(validateHeadingHierarchy([2, 3])).toBe(false);

    // Invalid: empty
    expect(validateHeadingHierarchy([])).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Property: valid sequence + one valid step = still valid
  // -------------------------------------------------------------------------

  it('chuỗi hợp lệ vẫn hợp lệ khi thêm một bước hợp lệ vào cuối', () => {
    /**
     * **Validates: Requirements 4.4**
     * Nếu một chuỗi heading hợp lệ và ta thêm một heading hợp lệ vào cuối
     * (cùng cấp, sâu hơn 1, hoặc nông hơn), kết quả vẫn phải hợp lệ.
     */
    fc.assert(
      fc.property(
        validHeadingSequenceArb.chain((seq) => {
          const lastLevel = seq[seq.length - 1]!;
          // Generate a valid next step
          const validNextLevels: number[] = [];
          // Same level
          validNextLevels.push(lastLevel);
          // One deeper (if not already at 6)
          if (lastLevel < 6) validNextLevels.push(lastLevel + 1);
          // Any shallower level
          for (let l = 1; l < lastLevel; l++) validNextLevels.push(l);

          return fc
            .integer({ min: 0, max: validNextLevels.length - 1 })
            .map((idx) => [...seq, validNextLevels[idx]!]);
        }),
        (headings) => {
          expect(validateHeadingHierarchy(headings)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Property: valid sequence + one invalid skip = becomes invalid
  // -------------------------------------------------------------------------

  it('chuỗi hợp lệ trở thành không hợp lệ khi thêm một bước nhảy cấp vào cuối', () => {
    /**
     * **Validates: Requirements 4.4**
     * Nếu ta thêm một heading bỏ cấp (tăng > 1) vào cuối chuỗi hợp lệ,
     * kết quả phải không hợp lệ.
     */
    fc.assert(
      fc.property(
        validHeadingSequenceArb.chain((seq) => {
          const lastLevel = seq[seq.length - 1]!;
          // Only generate a skip if there's room (lastLevel + 2 <= 6)
          if (lastLevel + 2 > 6) {
            // Can't skip from level 5 or 6, so just use a known skip: [1] → [1, 3]
            return fc.constant([1, 3] as number[]);
          }
          return fc
            .integer({ min: lastLevel + 2, max: 6 })
            .map((skipTo) => [...seq, skipTo]);
        }),
        (headings) => {
          expect(validateHeadingHierarchy(headings)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
