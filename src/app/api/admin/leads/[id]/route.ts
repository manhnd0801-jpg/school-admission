/**
 * CMS API route for a specific lead
 *
 * PATCH /api/admin/leads/[id] — Update lead status or add note
 *
 * Route is protected by NextAuth.js session (getServerSession).
 *
 * Requirements: 10.2, 10.3, 10.7, 12.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { LeadStatus } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

/**
 * PATCH /api/admin/leads/[id]
 *
 * Request body (all optional):
 *   status — new LeadStatus value (creates LeadStatusHistory entry)
 *   note   — note content (creates LeadNote entry)
 *
 * When status changes:
 *   - Creates LeadStatusHistory record with fromStatus, toStatus, changedBy
 *   - Logs AuditLog with action LEAD_STATUS_CHANGE
 *
 * When note is provided:
 *   - Creates LeadNote record with author
 */
export async function PATCH(
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

  // Parse request body
  let body: {
    status?: string;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Dữ liệu request không hợp lệ' },
      { status: 400 }
    );
  }

  const { status, note } = body;

  // Must have at least one field to update
  if (status === undefined && note === undefined) {
    return NextResponse.json(
      { success: false, error: 'Không có dữ liệu để cập nhật' },
      { status: 400 }
    );
  }

  // Fetch current lead
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json(
      { success: false, error: 'Lead không tồn tại' },
      { status: 404 }
    );
  }

  // Validate status if provided
  let newStatus: LeadStatus | undefined;
  if (status !== undefined) {
    const validStatuses: LeadStatus[] = ['NEW', 'CONTACTED', 'CONSULTING', 'REGISTERED', 'DROPPED'];
    if (!validStatuses.includes(status as LeadStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Trạng thái không hợp lệ. Giá trị hợp lệ: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }
    newStatus = status as LeadStatus;
  }

  // Validate note if provided
  if (note !== undefined && (!note || note.trim() === '')) {
    return NextResponse.json(
      { success: false, error: 'Ghi chú không được để trống' },
      { status: 400 }
    );
  }

  try {
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update lead status if provided
      let updatedLead = lead;
      if (newStatus !== undefined && newStatus !== lead.status) {
        updatedLead = await tx.lead.update({
          where: { id },
          data: { status: newStatus },
        });

        // Create LeadStatusHistory entry
        await tx.leadStatusHistory.create({
          data: {
            leadId: id,
            fromStatus: lead.status,
            toStatus: newStatus,
            changedById: userId,
          },
        });
      }

      // Create LeadNote if note is provided
      if (note !== undefined && note.trim() !== '') {
        await tx.leadNote.create({
          data: {
            leadId: id,
            authorId: userId,
            content: note.trim(),
          },
        });
      }

      // Fetch updated lead with relations
      const finalLead = await tx.lead.findUnique({
        where: { id },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          statusHistory: {
            orderBy: { changedAt: 'desc' },
            take: 5,
            include: {
              changedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return { updatedLead, statusChanged: newStatus !== undefined && newStatus !== lead.status };
    });

    // Log audit for status change (fire-and-forget)
    if (result.statusChanged) {
      void logAudit(
        userId,
        'LEAD_STATUS_CHANGE',
        'Lead',
        id,
        {
          parentName: lead.parentName,
          phone: lead.phone,
          fromStatus: lead.status,
          toStatus: newStatus,
        },
        request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined
      );
    }

    return NextResponse.json(
      { success: true, data: result.updatedLead },
      { status: 200 }
    );
  } catch (err) {
    console.error('[API PATCH /admin/leads/[id]] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    );
  }
}
