/**
 * Property-based tests for image lazy loading
 *
 * Property 7: Tất cả ảnh ngoài viewport phải có lazy loading
 *   Validates: Requirements 4.6
 *
 * Tests the `validateImageLazyLoading` utility function which checks that
 * images outside the viewport (not above-the-fold) use lazy loading, while
 * above-the-fold images (like the hero) may use eager loading / priority.
 *
 * In Next.js, the <Image> component:
 *   - Uses `loading="lazy"` by default for non-priority images
 *   - Uses `priority={true}` (or `loading="eager"`) for above-the-fold images
 *
 * Validation rules:
 *   - isAboveFold=true  → any loading strategy is acceptable (eager/priority expected for LCP)
 *   - isAboveFold=false → MUST have loading="lazy" OR priority must be false/undefined
 *   - Violation: non-above-fold image has loading="eager" OR priority=true
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImageConfig {
  src: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  isAboveFold: boolean;
}

export interface ValidationResult {
  valid: boolean;
  violations: string[];
}

// ---------------------------------------------------------------------------
// Utility function under test
// ---------------------------------------------------------------------------

/**
 * Validates that images outside the viewport use lazy loading.
 *
 * Rules:
 *   - Above-the-fold images (isAboveFold=true) may use any loading strategy.
 *   - Non-above-fold images (isAboveFold=false) must NOT have loading="eager"
 *     or priority=true. A violation occurs when either condition is met.
 *
 * @param images - Array of image configurations
 * @returns ValidationResult with valid flag and list of violation messages
 */
export function validateImageLazyLoading(images: ImageConfig[]): ValidationResult {
  const violations: string[] = [];

  for (const image of images) {
    if (image.isAboveFold) {
      // Above-the-fold images are exempt — eager/priority is expected for LCP
      continue;
    }

    // Non-above-fold image must not use eager loading or priority
    if (image.loading === 'eager') {
      violations.push(
        `Image "${image.src}" is not above-the-fold but has loading="eager"`
      );
    }

    if (image.priority === true) {
      violations.push(
        `Image "${image.src}" is not above-the-fold but has priority=true`
      );
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

// ---------------------------------------------------------------------------
// Arbitraries (generators)
// ---------------------------------------------------------------------------

/** Generates a valid image src string (non-empty URL-like path) */
const srcArb = fc.stringMatching(/^\/[a-z0-9/_-]{1,30}\.(webp|jpg|png)$/);

/** Generates a valid above-the-fold image (any loading strategy allowed) */
const aboveFoldImageArb: fc.Arbitrary<ImageConfig> = fc.record({
  src: srcArb,
  loading: fc.option(fc.constantFrom('lazy' as const, 'eager' as const), { nil: undefined }),
  priority: fc.option(fc.boolean(), { nil: undefined }),
  isAboveFold: fc.constant(true),
});

/** Generates a valid below-the-fold image (must use lazy loading) */
const belowFoldLazyImageArb: fc.Arbitrary<ImageConfig> = fc.record({
  src: srcArb,
  // Valid: loading="lazy" or loading=undefined (defaults to lazy in Next.js)
  loading: fc.option(fc.constant('lazy' as const), { nil: undefined }),
  // Valid: priority=false or priority=undefined
  priority: fc.option(fc.constant(false), { nil: undefined }),
  isAboveFold: fc.constant(false),
});

/** Generates an invalid below-the-fold image with loading="eager" */
const belowFoldEagerImageArb: fc.Arbitrary<ImageConfig> = fc.record({
  src: srcArb,
  loading: fc.constant('eager' as const),
  priority: fc.option(fc.constant(false), { nil: undefined }),
  isAboveFold: fc.constant(false),
});

/** Generates an invalid below-the-fold image with priority=true */
const belowFoldPriorityImageArb: fc.Arbitrary<ImageConfig> = fc.record({
  src: srcArb,
  loading: fc.option(fc.constant('lazy' as const), { nil: undefined }),
  priority: fc.constant(true),
  isAboveFold: fc.constant(false),
});

/** Generates a valid image list (mix of above-fold and lazy below-fold) */
const validImageListArb: fc.Arbitrary<ImageConfig[]> = fc.array(
  fc.oneof(aboveFoldImageArb, belowFoldLazyImageArb),
  { minLength: 0, maxLength: 20 }
);

/** Generates an image list with at least one eager below-fold violation */
const listWithEagerViolationArb: fc.Arbitrary<ImageConfig[]> = fc
  .tuple(
    fc.array(fc.oneof(aboveFoldImageArb, belowFoldLazyImageArb), { minLength: 0, maxLength: 10 }),
    belowFoldEagerImageArb,
    fc.array(fc.oneof(aboveFoldImageArb, belowFoldLazyImageArb), { minLength: 0, maxLength: 10 })
  )
  .map(([before, violation, after]) => [...before, violation, ...after]);

/** Generates an image list with at least one priority=true below-fold violation */
const listWithPriorityViolationArb: fc.Arbitrary<ImageConfig[]> = fc
  .tuple(
    fc.array(fc.oneof(aboveFoldImageArb, belowFoldLazyImageArb), { minLength: 0, maxLength: 10 }),
    belowFoldPriorityImageArb,
    fc.array(fc.oneof(aboveFoldImageArb, belowFoldLazyImageArb), { minLength: 0, maxLength: 10 })
  )
  .map(([before, violation, after]) => [...before, violation, ...after]);

// ---------------------------------------------------------------------------
// Property 7 — validateImageLazyLoading
// Validates: Requirements 4.6
// ---------------------------------------------------------------------------

describe('Property 7: Tất cả ảnh ngoài viewport phải có lazy loading', () => {
  // -------------------------------------------------------------------------
  // Valid image lists must pass
  // -------------------------------------------------------------------------

  it('trả về valid=true khi tất cả ảnh ngoài viewport dùng lazy loading', () => {
    /**
     * **Validates: Requirements 4.6**
     * Với bất kỳ danh sách ảnh nào mà tất cả ảnh ngoài viewport đều dùng
     * lazy loading (hoặc không đặt loading attribute), validateImageLazyLoading
     * phải trả về { valid: true, violations: [] }.
     */
    fc.assert(
      fc.property(validImageListArb, (images) => {
        const result = validateImageLazyLoading(images);
        expect(result.valid).toBe(true);
        expect(result.violations).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Below-fold images with loading="eager" must fail
  // -------------------------------------------------------------------------

  it('trả về valid=false khi ảnh ngoài viewport có loading="eager"', () => {
    /**
     * **Validates: Requirements 4.6**
     * Với bất kỳ danh sách ảnh nào có ít nhất một ảnh ngoài viewport
     * với loading="eager", validateImageLazyLoading phải trả về valid=false
     * và violations phải chứa ít nhất một phần tử.
     */
    fc.assert(
      fc.property(listWithEagerViolationArb, (images) => {
        const result = validateImageLazyLoading(images);
        expect(result.valid).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Below-fold images with priority=true must fail
  // -------------------------------------------------------------------------

  it('trả về valid=false khi ảnh ngoài viewport có priority=true', () => {
    /**
     * **Validates: Requirements 4.6**
     * Với bất kỳ danh sách ảnh nào có ít nhất một ảnh ngoài viewport
     * với priority=true, validateImageLazyLoading phải trả về valid=false
     * và violations phải chứa ít nhất một phần tử.
     */
    fc.assert(
      fc.property(listWithPriorityViolationArb, (images) => {
        const result = validateImageLazyLoading(images);
        expect(result.valid).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Above-fold images are exempt from lazy loading requirement
  // -------------------------------------------------------------------------

  it('trả về valid=true khi ảnh above-the-fold dùng eager loading hoặc priority=true', () => {
    /**
     * **Validates: Requirements 4.6**
     * Ảnh hero (above-the-fold) được phép dùng eager loading hoặc priority=true
     * để tối ưu LCP. validateImageLazyLoading không được báo vi phạm cho các ảnh này.
     */
    fc.assert(
      fc.property(
        fc.array(aboveFoldImageArb, { minLength: 1, maxLength: 10 }),
        (images) => {
          const result = validateImageLazyLoading(images);
          expect(result.valid).toBe(true);
          expect(result.violations).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Violation count matches number of violating images
  // -------------------------------------------------------------------------

  it('số lượng violations khớp với số ảnh ngoài viewport vi phạm quy tắc', () => {
    /**
     * **Validates: Requirements 4.6**
     * Số lượng violations trong kết quả phải bằng tổng số ảnh ngoài viewport
     * có loading="eager" hoặc priority=true (mỗi vi phạm tạo một violation riêng).
     */
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            aboveFoldImageArb,
            belowFoldLazyImageArb,
            belowFoldEagerImageArb,
            belowFoldPriorityImageArb
          ),
          { minLength: 0, maxLength: 20 }
        ),
        (images) => {
          const result = validateImageLazyLoading(images);

          // Count expected violations manually
          let expectedViolations = 0;
          for (const img of images) {
            if (!img.isAboveFold) {
              if (img.loading === 'eager') expectedViolations++;
              if (img.priority === true) expectedViolations++;
            }
          }

          expect(result.violations).toHaveLength(expectedViolations);
          expect(result.valid).toBe(expectedViolations === 0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Empty image list is always valid
  // -------------------------------------------------------------------------

  it('trả về valid=true cho danh sách ảnh rỗng', () => {
    /**
     * **Validates: Requirements 4.6**
     * Danh sách ảnh rỗng không có vi phạm nào.
     */
    const result = validateImageLazyLoading([]);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Concrete examples matching the actual components
  // -------------------------------------------------------------------------

  it('xác nhận các ví dụ cụ thể từ components thực tế', () => {
    /**
     * **Validates: Requirements 4.6**
     * Kiểm tra các cấu hình ảnh thực tế từ HeroSection, FacilitySection, TeacherSection.
     */

    // HeroSection: priority=true, isAboveFold=true → valid
    const heroImage: ImageConfig = {
      src: '/images/hero-bg.webp',
      priority: true,
      isAboveFold: true,
    };
    expect(validateImageLazyLoading([heroImage]).valid).toBe(true);

    // FacilitySection: loading="lazy", isAboveFold=false → valid
    const facilityImage: ImageConfig = {
      src: '/images/facility-1.webp',
      loading: 'lazy',
      isAboveFold: false,
    };
    expect(validateImageLazyLoading([facilityImage]).valid).toBe(true);

    // TeacherSection: loading="lazy", isAboveFold=false → valid
    const teacherAvatar: ImageConfig = {
      src: '/images/teacher-1.webp',
      loading: 'lazy',
      isAboveFold: false,
    };
    expect(validateImageLazyLoading([teacherAvatar]).valid).toBe(true);

    // Invalid: below-fold image with eager loading
    const eagerBelowFold: ImageConfig = {
      src: '/images/facility-2.webp',
      loading: 'eager',
      isAboveFold: false,
    };
    const eagerResult = validateImageLazyLoading([eagerBelowFold]);
    expect(eagerResult.valid).toBe(false);
    expect(eagerResult.violations[0]).toContain('loading="eager"');

    // Invalid: below-fold image with priority=true
    const priorityBelowFold: ImageConfig = {
      src: '/images/teacher-2.webp',
      priority: true,
      isAboveFold: false,
    };
    const priorityResult = validateImageLazyLoading([priorityBelowFold]);
    expect(priorityResult.valid).toBe(false);
    expect(priorityResult.violations[0]).toContain('priority=true');

    // Mixed: hero (valid) + lazy facility (valid) + eager facility (invalid)
    const mixedResult = validateImageLazyLoading([heroImage, facilityImage, eagerBelowFold]);
    expect(mixedResult.valid).toBe(false);
    expect(mixedResult.violations).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // Adding a valid lazy image to a valid list keeps it valid
  // -------------------------------------------------------------------------

  it('thêm ảnh lazy hợp lệ vào danh sách hợp lệ vẫn cho kết quả hợp lệ', () => {
    /**
     * **Validates: Requirements 4.6**
     * Nếu danh sách ảnh hợp lệ và ta thêm một ảnh ngoài viewport với lazy loading,
     * kết quả vẫn phải hợp lệ.
     */
    fc.assert(
      fc.property(
        validImageListArb,
        belowFoldLazyImageArb,
        (images, newImage) => {
          const extended = [...images, newImage];
          const result = validateImageLazyLoading(extended);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Adding an eager below-fold image to any list makes it invalid
  // -------------------------------------------------------------------------

  it('thêm ảnh eager ngoài viewport vào bất kỳ danh sách nào làm kết quả không hợp lệ', () => {
    /**
     * **Validates: Requirements 4.6**
     * Nếu ta thêm một ảnh ngoài viewport với loading="eager" vào bất kỳ danh sách nào,
     * kết quả phải không hợp lệ.
     */
    fc.assert(
      fc.property(
        validImageListArb,
        belowFoldEagerImageArb,
        (images, eagerImage) => {
          const extended = [...images, eagerImage];
          const result = validateImageLazyLoading(extended);
          expect(result.valid).toBe(false);
          expect(result.violations.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
