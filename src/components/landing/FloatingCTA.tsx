'use client';

/**
 * FloatingCTA — Nút CTA nổi cố định ở cuối màn hình trên mobile
 *
 * - Client component
 * - Fixed bottom bar trên mobile (< 768px): position fixed, bottom 0, left 0, right 0, z-index 40
 * - Nút "Đăng ký ngay" → scroll đến #registration-form
 * - Ẩn trên desktop (>= 768px)
 * - Background: white với top border
 *
 * Requirements: 2.3, 2.4
 */

import { useCallback } from 'react';

export default function FloatingCTA() {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById('registration-form');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <>
      <div
        className="floating-cta"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: '#FFFFFF',
          borderTop: '1px solid #EDEDF2',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Safe area inset for iOS home indicator
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        }}
        role="complementary"
        aria-label="Đăng ký tư vấn"
      >
        <a
          href="#registration-form"
          onClick={handleClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '400px',
            height: '44px',
            background: '#0071E3',
            color: '#FFFFFF',
            borderRadius: '50px',
            fontSize: '17px',
            fontWeight: 400,
            lineHeight: '25px',
            textDecoration: 'none',
            fontFamily:
              'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = '#006EDB';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = '#0071E3';
          }}
        >
          Đăng ký ngay
        </a>
      </div>

      {/* Hide on desktop, show only on mobile */}
      <style>{`
        .floating-cta {
          display: none;
        }
        @media (max-width: 767px) {
          .floating-cta {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
