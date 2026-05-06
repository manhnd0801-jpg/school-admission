/**
 * CMS API route for assigning a lead to a staff member
 *
 * POST /api/admin/leads/[id]/assign — Assign lead to a staff member
 *
 * Route is protected by NextAuth.js session (getServerSession).
 *
 * Requirements: 10.6, 12.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

/**
 * POST /api/admin/leads/[id]/assign
 *
 * Request body:
 *   assignedToId — ID of the staff member to assign the lead to (required)
 *                  Pass null to unassign the lead.
 *
 * Logs AuditLog with action LEAD_ASSIGN.
 */
export async function POST(
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
    assignedToId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Dữ liệu request không hợp lệ' },
      { status: 400 }
    );
  }

  const { assignedToId } = body;

  // assignedToId must be present in the body (can be null to unassign)
  if (!('assignedToId' in body)) {
    return NextResponse.json(
      { success: false, error: 'Thiếu trường assignedToId' },
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

  // If assignedToId is provided (not null), verify the staff member exists and is active
  if (assignedToId !== null && assignedToId !== undefined) {
    if (typeof assignedToId !== 'string' || assignedToId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'ID nhân viên không hợp lệ' },
        { status: 400 }
      );
    }

    const staffMember = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: { id: true, name: true, isActive: true },
    });

    if (!staffMember) {
      return NextResponse.json(
        { success: false, error: 'Nhân viên không tồn tại' },
        { status: 404 }
      );
    }

    if (!staffMember.isActive) {
      return NextResponse.json(
        { success: false, error: 'Tài khoản nhân viên đã bị vô hiệu hóa' },
        { status: 400 }
      );
    }
  }

  // Update lead assignment
  let updatedLead;
  try {
    updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        assignedToId: assignedToId ?? null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  } catch (err) {
    console.error('[API POST /admin/leads/[id]/assign] DB error:', err);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    );
  }

  // Log audit (fire-and-forget)
  void logAudit(
    userId,
    'LEAD_ASSIGN',
    'Lead',
    id,
    {
      parentName: lead.parentName,
      phone: lead.phone,
      previousAssignedToId: lead.assignedToId,
      newAssignedToId: assignedToId ?? null,
    },
    request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined
  );

  return NextResponse.json(
    { success: true, data: updatedLead },
    { status: 200 }
  );
}
