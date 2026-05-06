/**
 * GET /api/articles/[slug] — Public article detail endpoint
 *
 * Returns a single article by slug.
 * Returns 404 if the article is not found or status !== PUBLISHED.
 *
 * Response: { success: true, data: article } or 404
 *
 * Configured with ISR revalidation every 60 seconds.
 *
 * Requirements: 8.4, 8.5, 8.6, 7.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ISR: revalidate every 60 seconds
export const revalidate = 60;

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json(
      { success: false, error: 'Slug không hợp lệ' },
      { status: 400 }
    );
  }

  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Return 404 if not found or not published
    if (!article || article.status !== 'PUBLISHED') {
      return NextResponse.json(
        { success: false, error: 'Bài viết không tồn tại hoặc chưa được xuất bản' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error(`[API /articles/${slug}] Failed to fetch article:`, error);
    return NextResponse.json(
      { success: false, error: 'Không thể tải bài viết' },
      { status: 500 }
    );
  }
}
