/**
 * GET /api/admin/sections — List all sections
 *
 * Protected: requires valid NextAuth.js session.
 *
 * Returns all sections ordered by `order` ascending, including
 * id, type, title, content, isVisible, order, updatedAt.
 *
 * Requirements: 6.1
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(): Promise<NextResponse> {
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const sections = await prisma.section.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        isVisible: true,
        order: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: sections }, { status: 200 });
  } catch (err) {
    console.error('[API GET /admin/sections] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    );
  }
}
