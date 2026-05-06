/**
 * Property-based tests for slug generation functions
 *
 * Property 15: Slug được tạo từ tiêu đề là URL-safe và duy nhất
 *   Validates: Requirements 7.10
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateSlug, generateUniqueSlug } from '../slug';

// ---------------------------------------------------------------------------
// Property 15 — generateSlug: output là URL-safe
// Validates: Requirements 7.10
// ---------------------------------------------------------------------------

describe('Property 15: generateSlug — output là URL-safe', () => {
  it('trả về chuỗi chỉ chứa ký tự a-z, 0-9 và dấu gạch ngang', () => {
    /**
     * **Validates: Requirements 7.10**
     * Với bất kỳ chuỗi đầu vào nào, generateSlug phải trả về chuỗi
     * chỉ chứa các ký tự URL-safe: a-z, 0-9, và dấu gạch ngang (-).
     */
    fc.assert(
      fc.property(fc.string(), (title) => {
        const slug = generateSlug(title);
        // Slug must only contain a-z, 0-9, and hyphens (or be empty for inputs with no alphanumeric chars)
        expect(slug).toMatch(/^[a-z0-9-]*$/);
      }),
      { numRuns: 100 }
    );
  });

  it('không có dấu gạch ngang ở đầu hoặc cuối', () => {
    /**
     * **Validates: Requirements 7.10**
     * Slug không được bắt đầu hoặc kết thúc bằng dấu gạch ngang.
     */
    fc.assert(
      fc.property(fc.string(), (title) => {
        const slug = generateSlug(title);
        expect(slug).not.toMatch(/^-/);
        expect(slug).not.toMatch(/-$/);
      }),
      { numRuns: 100 }
    );
  });

  it('không có nhiều dấu gạch ngang liên tiếp', () => {
    /**
     * **Validates: Requirements 7.10**
     * Slug không được chứa hai hoặc nhiều dấu gạch ngang liên tiếp.
     */
    fc.assert(
      fc.property(fc.string(), (title) => {
        const slug = generateSlug(title);
        expect(slug).not.toMatch(/--/);
      }),
      { numRuns: 100 }
    );
  });

  it('xử lý đúng ký tự tiếng Việt có dấu', () => {
    /**
     * **Validates: Requirements 7.10**
     * Với chuỗi chứa ký tự tiếng Việt (bao gồm đ/Đ và các dấu thanh),
     * generateSlug phải trả về chuỗi URL-safe.
     */
    const vietnameseChars = 'àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ';
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...vietnameseChars.split('')), { minLength: 1, maxLength: 20 }),
        (chars) => {
          const title = chars.join('');
          const slug = generateSlug(title);
          expect(slug).toMatch(/^[a-z0-9-]*$/);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 15 — generateUniqueSlug: kết quả không nằm trong existingSlugs
// Validates: Requirements 7.10
// ---------------------------------------------------------------------------

describe('Property 15: generateUniqueSlug — kết quả luôn duy nhất', () => {
  it('trả về slug không nằm trong danh sách existingSlugs', () => {
    /**
     * **Validates: Requirements 7.10**
     * Với bất kỳ tiêu đề và danh sách slug hiện có nào,
     * generateUniqueSlug phải trả về slug không trùng với bất kỳ slug nào trong danh sách.
     */
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.array(fc.string({ minLength: 1 }), { maxLength: 20 }),
        (title, existingSlugs) => {
          const result = generateUniqueSlug(title, existingSlugs);
          expect(existingSlugs).not.toContain(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trả về base slug khi danh sách existingSlugs rỗng', () => {
    /**
     * **Validates: Requirements 7.10**
     * Khi existingSlugs rỗng, generateUniqueSlug phải trả về đúng base slug
     * (không có suffix số).
     */
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (title) => {
        const base = generateSlug(title);
        const result = generateUniqueSlug(title, []);
        expect(result).toBe(base);
      }),
      { numRuns: 100 }
    );
  });

  it('trả về slug URL-safe ngay cả khi có suffix số', () => {
    /**
     * **Validates: Requirements 7.10**
     * Kết quả của generateUniqueSlug luôn là URL-safe (a-z, 0-9, -).
     */
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.array(fc.string({ minLength: 1 }), { maxLength: 10 }),
        (title, existingSlugs) => {
          const result = generateUniqueSlug(title, existingSlugs);
          expect(result).toMatch(/^[a-z0-9-]*$/);
        }
      ),
      { numRuns: 100 }
    );
  });
});
