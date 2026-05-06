/**
 * Integration tests for CMS Section API routes
 *
 * Tests:
 *   - GET /api/admin/sections — list all sections
 *   - PUT /api/admin/sections/[id] — update section content
 *   - GET /api/admin/sections/[id]/history — get edit history
 *   - POST /api/admin/sections/[id]/restore — restore to previous version
 *
 * Requirements: 6.1, 6.2, 6.6, 6.7, 12.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { GET as getSections } from '../route';
import { PUT as updateSection } from '../[id]/route';
import { GET as getHistory } from '../[id]/history/route';
import { POST as restoreSection } from '../[id]/restore/route';

// ─── Mock NextAuth.js session ────────────────────────────────────────────────
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

// ─── Mock revalidateLandingPage ───────────────────────────────────────────────
vi.mock('@/lib/revalidate', () => ({
  revalidateLandingPage: vi.fn(),
}));

// ─── Mock logAudit ────────────────────────────────────────────────────────────
vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

// ─── In-memory test data ──────────────────────────────────────────────────────
const TEST_USER_ID = 'test-user-id-001';
const TEST_SECTION_ID = 'test-section-id-001';
const TEST_HISTORY_ID = 'test-history-id-001';

const initialContent = {
  headline: 'Test Headline',
  subheadline: 'Test Subheadline',
  backgroundType: 'image',
  backgroundUrl: 'https://example.com/bg.jpg',
  ctaText: 'Test CTA',
  ctaTarget: '#test',
};

// Mutable in-memory state
let sectionStore: Record<string, {
  id: string;
  type: string;
  title: string;
  content: object;
  isVisible: boolean;
  order: number;
  updatedAt: Date;
}> = {};

let historyStore: Array<{
  id: string;
  sectionId: string;
  editorId: string;
  contentBefore: object;
  contentAfter: object;
  createdAt: Date;
  editor: { id: string; name: string; email: string };
}> = [];

// ─── Mock Prisma ──────────────────────────────────────────────────────────────
vi.mock('@/lib/prisma', () => {
  const mockTransaction = async (fn: (tx: unknown) => Promise<unknown>) => {
    // Provide a minimal tx object that mirrors the real prisma methods
    const tx = {
      section: {
        update: async ({ where, data }: { where: { id: string }; data: Partial<typeof sectionStore[string]> }) => {
          const s = sectionStore[where.id];
          if (!s) throw new Error('Section not found');
          Object.assign(s, data, { updatedAt: new Date() });
          return { ...s };
        },
      },
      contentHistory: {
        create: async ({ data }: { data: { sectionId: string; editorId: string; contentBefore: object; contentAfter: object } }) => {
          const record = {
            id: `history-${Date.now()}-${Math.random()}`,
            sectionId: data.sectionId,
            editorId: data.editorId,
            contentBefore: data.contentBefore,
            contentAfter: data.contentAfter,
            createdAt: new Date(),
            editor: { id: TEST_USER_ID, name: 'Test Section User', email: 'test-section-api@example.com' },
          };
          historyStore.push(record);
          return record;
        },
      },
    };
    return fn(tx);
  };

  return {
    prisma: {
      section: {
        findMany: async () => Object.values(sectionStore),
        findUnique: async ({ where }: { where: { id: string } }) => sectionStore[where.id] ?? null,
        create: async ({ data }: { data: typeof sectionStore[string] }) => {
          const record = { ...data, id: data.id ?? TEST_SECTION_ID, updatedAt: new Date() };
          sectionStore[record.id] = record;
          return record;
        },
        update: async ({ where, data }: { where: { id: string }; data: Partial<typeof sectionStore[string]> }) => {
          const s = sectionStore[where.id];
          if (!s) throw new Error('Section not found');
          Object.assign(s, data, { updatedAt: new Date() });
          return { ...s };
        },
        delete: async ({ where }: { where: { id: string } }) => {
          const s = sectionStore[where.id];
          delete sectionStore[where.id];
          return s;
        },
      },
      contentHistory: {
        findMany: async ({ where }: { where: { sectionId?: string; createdAt?: { gte: Date } } }) => {
          return historyStore.filter(h => {
            if (where.sectionId && h.sectionId !== where.sectionId) return false;
            if (where.createdAt?.gte && h.createdAt < where.createdAt.gte) return false;
            return true;
          }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        },
        findFirst: async ({ where, orderBy }: { where: { id?: string; sectionId?: string }; orderBy?: { createdAt: 'asc' | 'desc' } }) => {
          let results = historyStore.filter(h => {
            if (where.id && h.id !== where.id) return false;
            if (where.sectionId && h.sectionId !== where.sectionId) return false;
            return true;
          });
          if (orderBy?.createdAt === 'asc') {
            results = results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          } else {
            results = results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          }
          return results[0] ?? null;
        },
        create: async ({ data }: { data: { sectionId: string; editorId: string; contentBefore: object; contentAfter: object } }) => {
          const record = {
            id: `history-${Date.now()}-${Math.random()}`,
            sectionId: data.sectionId,
            editorId: data.editorId,
            contentBefore: data.contentBefore,
            contentAfter: data.contentAfter,
            createdAt: new Date(),
            editor: { id: TEST_USER_ID, name: 'Test Section User', email: 'test-section-api@example.com' },
          };
          historyStore.push(record);
          return record;
        },
        deleteMany: async ({ where }: { where: { sectionId?: string } }) => {
          const before = historyStore.length;
          historyStore = historyStore.filter(h => {
            if (where.sectionId && h.sectionId === where.sectionId) return false;
            return true;
          });
          return { count: before - historyStore.length };
        },
      },
      user: {
        create: async ({ data }: { data: { email: string; passwordHash: string; name: string; role: string } }) => {
          return { id: TEST_USER_ID, ...data };
        },
        delete: async () => ({ id: TEST_USER_ID }),
      },
      $transaction: mockTransaction,
    },
    default: {
      section: { findMany: vi.fn(), findUnique: vi.fn() },
    },
  };
});

// ─── Test suite ───────────────────────────────────────────────────────────────
describe('CMS Section API Routes', () => {
  beforeEach(() => {
    // Reset in-memory stores
    sectionStore = {
      [TEST_SECTION_ID]: {
        id: TEST_SECTION_ID,
        type: 'HERO',
        title: 'Hero Section Test',
        content: { ...initialContent },
        isVisible: true,
        order: 1,
        updatedAt: new Date(),
      },
    };
    historyStore = [];

    // Default: authenticated session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: TEST_USER_ID, email: 'test-section-api@example.com', name: 'Test Section User' },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
  });

  it('GET /api/admin/sections — should list all sections', async () => {
    const response = await getSections();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);

    const testSection = data.data.find((s: { id: string }) => s.id === TEST_SECTION_ID);
    expect(testSection).toBeDefined();
    expect(testSection.type).toBe('HERO');
    expect(testSection.title).toBe('Hero Section Test');
  });

  it('PUT /api/admin/sections/[id] — should update section content', async () => {
    const newContent = {
      headline: 'Updated Headline',
      subheadline: 'Updated Subheadline',
      backgroundType: 'image',
      backgroundUrl: 'https://example.com/new-bg.jpg',
      ctaText: 'Updated CTA',
      ctaTarget: '#updated',
    };

    const request = new NextRequest('http://localhost:3000/api/admin/sections/' + TEST_SECTION_ID, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent }),
    });

    const response = await updateSection(request, { params: Promise.resolve({ id: TEST_SECTION_ID }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.content).toEqual(newContent);

    // Verify ContentHistory was created
    expect(historyStore.length).toBeGreaterThan(0);
    const history = historyStore[historyStore.length - 1];
    expect(history?.editorId).toBe(TEST_USER_ID);
    expect(history?.contentAfter).toEqual(newContent);
  });

  it('PUT /api/admin/sections/[id] — should reject invalid content', async () => {
    const invalidContent = {
      headline: '', // Empty headline should fail validation
      subheadline: 'Test',
      backgroundType: 'image',
      backgroundUrl: 'https://example.com/bg.jpg',
      ctaText: 'Test',
    };

    const request = new NextRequest('http://localhost:3000/api/admin/sections/' + TEST_SECTION_ID, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: invalidContent }),
    });

    const response = await updateSection(request, { params: Promise.resolve({ id: TEST_SECTION_ID }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Nội dung không hợp lệ');
  });

  it('PUT /api/admin/sections/[id] — should update isVisible toggle', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/sections/' + TEST_SECTION_ID, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: false }),
    });

    const response = await updateSection(request, { params: Promise.resolve({ id: TEST_SECTION_ID }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.isVisible).toBe(false);

    // Restore visibility
    const restoreRequest = new NextRequest('http://localhost:3000/api/admin/sections/' + TEST_SECTION_ID, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: true }),
    });
    await updateSection(restoreRequest, { params: Promise.resolve({ id: TEST_SECTION_ID }) });
    expect(sectionStore[TEST_SECTION_ID]?.isVisible).toBe(true);
  });

  it('GET /api/admin/sections/[id]/history — should return edit history', async () => {
    // First create some history by doing an update
    const updateRequest = new NextRequest('http://localhost:3000/api/admin/sections/' + TEST_SECTION_ID, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { ...initialContent, headline: 'Changed' } }),
    });
    await updateSection(updateRequest, { params: Promise.resolve({ id: TEST_SECTION_ID }) });

    const request = new NextRequest('http://localhost:3000/api/admin/sections/' + TEST_SECTION_ID + '/history', {
      method: 'GET',
    });

    const response = await getHistory(request, { params: Promise.resolve({ id: TEST_SECTION_ID }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);

    // Verify history includes editor info
    const firstHistory = data.data[0];
    expect(firstHistory.editor).toBeDefined();
    expect(firstHistory.editor.name).toBe('Test Section User');
    expect(firstHistory.editor.email).toBe('test-section-api@example.com');
  });

  it('POST /api/admin/sections/[id]/restore — should restore to previous version', async () => {
    // Create history by doing an update first
    const updateRequest = new NextRequest('http://localhost:3000/api/admin/sections/' + TEST_SECTION_ID, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { ...initialContent, headline: 'Changed Headline' } }),
    });
    await updateSection(updateRequest, { params: Promise.resolve({ id: TEST_SECTION_ID }) });

    expect(historyStore.length).toBeGreaterThan(0);
    const historyId = historyStore[0]!.id;
    const originalContent = historyStore[0]!.contentBefore;

    const request = new NextRequest('http://localhost:3000/api/admin/sections/' + TEST_SECTION_ID + '/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historyId }),
    });

    const response = await restoreSection(request, { params: Promise.resolve({ id: TEST_SECTION_ID }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.content).toEqual(originalContent);

    // Verify a new ContentHistory was created for the restore action
    const newHistory = historyStore[historyStore.length - 1];
    expect(newHistory).toBeDefined();
    expect(newHistory?.contentAfter).toEqual(originalContent);
  });

  it('POST /api/admin/sections/[id]/restore — should reject invalid historyId', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/sections/' + TEST_SECTION_ID + '/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historyId: 'invalid-id' }),
    });

    const response = await restoreSection(request, { params: Promise.resolve({ id: TEST_SECTION_ID }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Lịch sử chỉnh sửa không tồn tại');
  });

  it('should require authentication for all routes', async () => {
    // Mock unauthenticated session
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const response = await getSections();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });
});
