/**
 * Email notification service using Nodemailer
 *
 * Sends email notifications to the admissions team when a new lead is submitted.
 * Should not throw — errors are caught and logged.
 *
 * Requirements: 3.10
 */

import nodemailer from 'nodemailer';

export interface LeadNotificationData {
  parentName: string;
  phone: string;
  email?: string;
  studentName: string;
  expectedYear: number;
  note?: string;
}

/**
 * Creates a Nodemailer transporter using SMTP config from environment variables.
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env['SMTP_HOST'] ?? 'localhost',
    port: parseInt(process.env['SMTP_PORT'] ?? '587', 10),
    secure: process.env['SMTP_SECURE'] === 'true',
    auth: process.env['SMTP_USER']
      ? {
          user: process.env['SMTP_USER'],
          pass: process.env['SMTP_PASS'] ?? '',
        }
      : undefined,
  });
}

/**
 * Sends an email notification to the admissions team about a new lead.
 *
 * Fire-and-forget: this function catches all errors and logs them.
 * It will never throw, so callers don't need to handle errors.
 *
 * @param lead - Lead data to include in the notification email
 */
export async function notifyTeam(lead: LeadNotificationData): Promise<void> {
  const notificationEmail = process.env['NOTIFICATION_EMAIL'];

  if (!notificationEmail) {
    console.warn('[Email] NOTIFICATION_EMAIL not configured, skipping notification');
    return;
  }

  try {
    const transporter = createTransporter();

    const emailBody = `
Có đăng ký tư vấn mới từ Landing Page!

Thông tin phụ huynh:
- Họ tên: ${lead.parentName}
- Số điện thoại: ${lead.phone}
- Email: ${lead.email ?? 'Không cung cấp'}

Thông tin học sinh:
- Tên học sinh: ${lead.studentName}
- Năm học dự kiến: ${lead.expectedYear}

Ghi chú: ${lead.note ?? 'Không có'}

---
Vui lòng đăng nhập CMS để xem và xử lý lead này.
    `.trim();

    await transporter.sendMail({
      from: process.env['SMTP_FROM'] ?? process.env['SMTP_USER'] ?? 'noreply@school.edu.vn',
      to: notificationEmail,
      subject: `[Tuyển sinh] Đăng ký mới từ ${lead.parentName} - ${lead.phone}`,
      text: emailBody,
    });

    console.log(`[Email] Notification sent for lead: ${lead.phone}`);
  } catch (error) {
    // Fire-and-forget: log error but do not throw
    console.error('[Email] Failed to send notification:', error);
  }
}
