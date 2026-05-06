/**
 * CMS API routes for a specific article
 *
 * PUT    /api/admin/articles/[id] — Update article
 * DELETE /api/admin/articles/[id] — Hard delete article
 *
 * Both routes are protected by NextAuth.js session (getServerSession).
 *
 * Requirements: 7.1, 7.4, 7.5, 7.6, 7.9, 12.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ArticleStatus } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { revalidateArticle } from '@/lib/revalidate';

/**
 * Valid status transitions map.
 *
 * Key: current status
 * Value: set of statuses the article can transition to
 *
 * DRAFT → PENDING (any role)
 * DRAFT → PUBLISHED (admin only — enforced separately)
 * PENDING → PUBLISHED (any role)
 * PENDING → DRAFT (any role)
 * PUBLISHED → ARCHIVED (any role)
 * ARCHIVED → DRAFT (any role)
 */
const VALID_TRANSITIONS: Record<ArticleStatus, ArticleStatus[]> = {
  DRAFT: ['PENDING', 'PUBLISHED'],
  PENDING: ['PUBLISHED', 'DRAFT'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: ['DRAFT'],
};

/**
 * Transitions that require ADMIN role.
 */
const ADMIN_ONLY_TRANSITIONS: Array<{ from: ArticleStatus; to: ArticleStatus }> = [
  { from: 'DRAFT', to: 'PUBLISHED' },
];

function isAdminOnlyTransition(from: ArticleStatus, to: ArticleStatus): boolean {
  return ADMIN_ONLY_TRANSITIONS.some((t) => t.from === from && t.to === to);
}

/**
 * GET /api/admin/articles/[id]
 *
 * Fetches a single article by ID.
 * Requirements: 7.2, 7.3
 */
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

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!article) {
    return NextResponse.json(
      { success: false, error: 'Bài viết không tồn tại' },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { success: true, data: article },
    { status: 200 }
  );
}

/**
 * PUT /api/admin/articles/[id]
 *
 * Supports partial updates. Validates required fields if provided.
 * Handles status transitions with role-based access control.
 * When status → PUBLISHED: sets publishedAt = now(), calls revalidateArticle(slug).
 * Supports scheduledAt for scheduled publish.
 * Logs AuditLog.
 */
export async function PUT(
  request: NextRequest,
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

  const userId = (session.user as { id?: string }).id;
  const userRole = (session.user as { role?: string }).role;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;

  // Parse request body
  let body: {
    title?: string;
    content?: string;
    category?: string;
    coverImage?: string;
    excerpt?: string;
    status?: string;
    scheduledAt?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Dữ liệu request không hợp lệ' },
      { status: 400 }
    );
  }

  // Fetch current article
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    return NextResponse.json(
      { success: false, error: 'Bài viết không tồn tại' },
      { status: 404 }
    );
  }

  // Validate provided fields
  const { title, content, category, coverImage, excerpt, status, scheduledAt } = body;

  // Validate individual fields if provided
  if (title !== undefined && (!title || title.trim() === '')) {
    return NextResponse.json(
      { success: false, error: 'Tiêu đề bài viết không được để trống' },
      { status: 400 }
    );
  }
  if (content !== undefined && (!content || content.trim() === '')) {
    return NextResponse.json(
      { success: false, error: 'Nội dung bài viết không được để trống' },
      { status: 400 }
    );
  }
  if (category !== undefined && (!category || category.trim() === '')) {
    return NextResponse.json(
      { success: false, error: 'Danh mục bài viết không được để trống' },
      { status: 400 }
    );
  }
  if (coverImage !== undefined && (!coverImage || coverImage.trim() === '')) {
    return NextResponse.json(
      { success: false, error: 'Ảnh đại diện bài viết không được để trống' },
      { status: 400 }
    );
  }

  // Validate and handle status transition
  let newStatus: ArticleStatus | undefined;
  let publishedAt: Date | undefined | null;

  if (status !== undefined) {
    const validStatuses: ArticleStatus[] = ['DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED'];
    if (!validStatuses.includes(status as ArticleStatus)) {
      return NextResponse.json(
        { success: false, error: `Trạng thái không hợp lệ. Giá trị hợp lệ: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const targetStatus = status as ArticleStatus;
    const currentStatus = article.status;

    // Check if transition is valid
    if (targetStatus !== currentStatus) {
      const allowedTransitions = VALID_TRANSITIONS[currentStatus] ?? [];
      if (!allowedTransitions.includes(targetStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: `Không thể chuyển trạng thái từ ${currentStatus} sang ${targetStatus}`,
          },
          { status: 400 }
        );
      }

      // Check admin-only transitions
      if (isAdminOnlyTransition(currentStatus, targetStatus) && userRole !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Bạn không có quyền thực hiện thao tác này' },
          { status: 403 }
        );
      }

      newStatus = targetStatus;

      // When transitioning to PUBLISHED, set publishedAt
      if (targetStatus === 'PUBLISHED') {
        publishedAt = new Date();
      }
    }
  }

  // Parse scheduledAt if provided
  let scheduledAtDate: Date | null | undefined;
  if (scheduledAt !== undefined) {
    if (scheduledAt === null) {
      scheduledAtDate = null; // explicitly clear
    } else {
      scheduledAtDate = new Date(scheduledAt);
      if (isNaN(scheduledAtDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Thời gian lên lịch không hợp lệ' },
          { status: 400 }
        );
      }
    }
  }

  // Build update data — only include fields that were provided
  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData['title'] = title;
  if (content !== undefined) updateData['content'] = content;
  if (category !== undefined) updateData['category'] = category;
  if (coverImage !== undefined) updateData['coverImage'] = coverImage;
  if (excerpt !== undefined) updateData['excerpt'] = excerpt;
  if (newStatus !== undefined) updateData['status'] = newStatus;
  if (publishedAt !== undefined) updateData['publishedAt'] = publishedAt;
  if (scheduledAtDate !== undefined) updateData['scheduledAt'] = scheduledAtDate;

  // Must have at least one field to update
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Không có dữ liệu để cập nhật' },
      { status: 400 }
    );
  }

  // Update article
  let updatedArticle;
  try {
    updatedArticle = await prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  } catch (err) {
    console.error('[API PUT /admin/articles/[id]] DB error:', err);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    );
  }

  // Trigger on-demand ISR revalidation when article is published
  if (newStatus === 'PUBLISHED') {
    revalidateArticle(updatedArticle.slug);
  }

  // Log audit (fire-and-forget)
  void logAudit(
    userId,
    'ARTICLE_UPDATE',
    'Article',
    id,
    {
      title: updatedArticle.title,
      slug: updatedArticle.slug,
      previousStatus: article.status,
      newStatus: updatedArticle.status,
      fieldsUpdated: Object.keys(updateData),
    },
    request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined
  );

  return NextResponse.json(
    { success: true, data: updatedArticle },
    { status: 200 }
  );
}

/**
 * DELETE /api/admin/articles/[id]
 *
 * Hard deletes the article.
 * Logs AuditLog.
 */
export async function DELETE(
  request: NextRequest,
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

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;

  // Fetch article to confirm it exists and capture metadata for audit log
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    return NextResponse.json(
      { success: false, error: 'Bài viết không tồn tại' },
      { status: 404 }
    );
  }

  // Hard delete
  try {
    await prisma.article.delete({ where: { id } });
  } catch (err) {
    console.error('[API DELETE /admin/articles/[id]] DB error:', err);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    );
  }

  // Log audit (fire-and-forget)
  void logAudit(
    userId,
    'ARTICLE_DELETE',
    'Article',
    id,
    { title: article.title, slug: article.slug, status: article.status },
    request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined
  );

  return NextResponse.json(
    { success: true, data: { id } },
    { status: 200 }
  );
}
