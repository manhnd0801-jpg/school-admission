/**
 * Property-based tests for validation functions
 *
 * Property 2: Validation số điện thoại chỉ chấp nhận đúng định dạng
 *   Validates: Requirements 3.4
 *
 * Property 3: Validation email chỉ chấp nhận đúng định dạng
 *   Validates: Requirements 3.5
 *
 * Property 1: Validation form từ chối mọi dữ liệu thiếu trường bắt buộc
 *   Validates: Requirements 3.2, 3.3
 *
 * Property 18: Form bị từ chối khi chưa đồng ý chính sách bảo mật
 *   Validates: Requirements 10.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validatePhone, validateEmail, validateForm } from '../validation';

// ---------------------------------------------------------------------------
// Property 2 — validatePhone
// Validates: Requirements 3.4
// ---------------------------------------------------------------------------

describe('Property 2: validatePhone — chỉ chấp nhận đúng định dạng', () => {
  it('trả về true cho mọi số điện thoại hợp lệ (0 + 9 chữ số)', () => {
    /**
     * **Validates: Requirements 3.4**
     * Với bất kỳ chuỗi khớp /^0\d{9}$/, validatePhone phải trả về true.
     */
    fc.assert(
      fc.property(fc.stringMatching(/^0\d{9}$/), (phone) => {
        expect(validatePhone(phone)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('trả về false cho mọi chuỗi không khớp định dạng hợp lệ', () => {
    /**
     * **Validates: Requirements 3.4**
     * Với bất kỳ chuỗi KHÔNG khớp /^0\d{9}$/, validatePhone phải trả về false.
     */
    fc.assert(
      fc.property(
        fc.string().filter((s) => !/^0\d{9}$/.test(s)),
        (phone) => {
          expect(validatePhone(phone)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3 — validateEmail
// Validates: Requirements 3.5
// ---------------------------------------------------------------------------

describe('Property 3: validateEmail — chỉ chấp nhận đúng định dạng', () => {
  it('trả về true cho mọi địa chỉ email hợp lệ', () => {
    /**
     * **Validates: Requirements 3.5**
     * Với bất kỳ email hợp lệ (user@domain.tld), validateEmail phải trả về true.
     */
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        expect(validateEmail(email)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('trả về false cho chuỗi không chứa ký tự @', () => {
    /**
     * **Validates: Requirements 3.5**
     * Với bất kỳ chuỗi không có @, validateEmail phải trả về false.
     */
    fc.assert(
      fc.property(
        fc.string().filter((s) => !s.includes('@')),
        (email) => {
          expect(validateEmail(email)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 1 — validateForm: từ chối dữ liệu thiếu trường bắt buộc
// Validates: Requirements 3.2, 3.3
// ---------------------------------------------------------------------------

describe('Property 1: validateForm — từ chối mọi dữ liệu thiếu trường bắt buộc', () => {
  const currentYear = new Date().getFullYear();

  /** Base valid form data used as a foundation for mutation tests */
  const validBase = {
    parentName: 'Nguyễn Văn A',
    phone: '0912345678',
    studentName: 'Nguyễn Văn B',
    expectedYear: currentYear,
    privacyConsent: true as const,
  };

  it('trả về isValid: false khi parentName rỗng', () => {
    /**
     * **Validates: Requirements 3.2, 3.3**
     * Khi parentName là chuỗi rỗng, form phải bị từ chối.
     */
    fc.assert(
      fc.property(
        fc.record({
          parentName: fc.constant(''),
          phone: fc.constant(validBase.phone),
          studentName: fc.constant(validBase.studentName),
          expectedYear: fc.constant(validBase.expectedYear),
          privacyConsent: fc.constant(true as boolean),
        }),
        (data) => {
          const result = validateForm(data);
          expect(result.isValid).toBe(false);
          expect(result.errors['parentName']).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trả về isValid: false khi phone rỗng', () => {
    /**
     * **Validates: Requirements 3.2, 3.3**
     * Khi phone là chuỗi rỗng, form phải bị từ chối.
     */
    fc.assert(
      fc.property(
        fc.record({
          parentName: fc.constant(validBase.parentName),
          phone: fc.constant(''),
          studentName: fc.constant(validBase.studentName),
          expectedYear: fc.constant(validBase.expectedYear),
          privacyConsent: fc.constant(true as boolean),
        }),
        (data) => {
          const result = validateForm(data);
          expect(result.isValid).toBe(false);
          expect(result.errors['phone']).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trả về isValid: false khi studentName rỗng', () => {
    /**
     * **Validates: Requirements 3.2, 3.3**
     * Khi studentName là chuỗi rỗng, form phải bị từ chối.
     */
    fc.assert(
      fc.property(
        fc.record({
          parentName: fc.constant(validBase.parentName),
          phone: fc.constant(validBase.phone),
          studentName: fc.constant(''),
          expectedYear: fc.constant(validBase.expectedYear),
          privacyConsent: fc.constant(true as boolean),
        }),
        (data) => {
          const result = validateForm(data);
          expect(result.isValid).toBe(false);
          expect(result.errors['studentName']).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trả về isValid: false khi expectedYear bị thiếu (undefined)', () => {
    /**
     * **Validates: Requirements 3.2, 3.3**
     * Khi expectedYear không được cung cấp, form phải bị từ chối.
     */
    fc.assert(
      fc.property(
        fc.record({
          parentName: fc.constant(validBase.parentName),
          phone: fc.constant(validBase.phone),
          studentName: fc.constant(validBase.studentName),
          privacyConsent: fc.constant(true as boolean),
          // expectedYear intentionally omitted
        }),
        (data) => {
          const result = validateForm(data);
          expect(result.isValid).toBe(false);
          expect(result.errors['expectedYear']).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 18 — validateForm: từ chối khi privacyConsent = false
// Validates: Requirements 10.3
// ---------------------------------------------------------------------------

describe('Property 18: validateForm — từ chối khi chưa đồng ý chính sách bảo mật', () => {
  const currentYear = new Date().getFullYear();

  it('trả về isValid: false và lỗi trên privacyConsent khi privacyConsent = false', () => {
    /**
     * **Validates: Requirements 10.3**
     * Với dữ liệu form hợp lệ nhưng privacyConsent = false,
     * validateForm phải trả về isValid: false với lỗi trên trường privacyConsent.
     */
    fc.assert(
      fc.property(
        fc.record({
          parentName: fc.stringMatching(/^[A-Za-z ]{1,50}/).filter((s) => s.trim().length > 0),
          phone: fc.stringMatching(/^0\d{9}$/),
          studentName: fc.stringMatching(/^[A-Za-z ]{1,50}/).filter((s) => s.trim().length > 0),
          expectedYear: fc.integer({ min: currentYear, max: currentYear + 5 }),
          privacyConsent: fc.constant(false as boolean),
        }),
        (data) => {
          const result = validateForm(data);
          expect(result.isValid).toBe(false);
          expect(result.errors['privacyConsent']).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
