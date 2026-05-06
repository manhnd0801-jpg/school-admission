/**
 * POST /api/admin/sections/[id]/restore — Restore section to a previous version
 *
 * Protected: requires valid NextAuth.js session.
 *
 * Request body: { historyId: string }
 *
 * Flow:
 *   1. Check authentication (getServerSession)
 *   2. Parse request body: { historyId }
 *   3. Fetch ContentHistory record (must belong to this section)
 *   4. Fetch current section (404 if not found)
 *   5. Restore section.content to history.contentBefore
 *   6. Create new ContentHistory entry for the restore action
 *   7. Log AuditLog via logAudit()
 *   8. Call revalidateLandingPage() to trigger on-demand ISR
 *   9. Return updated section
 *
 * Requirements: 6.7, 6.2, 12.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { revalidateLandingPage } from '@/lib/revalidate';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // 1. Authentication check
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const editorId = (session.user as { id?: string }).id;

  if (!editorId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2. Parse request body
  let body: { historyId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Dữ liệu request không hợp lệ' },
      { status: 400 }
    );
  }

  const { historyId } = body;

  if (!historyId || typeof historyId !== 'string') {
    return NextResponse.json(
      { success: false, error: 'historyId là bắt buộc' },
      { status: 400 }
    );
  }

  // 3. Fetch ContentHistory record — must belong to this section
  const historyRecord = await prisma.contentHistory.findFirst({
    where: { id: historyId, sectionId: id },
  });

  if (!historyRecord) {
    return NextResponse.json(
      { success: false, error: 'Lịch sử chỉnh sửa không tồn tại' },
      { status: 404 }
    );
  }

  // 4. Fetch current section
  const section = await prisma.section.findUnique({ where: { id } });
  if (!section) {
    return NextResponse.json(
      { success: false, error: 'Section không tồn tại' },
      { status: 404 }
    );
  }

  // 5 & 6. Restore content + create new ContentHistory in a transaction
  let restoredSection;
  try {
    restoredSection = await prisma.$transaction(async (tx) => {
      const updated = await tx.section.update({
        where: { id },
        data: { content: historyRecord.contentBefore as object },
      });

      // Create a new ContentHistory entry for the restore action
      await tx.contentHistory.create({
        data: {
          sectionId: id,
          editorId,
          contentBefore: section.content as object,
          contentAfter: historyRecord.contentBefore as object,
        },
      });

      return updated;
    });
  } catch (err) {
    console.error('[API POST /admin/sections/[id]/restore] DB error:', err);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    );
  }

  // 7. Log audit (fire-and-forget)
  void logAudit(
    editorId,
    'CONTENT_RESTORE',
    'Section',
    id,
    {
      type: section.type,
      restoredFromHistoryId: historyId,
    },
    request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined
  );

  // 8. Trigger on-demand ISR revalidation
  revalidateLandingPage();

  return NextResponse.json(
    { success: true, data: restoredSection },
    { status: 200 }
  );
}
