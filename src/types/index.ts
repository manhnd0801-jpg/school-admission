/**
 * Shared TypeScript types for the Landing Page + CMS system
 */

// ============================================================
// Enums (mirroring Prisma schema)
// ============================================================

export type UserRole = 'ADMIN' | 'STAFF';

export type SectionType =
  | 'HERO'
  | 'INTRO'
  | 'PROGRAM'
  | 'ACHIEVEMENT'
  | 'FACILITY'
  | 'EXTRACURRICULAR'
  | 'TEACHER'
  | 'ADMISSION'
  | 'TUITION'
  | 'TESTIMONIAL'
  | 'FOOTER';

export type ArticleStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONSULTING' | 'REGISTERED' | 'DROPPED';

// ============================================================
// Registration Form
// ============================================================

export interface RegistrationFormData {
  parentName: string;
  phone: string;
  email?: string;
  studentName: string;
  expectedYear: number;
  note?: string;
  privacyConsent: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Partial<Record<string, string>>;
}

// ============================================================
// Section / Content
// ============================================================

export interface SectionProps {
  id: string;
  type: SectionType;
  content: Record<string, unknown>;
  isVisible: boolean;
}

// ============================================================
// Rate Limiting
// ============================================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

// ============================================================
// API Response types
// ============================================================

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string>;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================
// Lead Submission
// ============================================================

export interface LeadSubmissionResult {
  success: boolean;
  duplicate?: boolean;
  queued?: boolean;
  leadId?: string;
}

// ============================================================
// Pagination
// ============================================================

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================
// Global Window extensions
// ============================================================

declare global {
  interface Window {
    // Google Analytics 4 gtag function
    gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  }
}
