/**
 * Property-based tests for article status transitions
 *
 * Property 12: Chuyển trạng thái bài viết chỉ theo luồng hợp lệ
 *   Validates: Requirements 7.4
 *
 * Valid transitions (from design.md and route.ts):
 *   DRAFT     → PENDING    (any role)
 *   DRAFT     → PUBLISHED  (admin only)
 *   PENDING   → PUBLISHED  (any role)
 *   PENDING   → DRAFT      (any role)
 *   PUBLISHED → ARCHIVED   (any role)
 *   ARCHIVED  → DRAFT      (any role)
 *
 * All other combinations are invalid.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Pure transition logic — extracted from route.ts for isolated testing
// ---------------------------------------------------------------------------

type ArticleStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED';

/**
 * Valid status transitions map.
 * Mirrors VALID_TRANSITIONS in src/app/api/admin/articles/[id]/route.ts
 */
const VALID_TRANSITIONS: Record<ArticleStatus, ArticleStatus[]> = {
  DRAFT: ['PENDING', 'PUBLISHED'],
  PENDING: ['PUBLISHED', 'DRAFT'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: ['DRAFT'],
};

/**
 * Transitions that require ADMIN role.
 * Mirrors ADMIN_ONLY_TRANSITIONS in route.ts
 */
const ADMIN_ONLY_TRANSITIONS: Array<{ from: ArticleStatus; to: ArticleStatus }> = [
  { from: 'DRAFT', to: 'PUBLISHED' },
];

/**
 * Checks whether a status transition is structurally valid
 * (ignoring role-based restrictions).
 */
function isValidTransition(from: ArticleStatus, to: ArticleStatus): boolean {
  const allowed = VALID_TRANSITIONS[from] ?? [];
  return allowed.includes(to);
}

/**
 * Checks whether a transition requires ADMIN role.
 */
function isAdminOnlyTransition(from: ArticleStatus, to: ArticleStatus): boolean {
  return ADMIN_ONLY_TRANSITIONS.some((t) => t.from === from && t.to === to);
}

/**
 * Full transition check including role enforcement.
 * Returns 'ok' | 'invalid_transition' | 'forbidden'
 */
function checkTransition(
  from: ArticleStatus,
  to: ArticleStatus,
  role: 'ADMIN' | 'STAFF'
): 'ok' | 'invalid_transition' | 'forbidden' {
  if (!isValidTransition(from, to)) return 'invalid_transition';
  if (isAdminOnlyTransition(from, to) && role !== 'ADMIN') return 'forbidden';
  return 'ok';
}

// ---------------------------------------------------------------------------
// Derived sets for property generation
// ---------------------------------------------------------------------------

const ALL_STATUSES: ArticleStatus[] = ['DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED'];

/** All (from, to) pairs that are structurally valid */
const VALID_PAIRS: Array<[ArticleStatus, ArticleStatus]> = ALL_STATUSES.flatMap((from) =>
  (VALID_TRANSITIONS[from] ?? []).map((to): [ArticleStatus, ArticleStatus] => [from, to])
);

/** All (from, to) pairs that are structurally invalid (different statuses, not in VALID_TRANSITIONS) */
const INVALID_PAIRS: Array<[ArticleStatus, ArticleStatus]> = ALL_STATUSES.flatMap((from) =>
  ALL_STATUSES.filter(
    (to) => to !== from && !(VALID_TRANSITIONS[from] ?? []).includes(to)
  ).map((to): [ArticleStatus, ArticleStatus] => [from, to])
);

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const statusArb = fc.constantFrom<ArticleStatus>(...ALL_STATUSES);
const roleArb = fc.constantFrom<'ADMIN' | 'STAFF'>('ADMIN', 'STAFF');

/** Generates a valid (from, to) transition pair */
const validPairArb = fc.constantFrom(...VALID_PAIRS);

/** Generates an invalid (from, to) transition pair */
const invalidPairArb = fc.constantFrom(...INVALID_PAIRS);

// ---------------------------------------------------------------------------
// Property 12 — Article status transitions follow valid flow only
// Validates: Requirements 7.4
// ---------------------------------------------------------------------------

describe('Property 12: Chuyển trạng thái bài viết chỉ theo luồng hợp lệ', () => {
  // -------------------------------------------------------------------------
  // Sub-property A: All valid transitions are accepted (for any role that
  // satisfies role requirements)
  // -------------------------------------------------------------------------

  it('tất cả chuyển trạng thái hợp lệ đều được chấp nhận bởi ADMIN', () => {
    /**
     * **Validates: Requirements 7.4**
     * Với bất kỳ cặp (from, to) nào nằm trong VALID_TRANSITIONS,
     * ADMIN luôn được phép thực hiện chuyển trạng thái đó.
     */
    fc.assert(
      fc.property(validPairArb, ([from, to]) => {
        const result = checkTransition(from, to, 'ADMIN');
        expect(result).toBe('ok');
      }),
      { numRuns: 100 }
    );
  });

  it('các chuyển trạng thái hợp lệ không yêu cầu ADMIN đều được STAFF thực hiện', () => {
    /**
     * **Validates: Requirements 7.4**
     * Với bất kỳ cặp (from, to) hợp lệ nào không nằm trong ADMIN_ONLY_TRANSITIONS,
     * STAFF cũng được phép thực hiện.
     */
    const nonAdminValidPairs = VALID_PAIRS.filter(
      ([from, to]) => !isAdminOnlyTransition(from, to)
    );
    fc.assert(
      fc.property(fc.constantFrom(...nonAdminValidPairs), ([from, to]) => {
        const result = checkTransition(from, to, 'STAFF');
        expect(result).toBe('ok');
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property B: All invalid transitions are rejected
  // -------------------------------------------------------------------------

  it('tất cả chuyển trạng thái không hợp lệ đều bị từ chối (bất kể role)', () => {
    /**
     * **Validates: Requirements 7.4**
     * Với bất kỳ cặp (from, to) nào KHÔNG nằm trong VALID_TRANSITIONS,
     * checkTransition phải trả về 'invalid_transition' cho mọi role.
     */
    fc.assert(
      fc.property(invalidPairArb, roleArb, ([from, to], role) => {
        const result = checkTransition(from, to, role);
        expect(result).toBe('invalid_transition');
      }),
      { numRuns: 100 }
    );
  });

  it('chuyển trạng thái sang cùng trạng thái hiện tại không phải là chuyển trạng thái hợp lệ', () => {
    /**
     * **Validates: Requirements 7.4**
     * Chuyển từ một trạng thái sang chính nó không nằm trong VALID_TRANSITIONS
     * (self-transitions are not defined as valid).
     */
    fc.assert(
      fc.property(statusArb, (status) => {
        // Self-transitions are not in VALID_TRANSITIONS
        const allowed = VALID_TRANSITIONS[status] ?? [];
        expect(allowed).not.toContain(status);
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property C: Admin-only transitions are forbidden for STAFF
  // -------------------------------------------------------------------------

  it('DRAFT → PUBLISHED bị từ chối với role STAFF', () => {
    /**
     * **Validates: Requirements 7.4**
     * Chuyển trạng thái DRAFT → PUBLISHED là admin-only.
     * STAFF không được phép thực hiện chuyển trạng thái này.
     */
    fc.assert(
      fc.property(fc.constant(null), () => {
        const result = checkTransition('DRAFT', 'PUBLISHED', 'STAFF');
        expect(result).toBe('forbidden');
      }),
      { numRuns: 100 }
    );
  });

  it('DRAFT → PUBLISHED được chấp nhận với role ADMIN', () => {
    /**
     * **Validates: Requirements 7.4**
     * Chuyển trạng thái DRAFT → PUBLISHED là admin-only nhưng hợp lệ về cấu trúc.
     * ADMIN được phép thực hiện.
     */
    fc.assert(
      fc.property(fc.constant(null), () => {
        const result = checkTransition('DRAFT', 'PUBLISHED', 'ADMIN');
        expect(result).toBe('ok');
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property D: Exhaustive check — every (from, to, role) triple
  // produces a deterministic result
  // -------------------------------------------------------------------------

  it('kết quả checkTransition là xác định (deterministic) với cùng đầu vào', () => {
    /**
     * **Validates: Requirements 7.4**
     * Với bất kỳ (from, to, role) nào, gọi checkTransition hai lần
     * phải cho cùng kết quả — không có side effects hay randomness.
     */
    fc.assert(
      fc.property(statusArb, statusArb, roleArb, (from, to, role) => {
        const result1 = checkTransition(from, to, role);
        const result2 = checkTransition(from, to, role);
        expect(result1).toBe(result2);
      }),
      { numRuns: 100 }
    );
  });

  it('isValidTransition nhất quán với VALID_TRANSITIONS map', () => {
    /**
     * **Validates: Requirements 7.4**
     * Với bất kỳ cặp (from, to) nào, isValidTransition(from, to) phải
     * trả về true khi và chỉ khi to nằm trong VALID_TRANSITIONS[from].
     */
    fc.assert(
      fc.property(statusArb, statusArb, (from, to) => {
        const expected = (VALID_TRANSITIONS[from] ?? []).includes(to);
        expect(isValidTransition(from, to)).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property E: Specific valid transitions — each one individually
  // -------------------------------------------------------------------------

  it('DRAFT → PENDING được chấp nhận với mọi role', () => {
    /**
     * **Validates: Requirements 7.4**
     */
    fc.assert(
      fc.property(roleArb, (role) => {
        expect(checkTransition('DRAFT', 'PENDING', role)).toBe('ok');
      }),
      { numRuns: 100 }
    );
  });

  it('PENDING → PUBLISHED được chấp nhận với mọi role', () => {
    /**
     * **Validates: Requirements 7.4**
     */
    fc.assert(
      fc.property(roleArb, (role) => {
        expect(checkTransition('PENDING', 'PUBLISHED', role)).toBe('ok');
      }),
      { numRuns: 100 }
    );
  });

  it('PENDING → DRAFT được chấp nhận với mọi role', () => {
    /**
     * **Validates: Requirements 7.4**
     */
    fc.assert(
      fc.property(roleArb, (role) => {
        expect(checkTransition('PENDING', 'DRAFT', role)).toBe('ok');
      }),
      { numRuns: 100 }
    );
  });

  it('PUBLISHED → ARCHIVED được chấp nhận với mọi role', () => {
    /**
     * **Validates: Requirements 7.4**
     */
    fc.assert(
      fc.property(roleArb, (role) => {
        expect(checkTransition('PUBLISHED', 'ARCHIVED', role)).toBe('ok');
      }),
      { numRuns: 100 }
    );
  });

  it('ARCHIVED → DRAFT được chấp nhận với mọi role', () => {
    /**
     * **Validates: Requirements 7.4**
     */
    fc.assert(
      fc.property(roleArb, (role) => {
        expect(checkTransition('ARCHIVED', 'DRAFT', role)).toBe('ok');
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property F: Specific invalid transitions — key examples
  // -------------------------------------------------------------------------

  it('PUBLISHED → DRAFT bị từ chối (không hợp lệ)', () => {
    /**
     * **Validates: Requirements 7.4**
     * PUBLISHED không thể chuyển trực tiếp về DRAFT.
     */
    fc.assert(
      fc.property(roleArb, (role) => {
        expect(checkTransition('PUBLISHED', 'DRAFT', role)).toBe('invalid_transition');
      }),
      { numRuns: 100 }
    );
  });

  it('PUBLISHED → PENDING bị từ chối (không hợp lệ)', () => {
    /**
     * **Validates: Requirements 7.4**
     */
    fc.assert(
      fc.property(roleArb, (role) => {
        expect(checkTransition('PUBLISHED', 'PENDING', role)).toBe('invalid_transition');
      }),
      { numRuns: 100 }
    );
  });

  it('ARCHIVED → PUBLISHED bị từ chối (không hợp lệ)', () => {
    /**
     * **Validates: Requirements 7.4**
     */
    fc.assert(
      fc.property(roleArb, (role) => {
        expect(checkTransition('ARCHIVED', 'PUBLISHED', role)).toBe('invalid_transition');
      }),
      { numRuns: 100 }
    );
  });

  it('ARCHIVED → PENDING bị từ chối (không hợp lệ)', () => {
    /**
     * **Validates: Requirements 7.4**
     */
    fc.assert(
      fc.property(roleArb, (role) => {
        expect(checkTransition('ARCHIVED', 'PENDING', role)).toBe('invalid_transition');
      }),
      { numRuns: 100 }
    );
  });

  it('DRAFT → ARCHIVED bị từ chối (không hợp lệ)', () => {
    /**
     * **Validates: Requirements 7.4**
     */
    fc.assert(
      fc.property(roleArb, (role) => {
        expect(checkTransition('DRAFT', 'ARCHIVED', role)).toBe('invalid_transition');
      }),
      { numRuns: 100 }
    );
  });

  it('PENDING → ARCHIVED bị từ chối (không hợp lệ)', () => {
    /**
     * **Validates: Requirements 7.4**
     */
    fc.assert(
      fc.property(roleArb, (role) => {
        expect(checkTransition('PENDING', 'ARCHIVED', role)).toBe('invalid_transition');
      }),
      { numRuns: 100 }
    );
  });
});
