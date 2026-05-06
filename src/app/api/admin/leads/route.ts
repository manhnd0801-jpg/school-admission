/**
 * CMS API route for leads list
 *
 * GET /api/admin/leads — List leads with filter/search/pagination (50/page)
 *
 * Route is protected by NextAuth.js session (getServerSession).
 *
 * Requirements: 10.1, 10.2, 10.4, 10.5, 10.8, 12.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { LeadStatus } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;

/**
 * GET /api/admin/leads
 *
 * Query params:
 *   page         — page number (default 1)
 *   status       — filter by LeadStatus enum value
 *   expectedYear — filter by expected enrollment year (integer)
 *   startDate    — filter leads created on or after this date (ISO 8601)
 *   endDate      — filter leads created on or before this date (ISO 8601)
 *   search       — search by parentName or phone (case-insensitive)
 *
 * Returns: { success: true, data: Lead[], total, page, totalPages }
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
  const skip = (page - 1) * DEFAULT_LIMIT;

  // Parse filter params
  const statusParam = searchParams.get('status')?.trim() ?? '';
  const expectedYearParam = searchParams.get('expectedYear')?.trim() ?? '';
  const startDateParam = searchParams.get('startDate')?.trim() ?? '';
  const endDateParam = searchParams.get('endDate')?.trim() ?? '';
  const search = searchParams.get('search')?.trim() ?? '';

  // Validate status param if provided
  const validStatuses: LeadStatus[] = ['NEW', 'CONTACTED', 'CONSULTING', 'REGISTERED', 'DROPPED'];
  let statusFilter: LeadStatus | undefined;
  if (statusParam) {
    if (!validStatuses.includes(statusParam as LeadStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Trạng thái không hợp lệ. Giá trị hợp lệ: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }
    statusFilter = statusParam as LeadStatus;
  }

  // Validate expectedYear if provided
  let expectedYearFilter: number | undefined;
  if (expectedYearParam) {
    const year = parseInt(expectedYearParam, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { success: false, error: 'Năm học dự kiến không hợp lệ' },
        { status: 400 }
      );
    }
    expectedYearFilter = year;
  }

  // Validate date range if provided
  let startDate: Date | undefined;
  let endDate: Date | undefined;
  if (startDateParam) {
    startDate = new Date(startDateParam);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Ngày bắt đầu không hợp lệ' },
        { status: 400 }
      );
    }
  }
  if (endDateParam) {
    endDate = new Date(endDateParam);
    if (isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Ngày kết thúc không hợp lệ' },
        { status: 400 }
      );
    }
    // Include the entire end date day
    endDate.setHours(23, 59, 59, 999);
  }

  // Build where clause
  const where: Record<string, unknown> = {};

  if (statusFilter) {
    where['status'] = statusFilter;
  }

  if (expectedYearFilter !== undefined) {
    where['expectedYear'] = expectedYearFilter;
  }

  if (startDate || endDate) {
    where['createdAt'] = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }

  // Search by parentName or phone
  if (search) {
    where['OR'] = [
      { parentName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: DEFAULT_LIMIT,
        select: {
          id: true,
          parentName: true,
          phone: true,
          email: true,
          studentName: true,
          expectedYear: true,
          note: true,
          status: true,
          privacyConsent: true,
          sourceIp: true,
          createdAt: true,
          updatedAt: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    const totalPages = Math.ceil(total / DEFAULT_LIMIT);

    return NextResponse.json(
      {
        success: true,
        data: leads,
        total,
        page,
        totalPages,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[API GET /admin/leads] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    );
  }
}
