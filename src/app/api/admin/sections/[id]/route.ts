/**
 * PUT /api/admin/sections/[id] — Update section content
 *
 * Protected: requires valid NextAuth.js session.
 *
 * Flow:
 *   1. Check authentication (getServerSession)
 *   2. Parse request body: { content?, isVisible? }
 *   3. Fetch current section from DB (404 if not found)
 *   4. If content is provided, validate using validateSectionContent(type, content)
 *   5. Update section in DB
 *   6. Create ContentHistory record (contentBefore, contentAfter, editorId)
 *   7. Log AuditLog via logAudit()
 *   8. Call revalidateLandingPage() to trigger on-demand ISR
 *   9. Return updated section
 *
 * Requirements: 6.1, 6.2, 6.6, 12.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateSectionContent } from '@/schemas/section-content';
import { logAudit } from '@/lib/audit';
import { revalidateLandingPage } from '@/lib/revalidate';

export async function PUT(
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
  let body: { content?: unknown; isVisible?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Dữ liệu request không hợp lệ' },
      { status: 400 }
    );
  }

  const { content, isVisible } = body;

  // Must provide at least one field to update
  if (content === undefined && isVisible === undefined) {
    return NextResponse.json(
      { success: false, error: 'Không có dữ liệu để cập nhật' },
      { status: 400 }
    );
  }

  // 3. Fetch current section
  const section = await prisma.section.findUnique({ where: { id } });
  if (!section) {
    return NextResponse.json(
      { success: false, error: 'Section không tồn tại' },
      { status: 404 }
    );
  }

  // 4. Validate content if provided
  if (content !== undefined) {
    const validation = validateSectionContent(section.type, content);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nội dung không hợp lệ',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }
  }

  // 5. Build update data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: { content?: any; isVisible?: boolean } = {};
  if (content !== undefined) updateData.content = content;
  if (isVisible !== undefined) updateData.isVisible = isVisible;

  // 6. Update section + create ContentHistory in a transaction
  let updatedSection;
  try {
    updatedSection = await prisma.$transaction(async (tx) => {
      const updated = await tx.section.update({
        where: { id },
        data: updateData,
      });

      // Create ContentHistory record
      await tx.contentHistory.create({
        data: {
          sectionId: id,
          editorId,
          contentBefore: section.content as object,
          contentAfter: (content !== undefined ? content : section.content) as object,
        },
      });

      return updated;
    });
  } catch (err) {
    console.error('[API PUT /admin/sections/[id]] DB error:', err);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    );
  }

  // 7. Log audit (fire-and-forget)
  void logAudit(
    editorId,
    'CONTENT_UPDATE',
    'Section',
    id,
    {
      type: section.type,
      isVisibleChanged: isVisible !== undefined,
      contentChanged: content !== undefined,
    },
    request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined
  );

  // 8. Trigger on-demand ISR revalidation
  revalidateLandingPage();

  return NextResponse.json(
    { success: true, data: updatedSection },
    { status: 200 }
  );
}
