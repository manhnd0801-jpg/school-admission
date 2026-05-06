/**
 * GET /api/admin/sections/[id]/history — Get edit history for a section
 *
 * Protected: requires valid NextAuth.js session.
 *
 * Returns the last 30 days of ContentHistory records for the given section,
 * ordered by createdAt descending. Each record includes editor name/email.
 *
 * Requirements: 6.6, 6.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;

  // Verify section exists
  const section = await prisma.section.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!section) {
    return NextResponse.json(
      { success: false, error: 'Section không tồn tại' },
      { status: 404 }
    );
  }

  // Compute 30-day cutoff
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const history = await prisma.contentHistory.findMany({
      where: {
        sectionId: id,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sectionId: true,
        contentBefore: true,
        contentAfter: true,
        createdAt: true,
        editor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: history }, { status: 200 });
  } catch (err) {
    console.error('[API GET /admin/sections/[id]/history] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    );
  }
}
