/**
 * Property-based tests for article list pagination logic
 *
 * Property 14: Phân trang trả về đúng số lượng và không trùng lặp (page size 20)
 *   Validates: Requirements 7.8
 *
 * The CMS article list API (GET /api/admin/articles) paginates results with
 * a default page size of 20 articles per page (DEFAULT_LIMIT = 20).
 *
 * These tests exercise the pure pagination logic as a standalone function
 * so they run without a database or HTTP server.
 *
 * Properties verified:
 *   1. Each page returns at most PAGE_SIZE (20) articles
 *   2. No article appears on more than one page (no duplicates across pages)
 *   3. All articles appear across all pages (no articles are lost)
 *   4. The last page may have fewer than PAGE_SIZE articles
 *   5. Page numbers are 1-indexed (page 1 is the first page)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Constants — must match DEFAULT_LIMIT in src/app/api/admin/articles/route.ts
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Article {
  id: string;
  title: string;
}

interface PaginationResult {
  data: Article[];
  total: number;
  page: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Pure pagination function — mirrors the logic in route.ts
//
// From src/app/api/admin/articles/route.ts:
//   const skip = (page - 1) * limit;
//   articles = allArticles.slice(skip, skip + limit)
//   totalPages = Math.ceil(total / limit)
// ---------------------------------------------------------------------------

/**
 * Paginates an array of articles.
 *
 * @param articles - The full list of articles (already sorted/filtered)
 * @param page     - 1-indexed page number (clamped to ≥ 1)
 * @param pageSize - Number of articles per page (default PAGE_SIZE = 20)
 */
function paginateArticles(
  articles: Article[],
  page: number,
  pageSize: number = PAGE_SIZE
): PaginationResult {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const skip = (safePage - 1) * safePageSize;
  const data = articles.slice(skip, skip + safePageSize);
  const total = articles.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / safePageSize);

  return { data, total, page: safePage, totalPages };
}

/**
 * Collects all articles across all pages for a given dataset.
 * Iterates from page 1 to totalPages and concatenates results.
 */
function collectAllPages(articles: Article[], pageSize: number = PAGE_SIZE): Article[] {
  if (articles.length === 0) return [];

  const totalPages = Math.ceil(articles.length / pageSize);
  const collected: Article[] = [];

  for (let p = 1; p <= totalPages; p++) {
    const result = paginateArticles(articles, p, pageSize);
    collected.push(...result.data);
  }

  return collected;
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates a unique article with a deterministic id */
const articleArb = (index: number): Article => ({
  id: `article-${index}`,
  title: `Article ${index}`,
});

/**
 * Generates a list of 0–100 articles with unique ids.
 * Uses fc.integer to control the count, then maps to articles.
 */
const articleListArb = fc
  .integer({ min: 0, max: 100 })
  .map((count) => Array.from({ length: count }, (_, i) => articleArb(i)));

/**
 * Generates a list of 1–100 articles (non-empty) with unique ids.
 */
const nonEmptyArticleListArb = fc
  .integer({ min: 1, max: 100 })
  .map((count) => Array.from({ length: count }, (_, i) => articleArb(i)));

// ---------------------------------------------------------------------------
// Property 14 — Pagination returns correct count and no duplicates (page size 20)
// Validates: Requirements 7.8
// ---------------------------------------------------------------------------

describe('Property 14: Phân trang trả về đúng số lượng và không trùng lặp (page size 20)', () => {
  // -------------------------------------------------------------------------
  // Sub-property A: Each page returns at most PAGE_SIZE articles
  // -------------------------------------------------------------------------

  it('mỗi trang trả về tối đa 20 bài viết', () => {
    /**
     * **Validates: Requirements 7.8**
     * Với bất kỳ danh sách bài viết và số trang nào,
     * số lượng bài viết trả về trên mỗi trang không vượt quá PAGE_SIZE (20).
     */
    fc.assert(
      fc.property(
        nonEmptyArticleListArb,
        fc.integer({ min: 1, max: 10 }),
        (articles, page) => {
          const result = paginateArticles(articles, page, PAGE_SIZE);
          expect(result.data.length).toBeLessThanOrEqual(PAGE_SIZE);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trang đầy đủ (không phải trang cuối) trả về đúng PAGE_SIZE bài viết', () => {
    /**
     * **Validates: Requirements 7.8**
     * Với danh sách bài viết có ít nhất PAGE_SIZE * page bài viết,
     * trang đó phải trả về đúng PAGE_SIZE bài viết.
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 0, max: 20 }),
        (page, extra) => {
          // Ensure there are enough articles for `page` full pages
          const count = page * PAGE_SIZE + extra;
          const articles = Array.from({ length: count }, (_, i) => articleArb(i));
          const result = paginateArticles(articles, page, PAGE_SIZE);

          // Page `page` is a full page when there are at least page * PAGE_SIZE articles
          expect(result.data.length).toBe(PAGE_SIZE);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property B: No article appears on more than one page (no duplicates)
  // -------------------------------------------------------------------------

  it('không có bài viết nào xuất hiện trên nhiều hơn một trang', () => {
    /**
     * **Validates: Requirements 7.8**
     * Với bất kỳ danh sách bài viết nào, khi thu thập tất cả các trang,
     * mỗi bài viết chỉ xuất hiện đúng một lần — không có trùng lặp.
     */
    fc.assert(
      fc.property(articleListArb, (articles) => {
        const allCollected = collectAllPages(articles, PAGE_SIZE);
        const ids = allCollected.map((a) => a.id);
        const uniqueIds = new Set(ids);

        // Every id must be unique across all pages
        expect(uniqueIds.size).toBe(ids.length);
      }),
      { numRuns: 100 }
    );
  });

  it('id của bài viết trên các trang khác nhau không trùng nhau', () => {
    /**
     * **Validates: Requirements 7.8**
     * Với bất kỳ danh sách bài viết nào có ít nhất 2 trang,
     * tập hợp id của trang 1 và trang 2 phải rời nhau (disjoint).
     */
    fc.assert(
      fc.property(
        fc.integer({ min: PAGE_SIZE + 1, max: 100 })
          .map((count) => Array.from({ length: count }, (_, i) => articleArb(i))),
        (articles) => {
          const page1 = paginateArticles(articles, 1, PAGE_SIZE);
          const page2 = paginateArticles(articles, 2, PAGE_SIZE);

          const ids1 = new Set(page1.data.map((a) => a.id));
          const ids2 = new Set(page2.data.map((a) => a.id));

          // No id should appear in both pages
          for (const id of ids2) {
            expect(ids1.has(id)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property C: All articles appear across all pages (no articles lost)
  // -------------------------------------------------------------------------

  it('tất cả bài viết đều xuất hiện khi thu thập tất cả các trang', () => {
    /**
     * **Validates: Requirements 7.8**
     * Với bất kỳ danh sách bài viết nào, khi thu thập tất cả các trang,
     * tổng số bài viết thu được phải bằng tổng số bài viết ban đầu.
     */
    fc.assert(
      fc.property(articleListArb, (articles) => {
        const allCollected = collectAllPages(articles, PAGE_SIZE);
        expect(allCollected.length).toBe(articles.length);
      }),
      { numRuns: 100 }
    );
  });

  it('mọi bài viết trong danh sách gốc đều xuất hiện trên đúng một trang', () => {
    /**
     * **Validates: Requirements 7.8**
     * Với bất kỳ danh sách bài viết nào, mỗi bài viết trong danh sách gốc
     * phải xuất hiện đúng một lần trong tổng hợp tất cả các trang.
     */
    fc.assert(
      fc.property(nonEmptyArticleListArb, (articles) => {
        const allCollected = collectAllPages(articles, PAGE_SIZE);
        const collectedIds = new Set(allCollected.map((a) => a.id));

        for (const article of articles) {
          expect(collectedIds.has(article.id)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('thứ tự bài viết được bảo toàn khi thu thập tất cả các trang', () => {
    /**
     * **Validates: Requirements 7.8**
     * Khi thu thập tất cả các trang theo thứ tự từ trang 1 đến trang cuối,
     * thứ tự bài viết phải khớp với thứ tự trong danh sách gốc.
     */
    fc.assert(
      fc.property(articleListArb, (articles) => {
        const allCollected = collectAllPages(articles, PAGE_SIZE);
        const collectedIds = allCollected.map((a) => a.id);
        const originalIds = articles.map((a) => a.id);

        expect(collectedIds).toEqual(originalIds);
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property D: Last page may have fewer than PAGE_SIZE articles
  // -------------------------------------------------------------------------

  it('trang cuối có thể có ít hơn PAGE_SIZE bài viết', () => {
    /**
     * **Validates: Requirements 7.8**
     * Khi tổng số bài viết không chia hết cho PAGE_SIZE,
     * trang cuối phải có đúng (total % PAGE_SIZE) bài viết.
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: PAGE_SIZE - 1 }),
        fc.integer({ min: 0, max: 4 }),
        (remainder, fullPages) => {
          const count = fullPages * PAGE_SIZE + remainder;
          const articles = Array.from({ length: count }, (_, i) => articleArb(i));
          const totalPages = Math.ceil(count / PAGE_SIZE);
          const lastPage = paginateArticles(articles, totalPages, PAGE_SIZE);

          // Last page should have exactly `remainder` articles
          expect(lastPage.data.length).toBe(remainder);
          expect(lastPage.data.length).toBeLessThan(PAGE_SIZE);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trang cuối khi tổng số bài viết chia hết cho PAGE_SIZE có đúng PAGE_SIZE bài viết', () => {
    /**
     * **Validates: Requirements 7.8**
     * Khi tổng số bài viết chia hết cho PAGE_SIZE,
     * trang cuối phải có đúng PAGE_SIZE bài viết.
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        (fullPages) => {
          const count = fullPages * PAGE_SIZE;
          const articles = Array.from({ length: count }, (_, i) => articleArb(i));
          const lastPage = paginateArticles(articles, fullPages, PAGE_SIZE);

          expect(lastPage.data.length).toBe(PAGE_SIZE);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property E: Page numbers are 1-indexed
  // -------------------------------------------------------------------------

  it('trang 1 trả về bài viết đầu tiên trong danh sách (1-indexed)', () => {
    /**
     * **Validates: Requirements 7.8**
     * Trang 1 phải trả về các bài viết từ vị trí 0 đến PAGE_SIZE - 1
     * trong danh sách gốc (1-indexed: page 1 = first page).
     */
    fc.assert(
      fc.property(nonEmptyArticleListArb, (articles) => {
        const result = paginateArticles(articles, 1, PAGE_SIZE);
        const expected = articles.slice(0, PAGE_SIZE);

        expect(result.data).toEqual(expected);
        expect(result.page).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it('trang 1 và trang 0 trả về cùng kết quả (page 0 được chuẩn hóa thành page 1)', () => {
    /**
     * **Validates: Requirements 7.8**
     * Vì page được clamped về tối thiểu là 1, page 0 phải cho kết quả
     * giống page 1 — đảm bảo 1-indexed hoạt động đúng.
     */
    fc.assert(
      fc.property(nonEmptyArticleListArb, (articles) => {
        const page0Result = paginateArticles(articles, 0, PAGE_SIZE);
        const page1Result = paginateArticles(articles, 1, PAGE_SIZE);

        expect(page0Result.data.map((a) => a.id)).toEqual(
          page1Result.data.map((a) => a.id)
        );
      }),
      { numRuns: 100 }
    );
  });

  it('trang 2 bắt đầu từ bài viết thứ PAGE_SIZE + 1 (offset đúng)', () => {
    /**
     * **Validates: Requirements 7.8**
     * Trang 2 phải bắt đầu từ vị trí PAGE_SIZE trong danh sách gốc,
     * tức là bài viết đầu tiên của trang 2 là bài viết thứ PAGE_SIZE + 1.
     */
    fc.assert(
      fc.property(
        fc.integer({ min: PAGE_SIZE + 1, max: 100 })
          .map((count) => Array.from({ length: count }, (_, i) => articleArb(i))),
        (articles) => {
          const page2 = paginateArticles(articles, 2, PAGE_SIZE);

          // First article on page 2 should be at index PAGE_SIZE in the original list
          expect(page2.data[0].id).toBe(articles[PAGE_SIZE].id);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property F: totalPages calculation is correct
  // -------------------------------------------------------------------------

  it('totalPages được tính đúng bằng Math.ceil(total / PAGE_SIZE)', () => {
    /**
     * **Validates: Requirements 7.8**
     * Với bất kỳ danh sách bài viết nào,
     * totalPages phải bằng Math.ceil(total / PAGE_SIZE).
     */
    fc.assert(
      fc.property(nonEmptyArticleListArb, (articles) => {
        const result = paginateArticles(articles, 1, PAGE_SIZE);
        const expectedTotalPages = Math.ceil(articles.length / PAGE_SIZE);

        expect(result.totalPages).toBe(expectedTotalPages);
        expect(result.total).toBe(articles.length);
      }),
      { numRuns: 100 }
    );
  });

  it('trang vượt quá totalPages trả về danh sách rỗng', () => {
    /**
     * **Validates: Requirements 7.8**
     * Khi yêu cầu trang vượt quá tổng số trang,
     * kết quả phải là danh sách rỗng (không có lỗi).
     */
    fc.assert(
      fc.property(
        nonEmptyArticleListArb,
        fc.integer({ min: 1, max: 10 }),
        (articles, extra) => {
          const totalPages = Math.ceil(articles.length / PAGE_SIZE);
          const beyondPage = totalPages + extra;
          const result = paginateArticles(articles, beyondPage, PAGE_SIZE);

          expect(result.data).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('danh sách rỗng trả về totalPages = 0 và data rỗng', () => {
    /**
     * **Validates: Requirements 7.8**
     * Khi không có bài viết nào, totalPages phải là 0 và data phải rỗng.
     */
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (page) => {
        const result = paginateArticles([], page, PAGE_SIZE);

        expect(result.data).toHaveLength(0);
        expect(result.total).toBe(0);
        expect(result.totalPages).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property G: Pagination is deterministic (pure function)
  // -------------------------------------------------------------------------

  it('phân trang là hàm thuần túy — cùng đầu vào luôn cho cùng kết quả', () => {
    /**
     * **Validates: Requirements 7.8**
     * Với bất kỳ danh sách bài viết và số trang nào,
     * gọi paginateArticles hai lần với cùng tham số phải cho cùng kết quả.
     */
    fc.assert(
      fc.property(
        articleListArb,
        fc.integer({ min: 1, max: 10 }),
        (articles, page) => {
          const result1 = paginateArticles(articles, page, PAGE_SIZE);
          const result2 = paginateArticles(articles, page, PAGE_SIZE);

          expect(result1.data.map((a) => a.id)).toEqual(result2.data.map((a) => a.id));
          expect(result1.total).toBe(result2.total);
          expect(result1.totalPages).toBe(result2.totalPages);
          expect(result1.page).toBe(result2.page);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property H: Pages partition the full dataset (no overlap, no gap)
  // -------------------------------------------------------------------------

  it('các trang phân vùng toàn bộ danh sách — không chồng lấp, không bỏ sót', () => {
    /**
     * **Validates: Requirements 7.8**
     * Với bất kỳ danh sách bài viết nào, tập hợp id từ tất cả các trang
     * phải bằng đúng tập hợp id của danh sách gốc (partition property).
     */
    fc.assert(
      fc.property(articleListArb, (articles) => {
        const allCollected = collectAllPages(articles, PAGE_SIZE);
        const collectedIdSet = new Set(allCollected.map((a) => a.id));
        const originalIdSet = new Set(articles.map((a) => a.id));

        // Same size — no duplicates and no missing items
        expect(collectedIdSet.size).toBe(originalIdSet.size);

        // Every original id is in the collected set
        for (const id of originalIdSet) {
          expect(collectedIdSet.has(id)).toBe(true);
        }

        // Every collected id is in the original set
        for (const id of collectedIdSet) {
          expect(originalIdSet.has(id)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('tổng số bài viết trên tất cả các trang bằng tổng số bài viết ban đầu', () => {
    /**
     * **Validates: Requirements 7.8**
     * Tổng số bài viết khi cộng tất cả các trang lại phải bằng
     * tổng số bài viết trong danh sách gốc.
     */
    fc.assert(
      fc.property(articleListArb, (articles) => {
        if (articles.length === 0) {
          const result = paginateArticles(articles, 1, PAGE_SIZE);
          expect(result.total).toBe(0);
          return;
        }

        const totalPages = Math.ceil(articles.length / PAGE_SIZE);
        let totalCollected = 0;

        for (let p = 1; p <= totalPages; p++) {
          const result = paginateArticles(articles, p, PAGE_SIZE);
          totalCollected += result.data.length;
        }

        expect(totalCollected).toBe(articles.length);
      }),
      { numRuns: 100 }
    );
  });
});
