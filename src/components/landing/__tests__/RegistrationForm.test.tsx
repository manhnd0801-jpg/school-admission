/**
 * Unit tests for RegistrationForm validation logic
 *
 * Tests the validateForm function used by RegistrationForm component.
 * Since @testing-library/react is not configured, we test the validation
 * logic directly — this validates the core behaviour of the form.
 *
 * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.8
 */

import { describe, it, expect } from 'vitest';
import { validateForm } from '@/lib/validation';
import type { RegistrationFormData } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const currentYear = new Date().getFullYear();

/** A fully valid form submission */
const validFormData: RegistrationFormData = {
  parentName: 'Nguyễn Văn A',
  phone: '0912345678',
  email: 'parent@example.com',
  studentName: 'Nguyễn Văn B',
  expectedYear: currentYear,
  note: 'Ghi chú thêm',
  privacyConsent: true,
};

// ---------------------------------------------------------------------------
// 1. Validation shows correct errors for each invalid field
// ---------------------------------------------------------------------------

describe('RegistrationForm validation — lỗi cho từng trường không hợp lệ', () => {
  it('trả về lỗi parentName khi họ tên phụ huynh bị bỏ trống', () => {
    // Requirement 3.2, 3.3
    const result = validateForm({ ...validFormData, parentName: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors['parentName']).toBeDefined();
    expect(result.errors['parentName']).toContain('bắt buộc');
  });

  it('trả về lỗi parentName khi họ tên phụ huynh chỉ có khoảng trắng', () => {
    // Requirement 3.2, 3.3
    const result = validateForm({ ...validFormData, parentName: '   ' });
    expect(result.isValid).toBe(false);
    expect(result.errors['parentName']).toBeDefined();
  });

  it('trả về lỗi phone khi số điện thoại bị bỏ trống', () => {
    // Requirement 3.2, 3.3
    const result = validateForm({ ...validFormData, phone: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors['phone']).toBeDefined();
    expect(result.errors['phone']).toContain('bắt buộc');
  });

  it('trả về lỗi phone khi số điện thoại không hợp lệ — không bắt đầu bằng 0', () => {
    // Requirement 3.4
    const result = validateForm({ ...validFormData, phone: '1912345678' });
    expect(result.isValid).toBe(false);
    expect(result.errors['phone']).toBeDefined();
    expect(result.errors['phone']).toContain('không hợp lệ');
  });

  it('trả về lỗi phone khi số điện thoại không hợp lệ — ít hơn 10 chữ số', () => {
    // Requirement 3.4
    const result = validateForm({ ...validFormData, phone: '091234567' });
    expect(result.isValid).toBe(false);
    expect(result.errors['phone']).toBeDefined();
  });

  it('trả về lỗi phone khi số điện thoại không hợp lệ — nhiều hơn 10 chữ số', () => {
    // Requirement 3.4
    const result = validateForm({ ...validFormData, phone: '09123456789' });
    expect(result.isValid).toBe(false);
    expect(result.errors['phone']).toBeDefined();
  });

  it('trả về lỗi email khi email không đúng định dạng', () => {
    // Requirement 3.5
    const result = validateForm({ ...validFormData, email: 'not-an-email' });
    expect(result.isValid).toBe(false);
    expect(result.errors['email']).toBeDefined();
    expect(result.errors['email']).toContain('định dạng');
  });

  it('không trả về lỗi email khi email bị bỏ trống (email là tùy chọn)', () => {
    // Requirement 3.1 — email is optional
    const result = validateForm({ ...validFormData, email: undefined });
    expect(result.errors['email']).toBeUndefined();
  });

  it('không trả về lỗi email khi email là chuỗi rỗng (email là tùy chọn)', () => {
    // Requirement 3.1 — email is optional
    const result = validateForm({ ...validFormData, email: '' });
    expect(result.errors['email']).toBeUndefined();
  });

  it('trả về lỗi studentName khi tên học sinh bị bỏ trống', () => {
    // Requirement 3.2, 3.3
    const result = validateForm({ ...validFormData, studentName: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors['studentName']).toBeDefined();
    expect(result.errors['studentName']).toContain('bắt buộc');
  });

  it('trả về lỗi expectedYear khi năm học dự kiến bị thiếu', () => {
    // Requirement 3.2, 3.3
    const result = validateForm({ ...validFormData, expectedYear: undefined as unknown as number });
    expect(result.isValid).toBe(false);
    expect(result.errors['expectedYear']).toBeDefined();
  });

  it('trả về lỗi expectedYear khi năm học dự kiến nhỏ hơn năm hiện tại', () => {
    // Requirement 3.1
    const result = validateForm({ ...validFormData, expectedYear: currentYear - 1 });
    expect(result.isValid).toBe(false);
    expect(result.errors['expectedYear']).toBeDefined();
  });

  it('trả về lỗi expectedYear khi năm học dự kiến lớn hơn năm hiện tại + 5', () => {
    // Requirement 3.1
    const result = validateForm({ ...validFormData, expectedYear: currentYear + 6 });
    expect(result.isValid).toBe(false);
    expect(result.errors['expectedYear']).toBeDefined();
  });

  it('trả về lỗi privacyConsent khi chưa đồng ý chính sách bảo mật', () => {
    // Requirement 3.8
    const result = validateForm({ ...validFormData, privacyConsent: false });
    expect(result.isValid).toBe(false);
    expect(result.errors['privacyConsent']).toBeDefined();
    expect(result.errors['privacyConsent']).toContain('đồng ý');
  });

  it('trả về nhiều lỗi cùng lúc khi nhiều trường không hợp lệ', () => {
    // Requirement 3.2, 3.3
    const result = validateForm({
      parentName: '',
      phone: '',
      studentName: '',
      expectedYear: undefined as unknown as number,
      privacyConsent: false,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors['parentName']).toBeDefined();
    expect(result.errors['phone']).toBeDefined();
    expect(result.errors['studentName']).toBeDefined();
    expect(result.errors['expectedYear']).toBeDefined();
    expect(result.errors['privacyConsent']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 2. Success state — valid data passes validation and form would be cleared
// ---------------------------------------------------------------------------

describe('RegistrationForm validation — trạng thái thành công', () => {
  it('trả về isValid: true khi tất cả trường bắt buộc hợp lệ', () => {
    // Requirement 3.6
    const result = validateForm(validFormData);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('trả về isValid: true khi email và ghi chú bị bỏ trống (các trường tùy chọn)', () => {
    // Requirement 3.1 — email and note are optional
    const result = validateForm({
      parentName: 'Nguyễn Văn A',
      phone: '0912345678',
      studentName: 'Nguyễn Văn B',
      expectedYear: currentYear,
      privacyConsent: true,
    });
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('trả về isValid: true với năm học dự kiến là năm hiện tại + 5 (biên trên)', () => {
    // Requirement 3.1
    const result = validateForm({ ...validFormData, expectedYear: currentYear + 5 });
    expect(result.isValid).toBe(true);
  });

  it('trả về isValid: true với năm học dự kiến là năm hiện tại (biên dưới)', () => {
    // Requirement 3.1
    const result = validateForm({ ...validFormData, expectedYear: currentYear });
    expect(result.isValid).toBe(true);
  });

  it('trả về isValid: true với email hợp lệ', () => {
    // Requirement 3.5
    const result = validateForm({ ...validFormData, email: 'test@school.edu.vn' });
    expect(result.isValid).toBe(true);
    expect(result.errors['email']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 3. Error state — form data should be preserved (tested via validation logic)
// ---------------------------------------------------------------------------

describe('RegistrationForm validation — trạng thái lỗi giữ dữ liệu', () => {
  it('validateForm không thay đổi dữ liệu đầu vào khi có lỗi', () => {
    // Requirement 3.8 — on error, form data must be preserved
    const inputData = {
      parentName: 'Nguyễn Văn A',
      phone: 'invalid-phone',
      studentName: 'Nguyễn Văn B',
      expectedYear: currentYear,
      privacyConsent: true,
    };
    const inputCopy = { ...inputData };

    validateForm(inputData);

    // Input data must not be mutated
    expect(inputData).toEqual(inputCopy);
  });

  it('trả về lỗi phone cụ thể khi số điện thoại không hợp lệ', () => {
    // Requirement 3.4, 3.8
    const result = validateForm({ ...validFormData, phone: 'abc' });
    expect(result.isValid).toBe(false);
    expect(result.errors['phone']).toBeDefined();
    // Other fields should not have errors
    expect(result.errors['parentName']).toBeUndefined();
    expect(result.errors['studentName']).toBeUndefined();
  });

  it('trả về lỗi email cụ thể khi email không hợp lệ, các trường khác không có lỗi', () => {
    // Requirement 3.5, 3.8
    const result = validateForm({ ...validFormData, email: 'bad-email' });
    expect(result.isValid).toBe(false);
    expect(result.errors['email']).toBeDefined();
    expect(result.errors['parentName']).toBeUndefined();
    expect(result.errors['phone']).toBeUndefined();
    expect(result.errors['studentName']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 4. Duplicate phone — specific message scenario
// ---------------------------------------------------------------------------

describe('RegistrationForm — xử lý số điện thoại trùng lặp', () => {
  it('số điện thoại hợp lệ vượt qua validation (duplicate check xảy ra ở server)', () => {
    // Requirement 3.11 — duplicate detection is server-side
    // Client-side validation only checks format, not duplicates
    const result = validateForm({ ...validFormData, phone: '0987654321' });
    expect(result.isValid).toBe(true);
    expect(result.errors['phone']).toBeUndefined();
  });

  it('số điện thoại hợp lệ với định dạng đúng luôn vượt qua client validation', () => {
    // Requirement 3.4 — valid phone format passes client validation
    const phones = ['0912345678', '0987654321', '0333444555', '0700000001'];
    phones.forEach((phone) => {
      const result = validateForm({ ...validFormData, phone });
      expect(result.errors['phone']).toBeUndefined();
    });
  });
});

// ---------------------------------------------------------------------------
// 5. Edge cases
// ---------------------------------------------------------------------------

describe('RegistrationForm validation — edge cases', () => {
  it('trả về lỗi khi parentName chỉ có khoảng trắng Unicode', () => {
    // Requirement 3.2
    const result = validateForm({ ...validFormData, parentName: '\t\n ' });
    expect(result.isValid).toBe(false);
    expect(result.errors['parentName']).toBeDefined();
  });

  it('trả về lỗi khi studentName chỉ có khoảng trắng Unicode', () => {
    // Requirement 3.2
    const result = validateForm({ ...validFormData, studentName: '\t\n ' });
    expect(result.isValid).toBe(false);
    expect(result.errors['studentName']).toBeDefined();
  });

  it('chấp nhận parentName với ký tự tiếng Việt', () => {
    // Requirement 3.2
    const result = validateForm({ ...validFormData, parentName: 'Trần Thị Bích Ngọc' });
    expect(result.errors['parentName']).toBeUndefined();
  });

  it('chấp nhận studentName với ký tự tiếng Việt', () => {
    // Requirement 3.2
    const result = validateForm({ ...validFormData, studentName: 'Lê Hoàng Minh Khôi' });
    expect(result.errors['studentName']).toBeUndefined();
  });

  it('trả về lỗi khi expectedYear là số thập phân', () => {
    // Requirement 3.1 — must be integer
    const result = validateForm({ ...validFormData, expectedYear: currentYear + 0.5 });
    expect(result.isValid).toBe(false);
    expect(result.errors['expectedYear']).toBeDefined();
  });
});
