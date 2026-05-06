/**
 * CMS API routes for articles
 *
 * GET  /api/admin/articles — List articles with filter/search/pagination (20/page)
 * POST /api/admin/articles — Create a new article
 *
 * Both routes are protected by NextAuth.js session (getServerSession).
 *
 * Requirements: 7.1, 7.3, 7.4, 7.7, 7.8, 7.10, 12.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ArticleStatus } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { generateSlug } from '@/lib/slug';
import { validateArticle } from '@/lib/validation';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * GET /api/admin/articles
 *
 * Query params:
 *   page     — page number (default 1)
 *   limit    — items per page (default 20)
 *   search   — title search (case-insensitive)
 *   category — filter by category
 *   status   — filter by ArticleStatus enum value
 *
 * Returns: { data: Article[], total, page, totalPages }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = request.nextUrl;

  // Parse pagination params
  const page = Math.max(1, parseInt(searchParams.get('page') ?? String(DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const limit = Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT);
  const skip = (page - 1) * limit;

  // Parse filter params
  const search = searchParams.get('search')?.trim() ?? '';
  const category = searchParams.get('category')?.trim() ?? '';
  const statusParam = searchParams.get('status')?.trim() ?? '';

  // Validate status param if provided
  const validStatuses: ArticleStatus[] = ['DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED'];
  let statusFilter: ArticleStatus | undefined;
  if (statusParam) {
    if (!validStatuses.includes(statusParam as ArticleStatus)) {
      return NextResponse.json(
        { success: false, error: `Trạng thái không hợp lệ. Giá trị hợp lệ: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }
    statusFilter = statusParam as ArticleStatus;
  }

  // Build where clause
  const where = {
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(category ? { category: { equals: category, mode: 'insensitive' as const } } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  try {
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          category: true,
          status: true,
          publishedAt: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: articles,
        total,
        page,
        totalPages,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[API GET /admin/articles] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/articles
 *
 * Required fields: title, content, category, coverImage
 * Optional fields: excerpt, scheduledAt
 *
 * Auto-generates slug from title using generateSlug().
 * Default status: DRAFT
 * Logs AuditLog after creation.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const authorId = (session.user as { id?: string }).id;
  if (!authorId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Parse request body
  let body: {
    title?: string;
    content?: string;
    category?: string;
    coverImage?: string;
    excerpt?: string;
    scheduledAt?: string;
    slug?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Dữ liệu request không hợp lệ' },
      { status: 400 }
    );
  }

  const { title, content, category, coverImage, excerpt, scheduledAt, slug: customSlug } = body;

  // Validate required fields
  const validation = validateArticle({ title, content, category, coverImage });
  if (!validation.isValid) {
    return NextResponse.json(
      { success: false, error: 'Dữ liệu không hợp lệ', details: validation.errors },
      { status: 400 }
    );
  }

  // Generate unique slug from title or use custom slug
  const baseSlug = customSlug?.trim() || generateSlug(title!);

  // Find existing slugs that start with the base slug to generate a unique one
  let slug = baseSlug;
  try {
    const existingArticles = await prisma.article.findMany({
      where: {
        slug: {
          startsWith: baseSlug,
        },
      },
      select: { slug: true },
    });
    const existingSlugs = existingArticles.map((a) => a.slug);

    if (existingSlugs.includes(baseSlug)) {
      let counter = 2;
      while (existingSlugs.includes(`${baseSlug}-${counter}`)) {
        counter++;
      }
      slug = `${baseSlug}-${counter}`;
    }
  } catch (err) {
    console.error('[API POST /admin/articles] Slug check error:', err);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    );
  }

  // Parse scheduledAt if provided
  let scheduledAtDate: Date | undefined;
  if (scheduledAt) {
    scheduledAtDate = new Date(scheduledAt);
    if (isNaN(scheduledAtDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Thời gian lên lịch không hợp lệ' },
        { status: 400 }
      );
    }
  }

  // Create article
  let article;
  try {
    article = await prisma.article.create({
      data: {
        title: title!,
        slug,
        content: content!,
        category: category!,
        coverImage: coverImage!,
        excerpt: excerpt ?? undefined,
        scheduledAt: scheduledAtDate ?? undefined,
        status: 'DRAFT',
        authorId,
      },
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
    console.error('[API POST /admin/articles] DB error:', err);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    );
  }

  // Log audit (fire-and-forget)
  void logAudit(
    authorId,
    'ARTICLE_CREATE',
    'Article',
    article.id,
    { title: article.title, slug: article.slug, status: article.status },
    request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined
  );

  return NextResponse.json(
    { success: true, data: article },
    { status: 201 }
  );
}
