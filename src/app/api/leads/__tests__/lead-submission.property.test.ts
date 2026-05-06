/**
 * Property-based tests for lead submission API
 *
 * Property 4: Gửi form hợp lệ tạo lead trong DB với trạng thái NEW
 *   Validates: Requirements 3.7
 *
 * Property 19: Form submission được enqueue khi DB không khả dụng
 *   Validates: Requirements 11.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks — use vi.hoisted to avoid temporal dead zone issues with vi.mock hoisting
// ---------------------------------------------------------------------------

const { mockLeadFindFirst, mockLeadCreate, mockTransaction, mockQueueAdd } = vi.hoisted(() => ({
  mockLeadFindFirst: vi.fn(),
  mockLeadCreate: vi.fn(),
  mockTransaction: vi.fn(),
  mockQueueAdd: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mockTransaction,
  },
}));

// Mock rate limit — always allow
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 2 }),
}));

// Mock email — fire-and-forget, no-op
vi.mock('@/lib/email', () => ({
  notifyTeam: vi.fn().mockResolvedValue(undefined),
}));

// Mock BullMQ queue
vi.mock('@/lib/queue', () => ({
  leadSubmissionQueue: {
    add: mockQueueAdd,
  },
}));

// Import route handler AFTER mocks are set up
import { POST } from '../route';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const currentYear = new Date().getFullYear();

/**
 * Generates valid RegistrationFormData for property tests.
 */
const validFormDataArb = fc.record({
  parentName: fc
    .stringMatching(/^[A-Za-z ]{2,30}/)
    .filter((s) => s.trim().length > 0),
  phone: fc.stringMatching(/^0\d{9}$/),
  email: fc.option(fc.emailAddress(), { nil: undefined }),
  studentName: fc
    .stringMatching(/^[A-Za-z ]{2,30}/)
    .filter((s) => s.trim().length > 0),
  expectedYear: fc.integer({ min: currentYear, max: currentYear + 5 }),
  note: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  privacyConsent: fc.constant(true as boolean),
});

/**
 * Creates a NextRequest with the given body and optional IP header.
 */
function makeRequest(body: unknown, ip = '127.0.0.1'): NextRequest {
  return new NextRequest('http://localhost/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Property 4: Gửi form hợp lệ tạo lead trong DB với trạng thái NEW
// Validates: Requirements 3.7
// ---------------------------------------------------------------------------

describe('Property 4: Gửi form hợp lệ tạo lead trong DB với trạng thái NEW', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mọi form hợp lệ đều tạo lead với status NEW trong DB', async () => {
    /**
     * **Validates: Requirements 3.7**
     * Với bất kỳ dữ liệu form hợp lệ nào (pass validation, IP chưa bị rate limit,
     * có consent), sau khi gọi POST /api/leads, DB phải nhận lệnh tạo lead
     * với đúng dữ liệu đã gửi và status mặc định là NEW.
     */
    await fc.assert(
      fc.asyncProperty(validFormDataArb, async (formData) => {
        // Setup: no duplicate, successful insert
        const createdLead = {
          id: 'lead-id-123',
          ...formData,
          email: formData.email ?? null,
          note: formData.note ?? null,
          status: 'NEW',
          sourceIp: '127.0.0.1',
          createdAt: new Date(),
          updatedAt: new Date(),
          assignedToId: null,
        };

        mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            lead: {
              findFirst: mockLeadFindFirst.mockResolvedValueOnce(null), // no duplicate
              create: mockLeadCreate.mockResolvedValueOnce(createdLead),
            },
          };
          return callback(tx);
        });

        const request = makeRequest(formData);
        const response = await POST(request);
        const body = await response.json();

        // Response must be 200 with success: true and a leadId
        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.leadId).toBe('lead-id-123');
        expect(body.duplicate).toBeUndefined();
        expect(body.queued).toBeUndefined();

        // DB create must have been called with the correct data
        expect(mockLeadCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              parentName: formData.parentName,
              phone: formData.phone,
              studentName: formData.studentName,
              expectedYear: formData.expectedYear,
              privacyConsent: true,
            }),
          })
        );
      }),
      { numRuns: 100 }
    );
  });

  it('trả về duplicate: true khi số điện thoại đã tồn tại trong 24 giờ', async () => {
    /**
     * **Validates: Requirements 3.11**
     * Khi DB tìm thấy lead trùng số điện thoại trong 24h,
     * API phải trả về 200 với duplicate: true và không tạo lead mới.
     */
    await fc.assert(
      fc.asyncProperty(validFormDataArb, async (formData) => {
        const existingLead = {
          id: 'existing-lead-id',
          ...formData,
          status: 'NEW',
          createdAt: new Date(),
        };

        mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            lead: {
              findFirst: mockLeadFindFirst.mockResolvedValueOnce(existingLead),
              create: mockLeadCreate,
            },
          };
          return callback(tx);
        });

        const request = makeRequest(formData);
        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.duplicate).toBe(true);
        expect(body.message).toContain('Số điện thoại này đã đăng ký');

        // DB create must NOT have been called
        expect(mockLeadCreate).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 19: Form submission được enqueue khi DB không khả dụng
// Validates: Requirements 11.5
// ---------------------------------------------------------------------------

describe('Property 19: Form submission được enqueue khi DB không khả dụng', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('khi DB lỗi, API trả về 200 và enqueue job vào BullMQ', async () => {
    /**
     * **Validates: Requirements 11.5**
     * Với bất kỳ dữ liệu form hợp lệ nào, khi DB không khả dụng (mock DB failure),
     * API POST /api/leads phải:
     *   (a) trả về HTTP 200 (không phải 500)
     *   (b) tạo một job trong BullMQ queue với đầy đủ dữ liệu form
     */
    await fc.assert(
      fc.asyncProperty(validFormDataArb, async (formData) => {
        // Setup: DB throws an error
        const dbError = new Error('DB connection refused');
        mockTransaction.mockRejectedValueOnce(dbError);

        // Setup: queue add succeeds
        const mockJob = { id: 'job-id-456' };
        mockQueueAdd.mockResolvedValueOnce(mockJob);

        const request = makeRequest(formData);
        const response = await POST(request);
        const body = await response.json();

        // (a) Must return 200, not 500
        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.queued).toBe(true);

        // (b) Must enqueue job with full form data
        expect(mockQueueAdd).toHaveBeenCalledWith(
          'lead-submission',
          expect.objectContaining({
            formData: expect.objectContaining({
              parentName: formData.parentName,
              phone: formData.phone,
              studentName: formData.studentName,
              expectedYear: formData.expectedYear,
              privacyConsent: true,
            }),
            sourceIp: expect.any(String),
          })
        );
      }),
      { numRuns: 100 }
    );
  });

  it('khi cả DB và queue đều lỗi, API trả về 503', async () => {
    /**
     * **Validates: Requirements 11.5**
     * Khi cả DB lẫn queue đều không khả dụng, API phải trả về 503.
     */
    await fc.assert(
      fc.asyncProperty(validFormDataArb, async (formData) => {
        // Both DB and queue fail
        mockTransaction.mockRejectedValueOnce(new Error('DB down'));
        mockQueueAdd.mockRejectedValueOnce(new Error('Queue down'));

        const request = makeRequest(formData);
        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(503);
        expect(body.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
