'use client';

/**
 * RegistrationForm — Form đăng ký tư vấn tuyển sinh
 *
 * Client component với:
 * - Client-side validation dùng validateForm từ @/lib/validation
 * - Submit POST /api/leads
 * - Hiển thị success/error/duplicate messages
 * - GA4 event tracking khi submit thành công
 * - Apple Design System styling
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.11, 4.7, 12.2, 12.3
 */

import { useState, useCallback } from 'react';
import type { RegistrationFormData } from '@/types';
import { validateForm } from '@/lib/validation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormState = 'idle' | 'submitting' | 'success' | 'error' | 'duplicate' | 'rateLimit';

interface FormFields {
  parentName: string;
  phone: string;
  email: string;
  studentName: string;
  expectedYear: string;
  note: string;
  privacyConsent: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCurrentYear(): number {
  return new Date().getFullYear();
}

function buildYearOptions(): number[] {
  const current = getCurrentYear();
  return Array.from({ length: 6 }, (_, i) => current + i);
}

const INITIAL_FIELDS: FormFields = {
  parentName: '',
  phone: '',
  email: '',
  studentName: '',
  expectedYear: '',
  note: '',
  privacyConsent: false,
};

// ---------------------------------------------------------------------------
// Styles (Apple Design System tokens)
// ---------------------------------------------------------------------------

const styles = {
  section: {
    background: '#ffffff',
    padding: '56px 24px',
    borderBottom: '1px solid #EDEDF2',
  } as React.CSSProperties,

  container: {
    maxWidth: '560px',
    margin: '0 auto',
  } as React.CSSProperties,

  heading: {
    fontFamily:
      'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '28px',
    fontWeight: 400,
    lineHeight: '32px',
    color: '#1D1D1F',
    marginBottom: '8px',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  subheading: {
    fontFamily:
      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '17px',
    color: '#6E6E73',
    textAlign: 'center' as const,
    marginBottom: '32px',
  } as React.CSSProperties,

  fieldGroup: {
    marginBottom: '16px',
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontFamily:
      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '12px',
    fontWeight: 600,
    color: '#1D1D1F',
    marginBottom: '6px',
  } as React.CSSProperties,

  input: {
    width: '100%',
    height: '44px',
    padding: '0 12px',
    border: '1px solid #D5D5D7',
    borderRadius: '8px',
    fontFamily:
      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '17px',
    color: '#1D1D1F',
    background: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,

  inputError: {
    borderColor: '#FF3B30',
  } as React.CSSProperties,

  inputFocus: {
    borderColor: '#0071E3',
    boxShadow: '0 0 0 3px rgba(0,113,227,0.1)',
  } as React.CSSProperties,

  select: {
    width: '100%',
    height: '44px',
    padding: '0 12px',
    border: '1px solid #D5D5D7',
    borderRadius: '8px',
    fontFamily:
      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '17px',
    color: '#1D1D1F',
    background: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box' as const,
    appearance: 'none' as const,
    cursor: 'pointer',
  } as React.CSSProperties,

  textarea: {
    width: '100%',
    minHeight: '88px',
    padding: '12px',
    border: '1px solid #D5D5D7',
    borderRadius: '8px',
    fontFamily:
      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '17px',
    color: '#1D1D1F',
    background: '#ffffff',
    outline: 'none',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,

  errorText: {
    fontFamily:
      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '12px',
    color: '#FF3B30',
    marginTop: '4px',
  } as React.CSSProperties,

  checkboxRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    marginBottom: '24px',
  } as React.CSSProperties,

  checkboxLabel: {
    fontFamily:
      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    color: '#333336',
    lineHeight: '20px',
  } as React.CSSProperties,

  link: {
    color: '#0071E3',
    textDecoration: 'none',
  } as React.CSSProperties,

  submitButton: {
    width: '100%',
    height: '44px',
    background: '#0071E3',
    color: '#ffffff',
    border: 'none',
    borderRadius: '50px',
    fontFamily:
      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '17px',
    fontWeight: 400,
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  } as React.CSSProperties,

  submitButtonDisabled: {
    background: '#D5D5D7',
    cursor: 'not-allowed',
  } as React.CSSProperties,

  successBanner: {
    background: '#F0FFF4',
    border: '1px solid #34C759',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    fontFamily:
      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '15px',
    color: '#1D1D1F',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  errorBanner: {
    background: '#FFF5F5',
    border: '1px solid #FF3B30',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    fontFamily:
      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '15px',
    color: '#1D1D1F',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  infoBanner: {
    background: '#FFF9E6',
    border: '1px solid #FF9500',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    fontFamily:
      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '15px',
    color: '#1D1D1F',
    textAlign: 'center' as const,
  } as React.CSSProperties,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RegistrationForm() {
  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [formState, setFormState] = useState<FormState>('idle');
  const [rateLimitMinutes, setRateLimitMinutes] = useState<number>(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const yearOptions = buildYearOptions();

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

      setFields((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? (checked ?? false) : value,
      }));

      // Clear field error on change
      if (fieldErrors[name]) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    },
    [fieldErrors]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Build form data for validation
      const formData: Partial<RegistrationFormData> = {
        parentName: fields.parentName,
        phone: fields.phone,
        email: fields.email.trim() !== '' ? fields.email : undefined,
        studentName: fields.studentName,
        expectedYear: fields.expectedYear !== '' ? parseInt(fields.expectedYear, 10) : undefined,
        note: fields.note.trim() !== '' ? fields.note : undefined,
        privacyConsent: fields.privacyConsent,
      };

      // Client-side validation
      const validation = validateForm(formData);
      if (!validation.isValid) {
        setFieldErrors(validation.errors);
        return;
      }

      setFormState('submitting');
      setFieldErrors({});

      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const json = (await response.json()) as {
            success: boolean;
            duplicate?: boolean;
          };

          if (json.duplicate) {
            setFormState('duplicate');
          } else {
            setFormState('success');
            // Clear form on success
            setFields(INITIAL_FIELDS);
            setFieldErrors({});

            // GA4 event tracking
            if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
              window.gtag('event', 'form_submit', { event_category: 'lead' });
            }
          }
        } else if (response.status === 429) {
          const json = (await response.json()) as { retryAfter?: number };
          const retryAfterSeconds = json.retryAfter ?? 3600;
          setRateLimitMinutes(Math.ceil(retryAfterSeconds / 60));
          setFormState('rateLimit');
        } else if (response.status === 400) {
          const json = (await response.json()) as {
            success: false;
            details?: Record<string, string>;
          };
          if (json.details) {
            setFieldErrors(json.details);
          }
          setFormState('error');
        } else {
          setFormState('error');
        }
      } catch {
        // Network error — keep form data
        setFormState('error');
      }
    },
    [fields]
  );

  // -------------------------------------------------------------------------
  // Input style helpers
  // -------------------------------------------------------------------------

  const getInputStyle = (fieldName: string): React.CSSProperties => ({
    ...styles.input,
    ...(fieldErrors[fieldName] ? styles.inputError : {}),
    ...(focusedField === fieldName ? styles.inputFocus : {}),
  });

  const getSelectStyle = (fieldName: string): React.CSSProperties => ({
    ...styles.select,
    ...(fieldErrors[fieldName] ? styles.inputError : {}),
    ...(focusedField === fieldName ? styles.inputFocus : {}),
  });

  const getTextareaStyle = (fieldName: string): React.CSSProperties => ({
    ...styles.textarea,
    ...(fieldErrors[fieldName] ? styles.inputError : {}),
    ...(focusedField === fieldName ? styles.inputFocus : {}),
  });

  const isSubmitting = formState === 'submitting';

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <section id="registration-form" style={styles.section} aria-label="Form đăng ký tư vấn">
      <div style={styles.container}>
        <h2 style={styles.heading}>Đăng ký tư vấn</h2>
        <p style={styles.subheading}>
          Để lại thông tin, chúng tôi sẽ liên hệ tư vấn miễn phí cho bạn
        </p>

        {/* Status banners */}
        {formState === 'success' && (
          <div role="alert" style={styles.successBanner}>
            Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ
          </div>
        )}

        {formState === 'duplicate' && (
          <div role="alert" style={styles.infoBanner}>
            Số điện thoại này đã đăng ký, chúng tôi sẽ liên hệ sớm
          </div>
        )}

        {formState === 'error' && (
          <div role="alert" style={styles.errorBanner}>
            Có lỗi xảy ra, vui lòng thử lại
          </div>
        )}

        {formState === 'rateLimit' && (
          <div role="alert" style={styles.errorBanner}>
            Vui lòng thử lại sau {rateLimitMinutes} phút
          </div>
        )}

        {/* Form — always rendered so data is preserved on error */}
        {formState !== 'success' && (
          <form onSubmit={handleSubmit} noValidate aria-label="Biểu mẫu đăng ký tư vấn">
            {/* Họ tên phụ huynh */}
            <div style={styles.fieldGroup}>
              <label htmlFor="parentName" style={styles.label}>
                Họ tên phụ huynh <span aria-hidden="true">*</span>
              </label>
              <input
                id="parentName"
                name="parentName"
                type="text"
                value={fields.parentName}
                onChange={handleChange}
                onFocus={() => setFocusedField('parentName')}
                onBlur={() => setFocusedField(null)}
                placeholder="Nguyễn Văn A"
                style={getInputStyle('parentName')}
                aria-required="true"
                aria-invalid={!!fieldErrors['parentName']}
                aria-describedby={fieldErrors['parentName'] ? 'parentName-error' : undefined}
                disabled={isSubmitting}
                autoComplete="name"
              />
              {fieldErrors['parentName'] && (
                <p id="parentName-error" role="alert" style={styles.errorText}>
                  {fieldErrors['parentName']}
                </p>
              )}
            </div>

            {/* Số điện thoại */}
            <div style={styles.fieldGroup}>
              <label htmlFor="phone" style={styles.label}>
                Số điện thoại <span aria-hidden="true">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={fields.phone}
                onChange={handleChange}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                placeholder="0912345678"
                style={getInputStyle('phone')}
                aria-required="true"
                aria-invalid={!!fieldErrors['phone']}
                aria-describedby={fieldErrors['phone'] ? 'phone-error' : undefined}
                disabled={isSubmitting}
                autoComplete="tel"
                inputMode="tel"
              />
              {fieldErrors['phone'] && (
                <p id="phone-error" role="alert" style={styles.errorText}>
                  {fieldErrors['phone']}
                </p>
              )}
            </div>

            {/* Email (optional) */}
            <div style={styles.fieldGroup}>
              <label htmlFor="email" style={styles.label}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={fields.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="example@email.com"
                style={getInputStyle('email')}
                aria-invalid={!!fieldErrors['email']}
                aria-describedby={fieldErrors['email'] ? 'email-error' : undefined}
                disabled={isSubmitting}
                autoComplete="email"
                inputMode="email"
              />
              {fieldErrors['email'] && (
                <p id="email-error" role="alert" style={styles.errorText}>
                  {fieldErrors['email']}
                </p>
              )}
            </div>

            {/* Tên học sinh */}
            <div style={styles.fieldGroup}>
              <label htmlFor="studentName" style={styles.label}>
                Tên học sinh <span aria-hidden="true">*</span>
              </label>
              <input
                id="studentName"
                name="studentName"
                type="text"
                value={fields.studentName}
                onChange={handleChange}
                onFocus={() => setFocusedField('studentName')}
                onBlur={() => setFocusedField(null)}
                placeholder="Nguyễn Văn B"
                style={getInputStyle('studentName')}
                aria-required="true"
                aria-invalid={!!fieldErrors['studentName']}
                aria-describedby={fieldErrors['studentName'] ? 'studentName-error' : undefined}
                disabled={isSubmitting}
              />
              {fieldErrors['studentName'] && (
                <p id="studentName-error" role="alert" style={styles.errorText}>
                  {fieldErrors['studentName']}
                </p>
              )}
            </div>

            {/* Năm học dự kiến */}
            <div style={styles.fieldGroup}>
              <label htmlFor="expectedYear" style={styles.label}>
                Năm học dự kiến <span aria-hidden="true">*</span>
              </label>
              <select
                id="expectedYear"
                name="expectedYear"
                value={fields.expectedYear}
                onChange={handleChange}
                onFocus={() => setFocusedField('expectedYear')}
                onBlur={() => setFocusedField(null)}
                style={getSelectStyle('expectedYear')}
                aria-required="true"
                aria-invalid={!!fieldErrors['expectedYear']}
                aria-describedby={fieldErrors['expectedYear'] ? 'expectedYear-error' : undefined}
                disabled={isSubmitting}
              >
                <option value="">-- Chọn năm học --</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {fieldErrors['expectedYear'] && (
                <p id="expectedYear-error" role="alert" style={styles.errorText}>
                  {fieldErrors['expectedYear']}
                </p>
              )}
            </div>

            {/* Ghi chú (optional) */}
            <div style={styles.fieldGroup}>
              <label htmlFor="note" style={styles.label}>
                Ghi chú
              </label>
              <textarea
                id="note"
                name="note"
                value={fields.note}
                onChange={handleChange}
                onFocus={() => setFocusedField('note')}
                onBlur={() => setFocusedField(null)}
                placeholder="Thông tin thêm bạn muốn chia sẻ..."
                style={getTextareaStyle('note')}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            {/* Checkbox đồng ý chính sách bảo mật */}
            <div style={styles.checkboxRow}>
              <input
                id="privacyConsent"
                name="privacyConsent"
                type="checkbox"
                checked={fields.privacyConsent}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={!!fieldErrors['privacyConsent']}
                aria-describedby={
                  fieldErrors['privacyConsent'] ? 'privacyConsent-error' : undefined
                }
                disabled={isSubmitting}
                style={{ marginTop: '2px', flexShrink: 0, width: '18px', height: '18px' }}
              />
              <div>
                <label htmlFor="privacyConsent" style={styles.checkboxLabel}>
                  Tôi đồng ý với{' '}
                  <a href="/chinh-sach-bao-mat" style={styles.link} target="_blank" rel="noopener noreferrer">
                    chính sách bảo mật
                  </a>{' '}
                  của nhà trường
                </label>
                {fieldErrors['privacyConsent'] && (
                  <p id="privacyConsent-error" role="alert" style={styles.errorText}>
                    {fieldErrors['privacyConsent']}
                  </p>
                )}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.submitButton,
                ...(isSubmitting ? styles.submitButtonDisabled : {}),
              }}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi đăng ký'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
