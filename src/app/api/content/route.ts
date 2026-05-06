/**
 * GET /api/content — Public content endpoint
 *
 * Returns all visible sections ordered by `order` ascending.
 * Configured with ISR revalidation every 60 seconds.
 *
 * Response: { success: true, data: Section[] }
 *
 * Requirements: 1.1, 6.2
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ISR: revalidate every 60 seconds
export const revalidate = 60;

export async function GET(): Promise<NextResponse> {
  try {
    const sections = await prisma.section.findMany({
      where: {
        isVisible: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: sections,
    });
  } catch (error) {
    console.error('[API /content] Failed to fetch sections:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể tải nội dung trang' },
      { status: 500 }
    );
  }
}
