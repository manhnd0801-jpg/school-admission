/**
 * Validation functions for form data and business logic
 * Requirements: 3.2, 3.3, 3.4, 3.5, 6.3, 7.3
 */

import type { ValidationResult, RegistrationFormData } from '@/types';

export type { ValidationResult } from '@/types';

/**
 * Validates a Vietnamese phone number.
 * Must be exactly 10 digits starting with 0.
 * Pattern: /^0\d{9}$/
 */
export function validatePhone(phone: string): boolean {
  return /^0\d{9}$/.test(phone);
}

/**
 * Validates an email address using RFC 5322 simplified pattern.
 * Pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates the registration form data.
 * Returns a ValidationResult with isValid flag and field-level errors.
 */
export function validateForm(data: Partial<RegistrationFormData>): ValidationResult {
  const errors: Partial<Record<string, string>> = {};
  const currentYear = new Date().getFullYear();

  // parentName: required, not empty/whitespace
  if (!data.parentName || data.parentName.trim() === '') {
    errors['parentName'] = 'Họ tên phụ huynh là bắt buộc';
  }

  // phone: required, valid format
  if (!data.phone || data.phone.trim() === '') {
    errors['phone'] = 'Số điện thoại là bắt buộc';
  } else if (!validatePhone(data.phone)) {
    errors['phone'] = 'Số điện thoại không hợp lệ';
  }

  // email: optional, but if provided must be valid
  if (data.email && data.email.trim() !== '' && !validateEmail(data.email)) {
    errors['email'] = 'Email không đúng định dạng';
  }

  // studentName: required, not empty/whitespace
  if (!data.studentName || data.studentName.trim() === '') {
    errors['studentName'] = 'Tên học sinh là bắt buộc';
  }

  // expectedYear: required, integer, current year to current year + 5
  if (data.expectedYear === undefined || data.expectedYear === null) {
    errors['expectedYear'] = 'Năm học dự kiến là bắt buộc';
  } else if (
    !Number.isInteger(data.expectedYear) ||
    data.expectedYear < currentYear ||
    data.expectedYear > currentYear + 5
  ) {
    errors['expectedYear'] = `Năm học dự kiến phải từ ${currentYear} đến ${currentYear + 5}`;
  }

  // privacyConsent: must be true
  if (!data.privacyConsent) {
    errors['privacyConsent'] = 'Bạn phải đồng ý với chính sách bảo mật';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates article data for required fields.
 * TODO (Task 3.1): Implement full article validation
 */
export function validateArticle(data: {
  title?: string;
  content?: string;
  category?: string;
  coverImage?: string;
}): ValidationResult {
  const errors: Partial<Record<string, string>> = {};

  if (!data.title || data.title.trim() === '') {
    errors['title'] = 'Tiêu đề bài viết là bắt buộc';
  }

  if (!data.content || data.content.trim() === '') {
    errors['content'] = 'Nội dung bài viết là bắt buộc';
  }

  if (!data.category || data.category.trim() === '') {
    errors['category'] = 'Danh mục bài viết là bắt buộc';
  }

  if (!data.coverImage || data.coverImage.trim() === '') {
    errors['coverImage'] = 'Ảnh đại diện bài viết là bắt buộc';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates image file size.
 * @param sizeInBytes - File size in bytes
 * @param maxSizeInBytes - Maximum allowed size in bytes (default: 10MB)
 * @returns true if sizeInBytes <= maxSizeInBytes
 */
export function validateImageSize(
  sizeInBytes: number,
  maxSizeInBytes: number = 10 * 1024 * 1024
): boolean {
  return sizeInBytes <= maxSizeInBytes;
}
