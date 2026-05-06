/**
 * Property-based tests for content history tracking and restore logic
 *
 * Property 10: Chỉnh sửa nội dung tạo lịch sử và có thể khôi phục
 *   Validates: Requirements 6.6, 6.7, 10.3, 12.5
 *
 * This is a PURE LOGIC test — no Prisma or real DB is used.
 * Business logic is modelled as pure functions operating on in-memory state.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Pure business-logic model (no DB)
// ---------------------------------------------------------------------------

/** Arbitrary JSON-serialisable content object for a Section */
type ContentVersion = Record<string, unknown>;

/** A single history record created when content is edited */
type HistoryRecord = {
  id: string;
  contentBefore: ContentVersion;
  contentAfter: ContentVersion;
  createdAt: Date;
};

/** Counter used to generate deterministic IDs inside tests */
let _idCounter = 0;
function nextId(): string {
  return `hist-${++_idCounter}`;
}

/**
 * Apply an edit to the current content.
 * Returns the new current content AND the history record that was created.
 *
 * Mirrors the DB transaction in PUT /api/admin/sections/:id:
 *   1. INSERT ContentHistory { contentBefore: current, contentAfter: newContent }
 *   2. UPDATE Section.content = newContent
 */
function applyEdit(
  current: ContentVersion,
  newContent: ContentVersion
): { updated: ContentVersion; historyRecord: HistoryRecord } {
  const historyRecord: HistoryRecord = {
    id: nextId(),
    // Deep-clone so mutations to `current` later don't affect the record
    contentBefore: JSON.parse(JSON.stringify(current)) as ContentVersion,
    contentAfter: JSON.parse(JSON.stringify(newContent)) as ContentVersion,
    createdAt: new Date(),
  };
  const updated: ContentVersion = JSON.parse(JSON.stringify(newContent)) as ContentVersion;
  return { updated, historyRecord };
}

/**
 * Restore content from a history record.
 * Returns the content that the section should be set to.
 *
 * Mirrors POST /api/admin/sections/:id/restore:
 *   section.content = historyRecord.contentBefore
 */
function restoreFromHistory(historyRecord: HistoryRecord): ContentVersion {
  return JSON.parse(JSON.stringify(historyRecord.contentBefore)) as ContentVersion;
}

// ---------------------------------------------------------------------------
// fast-check arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a simple ContentVersion object with string/number leaf values.
 * Using fc.dictionary + fc.oneof keeps the generated objects realistic
 * while remaining JSON-serialisable.
 */
const contentVersionArb: fc.Arbitrary<ContentVersion> = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.oneof(
    fc.string({ maxLength: 50 }),
    fc.integer({ min: 0, max: 9999 }),
    fc.boolean()
  ),
  { minKeys: 1, maxKeys: 10 }
);

// ---------------------------------------------------------------------------
// Property 10 — Content history and restore
// Validates: Requirements 6.6, 6.7, 10.3, 12.5
// ---------------------------------------------------------------------------

describe('Property 10: Chỉnh sửa nội dung tạo lịch sử và có thể khôi phục', () => {
  // -------------------------------------------------------------------------
  // Sub-property A: History immutability
  // The history record's contentBefore must equal the original content
  // before the edit was applied.
  // -------------------------------------------------------------------------
  it('A — contentBefore trong history record khớp với nội dung trước khi chỉnh sửa', () => {
    /**
     * **Validates: Requirements 6.6**
     * Với bất kỳ nội dung hiện tại và nội dung mới nào,
     * sau khi applyEdit, historyRecord.contentBefore phải bằng nội dung ban đầu.
     */
    fc.assert(
      fc.property(contentVersionArb, contentVersionArb, (original, newContent) => {
        const { historyRecord } = applyEdit(original, newContent);
        expect(historyRecord.contentBefore).toEqual(original);
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property B: contentAfter matches the new content
  // -------------------------------------------------------------------------
  it('B — contentAfter trong history record khớp với nội dung mới sau khi chỉnh sửa', () => {
    /**
     * **Validates: Requirements 6.6**
     * Với bất kỳ nội dung hiện tại và nội dung mới nào,
     * sau khi applyEdit, historyRecord.contentAfter phải bằng nội dung mới.
     */
    fc.assert(
      fc.property(contentVersionArb, contentVersionArb, (original, newContent) => {
        const { historyRecord } = applyEdit(original, newContent);
        expect(historyRecord.contentAfter).toEqual(newContent);
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property C: Restore correctness (round-trip)
  // After restoring from a history record, the current content must equal
  // the contentBefore of that history record.
  // -------------------------------------------------------------------------
  it('C — khôi phục từ history record trả về đúng nội dung trước khi chỉnh sửa (round-trip)', () => {
    /**
     * **Validates: Requirements 6.7**
     * Với bất kỳ nội dung ban đầu và nội dung mới nào:
     *   1. applyEdit(original, newContent) → { updated, historyRecord }
     *   2. restoreFromHistory(historyRecord) phải trả về original
     */
    fc.assert(
      fc.property(contentVersionArb, contentVersionArb, (original, newContent) => {
        const { historyRecord } = applyEdit(original, newContent);
        const restored = restoreFromHistory(historyRecord);
        expect(restored).toEqual(original);
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property D: History ordering across multiple edits
  // Multiple edits create history records in chronological order;
  // restoring to any point in history produces the correct content.
  // -------------------------------------------------------------------------
  it('D — nhiều lần chỉnh sửa tạo lịch sử theo thứ tự; khôi phục về bất kỳ điểm nào cho nội dung đúng', () => {
    /**
     * **Validates: Requirements 6.6, 6.7**
     * Với một chuỗi N lần chỉnh sửa (N ≥ 2):
     *   - Mỗi historyRecord[i].contentBefore phải bằng nội dung tại bước i
     *   - Khôi phục từ historyRecord[i] phải trả về nội dung tại bước i
     */
    fc.assert(
      fc.property(
        // Generate a sequence of at least 2 content versions
        fc.array(contentVersionArb, { minLength: 2, maxLength: 8 }),
        (versions) => {
          const historyRecords: HistoryRecord[] = [];
          let current: ContentVersion = versions[0];

          // Apply edits sequentially
          for (let i = 1; i < versions.length; i++) {
            const { updated, historyRecord } = applyEdit(current, versions[i]);
            historyRecords.push(historyRecord);
            current = updated;
          }

          // Verify each history record's contentBefore matches the version at that step
          for (let i = 0; i < historyRecords.length; i++) {
            expect(historyRecords[i].contentBefore).toEqual(versions[i]);
          }

          // Verify restoring from any history record returns the correct version
          for (let i = 0; i < historyRecords.length; i++) {
            const restored = restoreFromHistory(historyRecords[i]);
            expect(restored).toEqual(versions[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property E: Content identity
  // Restoring to the most recent history record's contentBefore produces
  // the same content as the previous version (one step back).
  // -------------------------------------------------------------------------
  it('E — khôi phục từ history record mới nhất cho nội dung bằng phiên bản trước đó', () => {
    /**
     * **Validates: Requirements 6.7**
     * Sau hai lần chỉnh sửa liên tiếp (v0 → v1 → v2),
     * khôi phục từ history record mới nhất (v1→v2) phải trả về v1.
     */
    fc.assert(
      fc.property(
        contentVersionArb,
        contentVersionArb,
        contentVersionArb,
        (v0, v1, v2) => {
          // First edit: v0 → v1
          const { updated: afterFirst } = applyEdit(v0, v1);
          // Second edit: v1 → v2
          const { historyRecord: latestHistory } = applyEdit(afterFirst, v2);

          // Restoring from the latest history record should give v1
          const restored = restoreFromHistory(latestHistory);
          expect(restored).toEqual(v1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Sub-property F: History record isolation
  // Mutating the current content after an edit must not affect the stored
  // contentBefore in the history record (immutability / deep-clone guarantee).
  // -------------------------------------------------------------------------
  it('F — thay đổi nội dung sau khi chỉnh sửa không ảnh hưởng đến contentBefore đã lưu', () => {
    /**
     * **Validates: Requirements 6.6**
     * contentBefore trong history record phải là bản sao độc lập —
     * thay đổi nội dung hiện tại sau đó không được làm thay đổi giá trị đã lưu.
     */
    fc.assert(
      fc.property(
        contentVersionArb,
        contentVersionArb,
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (original, newContent, extraKey, extraValue) => {
          const { updated, historyRecord } = applyEdit(original, newContent);

          // Snapshot contentBefore before mutation
          const snapshotBefore = JSON.parse(JSON.stringify(historyRecord.contentBefore)) as ContentVersion;

          // Mutate the updated content object
          updated[extraKey] = extraValue;

          // contentBefore must remain unchanged
          expect(historyRecord.contentBefore).toEqual(snapshotBefore);
        }
      ),
      { numRuns: 100 }
    );
  });
});
