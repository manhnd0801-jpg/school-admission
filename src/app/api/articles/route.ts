/**
 * GET /api/articles — Public articles list endpoint
 *
 * Returns published articles, paginated.
 * Query params:
 *   - page (default: 1)
 *   - pageSize (default: 12)
 *
 * Filter: status = PUBLISHED, ordered by publishedAt descending.
 * Response: { success: true, data: { items, total, page, pageSize, totalPages } }
 *
 * Configured with ISR revalidation every 60 seconds.
 *
 * Requirements: 8.1, 8.2, 8.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ISR: revalidate every 60 seconds
export const revalidate = 60;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') ?? '12', 10) || 12);
  const skip = (page - 1) * pageSize;

  try {
    const [items, total] = await Promise.all([
      prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          category: true,
          publishedAt: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.article.count({
        where: {
          status: 'PUBLISHED',
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('[API /articles] Failed to fetch articles:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể tải danh sách bài viết' },
      { status: 500 }
    );
  }
}
