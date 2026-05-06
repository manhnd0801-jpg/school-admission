/**
 * Property-based tests for article validation
 *
 * Property 11: Validation bài viết từ chối dữ liệu thiếu trường bắt buộc
 *   Validates: Requirements 7.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateArticle } from '../validation';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates a non-empty, non-whitespace string */
const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((s) => s.trim().length > 0);

/** Generates a valid article with all required fields present and non-empty */
const validArticleArb = fc.record({
  title: nonEmptyStringArb,
  content: nonEmptyStringArb,
  category: nonEmptyStringArb,
  coverImage: nonEmptyStringArb,
});

/** Generates an empty or whitespace-only string (invalid for required fields) */
const emptyOrWhitespaceArb = fc.oneof(
  fc.constant(''),
  fc.stringMatching(/^\s+$/)
);

// ---------------------------------------------------------------------------
// Property 11 — validateArticle: từ chối dữ liệu thiếu trường bắt buộc
// Validates: Requirements 7.3
// ---------------------------------------------------------------------------

describe('Property 11: validateArticle — từ chối dữ liệu thiếu trường bắt buộc', () => {
  it('trả về isValid: true khi tất cả trường bắt buộc đều có giá trị hợp lệ', () => {
    /**
     * **Validates: Requirements 7.3**
     * Với bất kỳ dữ liệu bài viết nào có đầy đủ các trường bắt buộc
     * (title, content, category, coverImage) và không rỗng,
     * validateArticle phải trả về isValid: true.
     */
    fc.assert(
      fc.property(validArticleArb, (article) => {
        const result = validateArticle(article);
        expect(result.isValid).toBe(true);
        expect(Object.keys(result.errors)).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('trả về isValid: false khi title bị thiếu (undefined)', () => {
    /**
     * **Validates: Requirements 7.3**
     * Với bất kỳ dữ liệu bài viết nào thiếu trường title,
     * validateArticle phải trả về isValid: false với lỗi trên trường title.
     */
    fc.assert(
      fc.property(
        fc.record({
          content: nonEmptyStringArb,
          category: nonEmptyStringArb,
          coverImage: nonEmptyStringArb,
        }),
        (data) => {
          const result = validateArticle(data);
          expect(result.isValid).toBe(false);
          expect(result.errors['title']).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trả về isValid: false khi title là chuỗi rỗng hoặc chỉ có khoảng trắng', () => {
    /**
     * **Validates: Requirements 7.3**
     * Với bất kỳ dữ liệu bài viết nào có title rỗng hoặc chỉ chứa khoảng trắng,
     * validateArticle phải trả về isValid: false với lỗi trên trường title.
     */
    fc.assert(
      fc.property(
        fc.record({
          title: emptyOrWhitespaceArb,
          content: nonEmptyStringArb,
          category: nonEmptyStringArb,
          coverImage: nonEmptyStringArb,
        }),
        (data) => {
          const result = validateArticle(data);
          expect(result.isValid).toBe(false);
          expect(result.errors['title']).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trả về isValid: false khi content bị thiếu (undefined)', () => {
    /**
     * **Validates: Requirements 7.3**
     * Với bất kỳ dữ liệu bài viết nào thiếu trường content,
     * validateArticle phải trả về isValid: false với lỗi trên trường content.
     */
    fc.assert(
      fc.property(
        fc.record({
          title: nonEmptyStringArb,
          category: nonEmptyStringArb,
          coverImage: nonEmptyStringArb,
        }),
        (data) => {
          const result = validateArticle(data);
          expect(result.isValid).toBe(false);
          expect(result.errors['content']).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trả về isValid: false khi content là chuỗi rỗng hoặc chỉ có khoảng trắng', () => {
    /**
     * **Validates: Requirements 7.3**
     * Với bất kỳ dữ liệu bài viết nào có content rỗng hoặc chỉ chứa khoảng trắng,
     * validateArticle phải trả về isValid: false với lỗi trên trường content.
     */
    fc.assert(
      fc.property(
        fc.record({
          title: nonEmptyStringArb,
          content: emptyOrWhitespaceArb,
          category: nonEmptyStringArb,
          coverImage: nonEmptyStringArb,
        }),
        (data) => {
          const result = validateArticle(data);
          expect(result.isValid).toBe(false);
          expect(result.errors['content']).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trả về isValid: false khi category bị thiếu (undefined)', () => {
    /**
     * **Validates: Requirements 7.3**
     * Với bất kỳ dữ liệu bài viết nào thiếu trường category,
     * validateArticle phải trả về isValid: false với lỗi trên trường category.
     */
    fc.assert(
      fc.property(
        fc.record({
          title: nonEmptyStringArb,
          content: nonEmptyStringArb,
          coverImage: nonEmptyStringArb,
        }),
        (data) => {
          const result = validateArticle(data);
          expect(result.isValid).toBe(false);
          expect(result.errors['category']).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trả về isValid: false khi category là chuỗi rỗng hoặc chỉ có khoảng trắng', () => {
    /**
     * **Validates: Requirements 7.3**
     * Với bất kỳ dữ liệu bài viết nào có category rỗng hoặc chỉ chứa khoảng trắng,
     * validateArticle phải trả về isValid: false với lỗi trên trường category.
     */
    fc.assert(
      fc.property(
        fc.record({
          title: nonEmptyStringArb,
          content: nonEmptyStringArb,
          category: emptyOrWhitespaceArb,
          coverImage: nonEmptyStringArb,
        }),
        (data) => {
          const result = validateArticle(data);
          expect(result.isValid).toBe(false);
          expect(result.errors['category']).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trả về isValid: false khi coverImage bị thiếu (undefined)', () => {
    /**
     * **Validates: Requirements 7.3**
     * Với bất kỳ dữ liệu bài viết nào thiếu trường coverImage,
     * validateArticle phải trả về isValid: false với lỗi trên trường coverImage.
     */
    fc.assert(
      fc.property(
        fc.record({
          title: nonEmptyStringArb,
          content: nonEmptyStringArb,
          category: nonEmptyStringArb,
        }),
        (data) => {
          const result = validateArticle(data);
          expect(result.isValid).toBe(false);
          expect(result.errors['coverImage']).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trả về isValid: false khi coverImage là chuỗi rỗng hoặc chỉ có khoảng trắng', () => {
    /**
     * **Validates: Requirements 7.3**
     * Với bất kỳ dữ liệu bài viết nào có coverImage rỗng hoặc chỉ chứa khoảng trắng,
     * validateArticle phải trả về isValid: false với lỗi trên trường coverImage.
     */
    fc.assert(
      fc.property(
        fc.record({
          title: nonEmptyStringArb,
          content: nonEmptyStringArb,
          category: nonEmptyStringArb,
          coverImage: emptyOrWhitespaceArb,
        }),
        (data) => {
          const result = validateArticle(data);
          expect(result.isValid).toBe(false);
          expect(result.errors['coverImage']).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trả về isValid: false khi nhiều trường bắt buộc bị thiếu cùng lúc', () => {
    /**
     * **Validates: Requirements 7.3**
     * Với bất kỳ dữ liệu bài viết nào thiếu nhiều trường bắt buộc,
     * validateArticle phải trả về isValid: false với lỗi trên từng trường bị thiếu.
     */
    fc.assert(
      fc.property(
        // Generate a subset of required fields to omit (at least 1, at most all 4)
        fc.subarray(['title', 'content', 'category', 'coverImage'] as const, {
          minLength: 1,
          maxLength: 4,
        }),
        (missingFields) => {
          const fullData = {
            title: 'Tiêu đề bài viết',
            content: 'Nội dung bài viết',
            category: 'Tin tức',
            coverImage: 'https://example.com/image.jpg',
          };

          // Build article data with missing fields set to empty string
          const articleData: Record<string, string> = { ...fullData };
          for (const field of missingFields) {
            articleData[field] = '';
          }

          const result = validateArticle(articleData);
          expect(result.isValid).toBe(false);

          // Each missing field must have an error
          for (const field of missingFields) {
            expect(result.errors[field]).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
