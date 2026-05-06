/**
 * Audit logging utility
 *
 * Records important CMS actions to the AuditLog table via Prisma.
 * Never throws — errors are caught and logged to console to avoid
 * disrupting the main request flow.
 *
 * Requirements: 12.5
 */

import { prisma } from './prisma';

/**
 * Logs an audit event to the AuditLog table.
 *
 * This function is fire-and-forget safe: it catches all errors internally
 * and logs them to console rather than propagating them to the caller.
 *
 * @param userId - ID of the user performing the action (null for system/anonymous actions)
 * @param action - Action identifier (e.g., LOGIN, LOGOUT, CONTENT_UPDATE, LEAD_EXPORT)
 * @param resource - Resource type (e.g., 'Section', 'Article', 'Lead')
 * @param resourceId - ID of the affected resource
 * @param metadata - Additional context data (serialized as JSON)
 * @param ip - IP address of the requester
 */
export async function logAudit(
  userId: string | null,
  action: string,
  resource?: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
  ip?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? undefined,
        action,
        resource,
        resourceId,
        metadata: metadata ?? undefined,
        ip,
      },
    });
  } catch (error) {
    // Never throw — audit logging must not disrupt the main request flow
    console.error('[AuditLog] Failed to write audit log:', {
      userId,
      action,
      resource,
      resourceId,
      ip,
      error,
    });
  }
}
