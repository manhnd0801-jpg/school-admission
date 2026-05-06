/**
 * Property-based tests for article search/filter logic
 *
 * Property 13: Kết quả tìm kiếm luôn chứa và chỉ chứa các mục khớp query
 *   Validates: Requirements 7.7
 *
 * The article list API (GET /api/admin/articles) supports filtering by:
 *   - search  — title keyword (case-insensitive contains)
 *   - category — exact match (case-insensitive)
 *   - status  — exact match (ArticleStatus enum)
 *
 * These tests exercise the pure filter logic extracted from the API route
 * so they run without a database or HTTP server.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ArticleStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED';

interface Article {
  id: string;
  title: string;
  category: string;
  status: ArticleStatus;
}

interface FilterParams {
  search?: string;
  category?: string;
  status?: ArticleStatus;
}

// ---------------------------------------------------------------------------
// Pure filter function — mirrors the WHERE clause in route.ts
//
// From src/app/api/admin/articles/route.ts:
//   title:    { contains: search, mode: 'insensitive' }
//   category: { equals: category, mode: 'insensitive' }
//   status:   statusFilter (exact enum match)
// ---------------------------------------------------------------------------

function filterArticles(articles: Article[], params: FilterParams): Article[] {
  const { search = '', category = '', status } = params;

  return articles.filter((article) => {
    // Title search — case-insensitive contains
    if (search.trim() !== '') {
      if (!article.title.toLowerCase().includes(search.trim().toLowerCase())) {
        return false;
      }
    }

    // Category filter — case-insensitive exact match
    if (category.trim() !== '') {
      if (article.category.toLowerCase() !== category.trim().toLowerCase()) {
        return false;
      }
    }

    // Status filter — exact enum match
    if (status !== undefined) {
      if (article.status !== status) {
        return false;
      }
    }

    return true;
  });
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const ALL_STATUSES: ArticleStatus[] = ['DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED'];

const statusArb = fc.constantFrom<ArticleStatus>(...ALL_STATUSES);

/**
 * Generates a non-empty, trimmed ASCII-safe string for titles/categories.
 * No leading/trailing whitespace so keyword comparisons are unambiguous.
 */
const wordArb = fc
  .stringMatching(/^[a-zA-Z0-9]{1,10}([a-zA-Z0-9 ]{0,9}[a-zA-Z0-9])?$/)
  .filter((s) => s.trim().length > 0 && s === s.trim());

/** Generates a single article */
const articleArb = fc.record<Article>({
  id: fc.uuid(),
  title: wordArb,
  category: wordArb,
  status: statusArb,
});

/** Generates a non-empty list of articles (1–30 items) */
const articleListArb = fc.array(articleArb, { minLength: 1, maxLength: 30 });

// ---------------------------------------------------------------------------
// Property 13 — Search/filter results contain exactly the matching items
// Validates: Requirements 7.7
// ---------------------------------------------------------------------------

describe('Property 13: Kết quả tìm kiếm luôn chứa và chỉ chứa các mục khớp query', () => {
  // -------------------------------------------------------------------------
  // Sub-property A: Title search — all results contain the keyword
  // -------------------------------------------------------------------------

  it('tất cả kết quả tìm kiếm theo tiêu đề đều chứa từ khóa (case-insensitive)', () => {
    /**
     * **Validates: Requirements 7.7**
     * Với bất kỳ danh sách bài viết và từ khóa tìm kiếm nào,
     * mọi bài viết trong kết quả phải có tiêu đề chứa từ khóa đó
     * (so sánh không phân biệt hoa/thường).
     */
    fc.assert(
      fc.property(articleListArb, wordArb, (articles, keyword) => {
        const results = filterArticles(articles, { search: keyword });
        for (const article of results) {
          expect(article.title.toLowerCase()).toContain(keyword.toLowerCase());
        }
      }),
      { numRuns: 100 }
    );
  });

  it('không có bài viết nào không khớp từ khóa xuất hiện trong kết quả tìm kiếm', () => {
    /**
     * **Validates: Requirements 7.7**
     * Với bất kỳ danh sách bài viết và từ khóa tìm kiếm nào,
     * không có bài viết nào có tiêu đề KHÔNG chứa từ khóa được trả về.
     */
    fc.assert(
      fc.property(articleListArb, wordArb, (articles, keyword) => {
        const results = filterArticles(articles, { search: keyword });
        const resultIds = new Set(results.map((a) => a.id));

        for (const article of articles) {
          const matches = article.title.toLowerCase().includes(keyword.toLowerCase());
          if (!matches) {
            expect(resultIds.has(article.id)).toBe(false);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('tất cả bài viết khớp từ khóa đều xuất hiện trong kết quả (không bỏ sót)', () => {
    /**
     * **Validates: Requirements 7.7**
     * Với bất kỳ danh sách bài viết và từ khóa tìm kiếm nào,
     * mọi bài viết có tiêu đề chứa từ khóa phải xuất hiện trong kết quả.
     */
    fc.assert(
      fc.property(articleListArb, wordArb, (articles, keyword) => {
        const results = filterArticles(articles, { search: keyword });
        const resultIds = new Set(results.map((a) => a.id));

        for (const article of articles) {
          const matches = article.title.toLowerCase().includes(keyword.toLowerCase());
          if (matches) {
            expect(resultIds.has(article.id)).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property B: Category filter — all results have the exact category
  // -------------------------------------------------------------------------

  it('tất cả kết quả lọc theo danh mục đều có đúng danh mục đó (case-insensitive)', () => {
    /**
     * **Validates: Requirements 7.7**
     * Với bất kỳ danh sách bài viết và danh mục lọc nào,
     * mọi bài viết trong kết quả phải có danh mục khớp chính xác
     * (so sánh không phân biệt hoa/thường).
     */
    fc.assert(
      fc.property(articleListArb, wordArb, (articles, category) => {
        const results = filterArticles(articles, { category });
        for (const article of results) {
          expect(article.category.toLowerCase()).toBe(category.toLowerCase());
        }
      }),
      { numRuns: 100 }
    );
  });

  it('không có bài viết nào có danh mục khác xuất hiện trong kết quả lọc theo danh mục', () => {
    /**
     * **Validates: Requirements 7.7**
     * Với bất kỳ danh sách bài viết và danh mục lọc nào,
     * không có bài viết nào có danh mục KHÁC với danh mục lọc được trả về.
     */
    fc.assert(
      fc.property(articleListArb, wordArb, (articles, category) => {
        const results = filterArticles(articles, { category });
        const resultIds = new Set(results.map((a) => a.id));

        for (const article of articles) {
          const matches = article.category.toLowerCase() === category.toLowerCase();
          if (!matches) {
            expect(resultIds.has(article.id)).toBe(false);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('tất cả bài viết có danh mục khớp đều xuất hiện trong kết quả (không bỏ sót)', () => {
    /**
     * **Validates: Requirements 7.7**
     * Với bất kỳ danh sách bài viết và danh mục lọc nào,
     * mọi bài viết có danh mục khớp phải xuất hiện trong kết quả.
     */
    fc.assert(
      fc.property(articleListArb, wordArb, (articles, category) => {
        const results = filterArticles(articles, { category });
        const resultIds = new Set(results.map((a) => a.id));

        for (const article of articles) {
          const matches = article.category.toLowerCase() === category.toLowerCase();
          if (matches) {
            expect(resultIds.has(article.id)).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property C: Status filter — all results have the exact status
  // -------------------------------------------------------------------------

  it('tất cả kết quả lọc theo trạng thái đều có đúng trạng thái đó', () => {
    /**
     * **Validates: Requirements 7.7**
     * Với bất kỳ danh sách bài viết và trạng thái lọc nào,
     * mọi bài viết trong kết quả phải có trạng thái khớp chính xác.
     */
    fc.assert(
      fc.property(articleListArb, statusArb, (articles, status) => {
        const results = filterArticles(articles, { status });
        for (const article of results) {
          expect(article.status).toBe(status);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('không có bài viết nào có trạng thái khác xuất hiện trong kết quả lọc theo trạng thái', () => {
    /**
     * **Validates: Requirements 7.7**
     * Với bất kỳ danh sách bài viết và trạng thái lọc nào,
     * không có bài viết nào có trạng thái KHÁC với trạng thái lọc được trả về.
     */
    fc.assert(
      fc.property(articleListArb, statusArb, (articles, status) => {
        const results = filterArticles(articles, { status });
        const resultIds = new Set(results.map((a) => a.id));

        for (const article of articles) {
          if (article.status !== status) {
            expect(resultIds.has(article.id)).toBe(false);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('tất cả bài viết có trạng thái khớp đều xuất hiện trong kết quả (không bỏ sót)', () => {
    /**
     * **Validates: Requirements 7.7**
     * Với bất kỳ danh sách bài viết và trạng thái lọc nào,
     * mọi bài viết có trạng thái khớp phải xuất hiện trong kết quả.
     */
    fc.assert(
      fc.property(articleListArb, statusArb, (articles, status) => {
        const results = filterArticles(articles, { status });
        const resultIds = new Set(results.map((a) => a.id));

        for (const article of articles) {
          if (article.status === status) {
            expect(resultIds.has(article.id)).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property D: Combined filters — all conditions must hold simultaneously
  // -------------------------------------------------------------------------

  it('kết quả lọc kết hợp (tiêu đề + danh mục + trạng thái) chỉ chứa bài viết khớp tất cả điều kiện', () => {
    /**
     * **Validates: Requirements 7.7**
     * Với bất kỳ danh sách bài viết và bộ lọc kết hợp nào,
     * mọi bài viết trong kết quả phải thỏa mãn đồng thời tất cả điều kiện lọc.
     */
    fc.assert(
      fc.property(
        articleListArb,
        wordArb,
        wordArb,
        statusArb,
        (articles, search, category, status) => {
          const results = filterArticles(articles, { search, category, status });

          for (const article of results) {
            // Must match title keyword
            expect(article.title.toLowerCase()).toContain(search.toLowerCase());
            // Must match category
            expect(article.category.toLowerCase()).toBe(category.toLowerCase());
            // Must match status
            expect(article.status).toBe(status);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('không có bài viết nào không thỏa mãn ít nhất một điều kiện lọc kết hợp xuất hiện trong kết quả', () => {
    /**
     * **Validates: Requirements 7.7**
     * Với bất kỳ danh sách bài viết và bộ lọc kết hợp nào,
     * không có bài viết nào vi phạm bất kỳ điều kiện lọc nào được trả về.
     */
    fc.assert(
      fc.property(
        articleListArb,
        wordArb,
        wordArb,
        statusArb,
        (articles, search, category, status) => {
          const results = filterArticles(articles, { search, category, status });
          const resultIds = new Set(results.map((a) => a.id));

          for (const article of articles) {
            const titleMatches = article.title.toLowerCase().includes(search.toLowerCase());
            const categoryMatches = article.category.toLowerCase() === category.toLowerCase();
            const statusMatches = article.status === status;

            if (!titleMatches || !categoryMatches || !statusMatches) {
              expect(resultIds.has(article.id)).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property E: No filter — all articles are returned
  // -------------------------------------------------------------------------

  it('không có bộ lọc nào thì tất cả bài viết đều được trả về', () => {
    /**
     * **Validates: Requirements 7.7**
     * Khi không có bộ lọc nào được áp dụng (search='', category='', status=undefined),
     * tất cả bài viết trong danh sách phải được trả về.
     */
    fc.assert(
      fc.property(articleListArb, (articles) => {
        const results = filterArticles(articles, {});
        expect(results).toHaveLength(articles.length);

        const resultIds = new Set(results.map((a) => a.id));
        for (const article of articles) {
          expect(resultIds.has(article.id)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property F: Consistency — same filter on same dataset always returns
  // the same results
  // -------------------------------------------------------------------------

  it('lọc nhất quán — cùng bộ lọc trên cùng dữ liệu luôn trả về cùng kết quả', () => {
    /**
     * **Validates: Requirements 7.7**
     * Với bất kỳ danh sách bài viết và bộ lọc nào,
     * gọi filterArticles hai lần với cùng tham số phải cho cùng kết quả.
     * Đảm bảo hàm lọc là pure (không có side effects).
     */
    fc.assert(
      fc.property(
        articleListArb,
        fc.record({
          search: fc.option(wordArb, { nil: undefined }),
          category: fc.option(wordArb, { nil: undefined }),
          status: fc.option(statusArb, { nil: undefined }),
        }),
        (articles, params) => {
          const results1 = filterArticles(articles, params);
          const results2 = filterArticles(articles, params);

          expect(results1.map((a) => a.id)).toEqual(results2.map((a) => a.id));
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property G: Empty search/category strings are treated as "no filter"
  // -------------------------------------------------------------------------

  it('chuỗi tìm kiếm rỗng không lọc bài viết nào (tương đương không có bộ lọc tiêu đề)', () => {
    /**
     * **Validates: Requirements 7.7**
     * Khi search là chuỗi rỗng hoặc chỉ có khoảng trắng,
     * không có bài viết nào bị loại bỏ do bộ lọc tiêu đề.
     */
    fc.assert(
      fc.property(
        articleListArb,
        fc.oneof(fc.constant(''), fc.stringMatching(/^\s+$/)),
        (articles, emptySearch) => {
          const results = filterArticles(articles, { search: emptySearch });
          // All articles should pass the title filter when search is empty/whitespace
          expect(results).toHaveLength(articles.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('chuỗi danh mục rỗng không lọc bài viết nào (tương đương không có bộ lọc danh mục)', () => {
    /**
     * **Validates: Requirements 7.7**
     * Khi category là chuỗi rỗng hoặc chỉ có khoảng trắng,
     * không có bài viết nào bị loại bỏ do bộ lọc danh mục.
     */
    fc.assert(
      fc.property(
        articleListArb,
        fc.oneof(fc.constant(''), fc.stringMatching(/^\s+$/)),
        (articles, emptyCategory) => {
          const results = filterArticles(articles, { category: emptyCategory });
          // All articles should pass the category filter when category is empty/whitespace
          expect(results).toHaveLength(articles.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property H: Result count is always ≤ total article count
  // -------------------------------------------------------------------------

  it('số lượng kết quả luôn nhỏ hơn hoặc bằng tổng số bài viết', () => {
    /**
     * **Validates: Requirements 7.7**
     * Với bất kỳ bộ lọc nào, số lượng kết quả không thể vượt quá
     * tổng số bài viết trong danh sách.
     */
    fc.assert(
      fc.property(
        articleListArb,
        fc.record({
          search: fc.option(wordArb, { nil: undefined }),
          category: fc.option(wordArb, { nil: undefined }),
          status: fc.option(statusArb, { nil: undefined }),
        }),
        (articles, params) => {
          const results = filterArticles(articles, params);
          expect(results.length).toBeLessThanOrEqual(articles.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property I: Filter results are a subset of the original list
  // -------------------------------------------------------------------------

  it('kết quả lọc luôn là tập con của danh sách bài viết gốc', () => {
    /**
     * **Validates: Requirements 7.7**
     * Với bất kỳ bộ lọc nào, mọi bài viết trong kết quả phải tồn tại
     * trong danh sách bài viết gốc (không tạo ra bài viết mới).
     */
    fc.assert(
      fc.property(
        articleListArb,
        fc.record({
          search: fc.option(wordArb, { nil: undefined }),
          category: fc.option(wordArb, { nil: undefined }),
          status: fc.option(statusArb, { nil: undefined }),
        }),
        (articles, params) => {
          const results = filterArticles(articles, params);
          const originalIds = new Set(articles.map((a) => a.id));

          for (const result of results) {
            expect(originalIds.has(result.id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
