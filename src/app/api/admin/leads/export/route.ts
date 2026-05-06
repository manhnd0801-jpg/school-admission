/**
 * GET /api/admin/leads/export — Export leads to Excel (.xlsx)
 *
 * Logic:
 *   - Accept same filter params as GET /api/admin/leads
 *   - Count matching leads:
 *       ≤ 1000 → generate Excel with ExcelJS, stream directly as response
 *       > 1000 → enqueue BullMQ job to `lead-export` queue, return { jobId }
 *   - Create ExportLog record after successful direct export
 *
 * Requirements: 10.9, 10.10
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { LeadStatus } from '@prisma/client';
import ExcelJS from 'exceljs';
import { Queue } from 'bullmq';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIRECT_EXPORT_THRESHOLD = 1000;

// ---------------------------------------------------------------------------
// BullMQ queue for async export
// ---------------------------------------------------------------------------

const redisConnection = {
  host: (() => {
    const url = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
    try {
      return new URL(url).hostname;
    } catch {
      return 'localhost';
    }
  })(),
  port: (() => {
    const url = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
    try {
      return parseInt(new URL(url).port || '6379', 10);
    } catch {
      return 6379;
    }
  })(),
};

export interface LeadExportJobData {
  filters: {
    status?: LeadStatus;
    expectedYear?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  };
  exportedById: string;
  exportedByName: string;
}

let leadExportQueue: Queue<LeadExportJobData> | null = null;

function getLeadExportQueue(): Queue<LeadExportJobData> {
  if (!leadExportQueue) {
    leadExportQueue = new Queue<LeadExportJobData>('lead-export', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    });
  }
  return leadExportQueue;
}

// ---------------------------------------------------------------------------
// Filter parsing helpers (shared with leads list route)
// ---------------------------------------------------------------------------

const VALID_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'CONSULTING', 'REGISTERED', 'DROPPED'];

function parseFilters(searchParams: URLSearchParams): {
  error?: NextResponse;
  where: Record<string, unknown>;
  filters: LeadExportJobData['filters'];
} {
  const statusParam = searchParams.get('status')?.trim() ?? '';
  const expectedYearParam = searchParams.get('expectedYear')?.trim() ?? '';
  const startDateParam = searchParams.get('startDate')?.trim() ?? '';
  const endDateParam = searchParams.get('endDate')?.trim() ?? '';
  const search = searchParams.get('search')?.trim() ?? '';

  let statusFilter: LeadStatus | undefined;
  if (statusParam) {
    if (!VALID_STATUSES.includes(statusParam as LeadStatus)) {
      return {
        error: NextResponse.json(
          { success: false, error: `Trạng thái không hợp lệ. Giá trị hợp lệ: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        ),
        where: {},
        filters: {},
      };
    }
    statusFilter = statusParam as LeadStatus;
  }

  let expectedYearFilter: number | undefined;
  if (expectedYearParam) {
    const year = parseInt(expectedYearParam, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      return {
        error: NextResponse.json(
          { success: false, error: 'Năm học dự kiến không hợp lệ' },
          { status: 400 }
        ),
        where: {},
        filters: {},
      };
    }
    expectedYearFilter = year;
  }

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (startDateParam) {
    startDate = new Date(startDateParam);
    if (isNaN(startDate.getTime())) {
      return {
        error: NextResponse.json(
          { success: false, error: 'Ngày bắt đầu không hợp lệ' },
          { status: 400 }
        ),
        where: {},
        filters: {},
      };
    }
  }

  if (endDateParam) {
    endDate = new Date(endDateParam);
    if (isNaN(endDate.getTime())) {
      return {
        error: NextResponse.json(
          { success: false, error: 'Ngày kết thúc không hợp lệ' },
          { status: 400 }
        ),
        where: {},
        filters: {},
      };
    }
    endDate.setHours(23, 59, 59, 999);
  }

  const where: Record<string, unknown> = {};

  if (statusFilter) where['status'] = statusFilter;
  if (expectedYearFilter !== undefined) where['expectedYear'] = expectedYearFilter;
  if (startDate || endDate) {
    where['createdAt'] = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }
  if (search) {
    where['OR'] = [
      { parentName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  return {
    where,
    filters: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(expectedYearFilter !== undefined ? { expectedYear: expectedYearFilter } : {}),
      ...(startDateParam ? { startDate: startDateParam } : {}),
      ...(endDateParam ? { endDate: endDateParam } : {}),
      ...(search ? { search } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Excel generation
// ---------------------------------------------------------------------------

type LeadRow = {
  id: string;
  parentName: string;
  phone: string;
  email: string | null;
  studentName: string;
  expectedYear: number;
  note: string | null;
  status: LeadStatus;
  privacyConsent: boolean;
  sourceIp: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignedTo: { id: string; name: string; email: string } | null;
};

export async function buildExcelBuffer(leads: LeadRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CMS Tuyển Sinh';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Danh sách Lead', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // Define columns
  sheet.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Họ tên phụ huynh', key: 'parentName', width: 25 },
    { header: 'Số điện thoại', key: 'phone', width: 15 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Tên học sinh', key: 'studentName', width: 22 },
    { header: 'Năm học dự kiến', key: 'expectedYear', width: 18 },
    { header: 'Ghi chú', key: 'note', width: 30 },
    { header: 'Trạng thái', key: 'status', width: 16 },
    { header: 'Đồng ý CSBT', key: 'privacyConsent', width: 14 },
    { header: 'IP nguồn', key: 'sourceIp', width: 16 },
    { header: 'Người phụ trách', key: 'assignedTo', width: 22 },
    { header: 'Ngày đăng ký', key: 'createdAt', width: 20 },
    { header: 'Cập nhật lần cuối', key: 'updatedAt', width: 20 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0071E3' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 20;

  // Status label map
  const statusLabels: Record<LeadStatus, string> = {
    NEW: 'Mới',
    CONTACTED: 'Đã liên hệ',
    CONSULTING: 'Đang tư vấn',
    REGISTERED: 'Đã đăng ký',
    DROPPED: 'Không tiếp tục',
  };

  // Add data rows
  leads.forEach((lead, index) => {
    sheet.addRow({
      stt: index + 1,
      parentName: lead.parentName,
      phone: lead.phone,
      email: lead.email ?? '',
      studentName: lead.studentName,
      expectedYear: lead.expectedYear,
      note: lead.note ?? '',
      status: statusLabels[lead.status] ?? lead.status,
      privacyConsent: lead.privacyConsent ? 'Có' : 'Không',
      sourceIp: lead.sourceIp ?? '',
      assignedTo: lead.assignedTo?.name ?? '',
      createdAt: lead.createdAt.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      updatedAt: lead.updatedAt.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    });
  });

  // Auto-filter on header row
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columns.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const { error, where, filters } = parseFilters(searchParams);
  if (error) return error;

  try {
    // Count matching leads
    const count = await prisma.lead.count({ where });

    if (count > DIRECT_EXPORT_THRESHOLD) {
      // Async path: enqueue BullMQ job
      const queue = getLeadExportQueue();
      const job = await queue.add('export', {
        filters,
        exportedById: (session.user as { id?: string }).id ?? '',
        exportedByName: session.user.name ?? session.user.email ?? 'Unknown',
      });

      return NextResponse.json(
        { success: true, jobId: job.id, count },
        { status: 202 }
      );
    }

    // Direct export path: fetch all leads and generate Excel
    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
          select: { id: true, name: true, email: true },
        },
      },
    });

    const buffer = await buildExcelBuffer(leads);

    // Create ExportLog record
    const userId = (session.user as { id?: string }).id;
    if (userId) {
      await prisma.exportLog.create({
        data: {
          exportedById: userId,
          recordCount: leads.length,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          filters: Object.keys(filters).length > 0 ? (filters as any) : undefined,
        },
      });

      // Audit log
      await logAudit(
        userId,
        'LEAD_EXPORT',
        'Lead',
        undefined,
        { count: leads.length, filters },
        request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined
      );
    }

    // Build filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `leads-export-${timestamp}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[API GET /admin/leads/export] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    );
  }
}
