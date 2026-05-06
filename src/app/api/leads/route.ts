/**
 * POST /api/leads — Public lead submission endpoint
 *
 * Handles registration form submissions from the Landing Page.
 * Flow:
 *   1. Parse request body
 *   2. Validate input with validateForm → 400 if invalid
 *   3. Rate limit check: checkRateLimit('form:${ip}', 3, 3600) → 429 if blocked
 *   4. Privacy consent check: if !privacyConsent → 400
 *   5. Duplicate check: query DB for lead with same phone in last 24h (in transaction)
 *   6. If duplicate: return 200 { success: true, duplicate: true, message: '...' }
 *   7. INSERT lead into DB with status: NEW
 *   8. On success: send email notification (fire-and-forget), return 200 { success: true, leadId }
 *   9. On DB error: enqueue to BullMQ queue 'lead-submission', return 200 { success: true, queued: true }
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 12.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateForm } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { notifyTeam } from '@/lib/email';
import { leadSubmissionQueue } from '@/lib/queue';
import { prisma } from '@/lib/prisma';
import type { RegistrationFormData } from '@/types';

/**
 * Extracts the client IP address from the request headers.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Parse request body
  let body: Partial<RegistrationFormData>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // 2. Validate input
  const validation = validateForm(body);
  if (!validation.isValid) {
    return NextResponse.json(
      { success: false, error: 'Dữ liệu không hợp lệ', details: validation.errors },
      { status: 400 }
    );
  }

  // Cast to full RegistrationFormData after validation
  const formData = body as RegistrationFormData;

  // 3. Rate limit check
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`form:${ip}`, 3, 3600);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: `Vui lòng thử lại sau ${Math.ceil((rateLimit.retryAfter ?? 3600) / 60)} phút` },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfter ?? 3600),
        },
      }
    );
  }

  // 4. Privacy consent check
  if (!formData.privacyConsent) {
    return NextResponse.json(
      { success: false, error: 'Bạn phải đồng ý với chính sách bảo mật', details: { privacyConsent: 'Bắt buộc đồng ý' } },
      { status: 400 }
    );
  }

  // 5–8. Duplicate check + DB insert (in transaction to avoid race conditions)
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 5. Duplicate check within transaction
      const existing = await tx.lead.findFirst({
        where: {
          phone: formData.phone,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      // 6. Return duplicate result
      if (existing) {
        return { duplicate: true, lead: existing };
      }

      // 7. INSERT lead with status NEW
      const newLead = await tx.lead.create({
        data: {
          parentName: formData.parentName,
          phone: formData.phone,
          email: formData.email ?? null,
          studentName: formData.studentName,
          expectedYear: formData.expectedYear,
          note: formData.note ?? null,
          privacyConsent: formData.privacyConsent,
          sourceIp: ip,
          // status defaults to NEW per Prisma schema
        },
      });

      return { duplicate: false, lead: newLead };
    });

    if (result.duplicate) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: 'Số điện thoại này đã đăng ký, chúng tôi sẽ liên hệ sớm',
      });
    }

    // 8. Send email notification (fire-and-forget — do not await errors)
    notifyTeam({
      parentName: result.lead.parentName,
      phone: result.lead.phone,
      email: result.lead.email ?? undefined,
      studentName: result.lead.studentName,
      expectedYear: result.lead.expectedYear,
      note: result.lead.note ?? undefined,
    }).catch((err) => {
      console.error('[API /leads] Email notification failed:', err);
    });

    return NextResponse.json({
      success: true,
      leadId: result.lead.id,
    });
  } catch (dbError) {
    // 9. DB unavailable — fallback to BullMQ queue
    console.error('[API /leads] DB error, falling back to queue:', dbError);

    try {
      await leadSubmissionQueue.add('lead-submission', {
        formData,
        sourceIp: ip,
      });

      return NextResponse.json({
        success: true,
        queued: true,
      });
    } catch (queueError) {
      console.error('[API /leads] Queue also unavailable:', queueError);
      return NextResponse.json(
        { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' },
        { status: 503 }
      );
    }
  }
}
