'use client';

/**
 * StickyNav — Thanh điều hướng cố định cho Landing Page
 *
 * - Sticky positioning: position sticky, top 0, z-index 50
 * - Background: rgba(255,255,255,0.8) với backdrop-filter blur(20px)
 * - Height: 44px
 * - Dùng Intersection Observer để highlight section đang xem
 * - Smooth scroll đến section khi click (≤ 500ms, dùng scrollIntoView)
 * - Responsive: hamburger menu trên mobile (< 768px)
 *
 * Requirements: 1.6, 1.7
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface NavItem {
  label: string;
  anchor: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Giới thiệu', anchor: 'intro' },
  { label: 'Chương trình', anchor: 'program' },
  { label: 'Thành tích', anchor: 'achievement' },
  { label: 'Cơ sở vật chất', anchor: 'facility' },
  { label: 'Ngoại khóa', anchor: 'extracurricular' },
  { label: 'Giáo viên', anchor: 'teacher' },
  { label: 'Tuyển sinh', anchor: 'admission' },
  { label: 'Học phí', anchor: 'tuition' },
  { label: 'Đánh giá', anchor: 'testimonial' },
  { label: 'Đăng ký', anchor: 'registration-form' },
];

export default function StickyNav() {
  const [activeSection, setActiveSection] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer: highlight section đang xem
  useEffect(() => {
    const sectionIds = NAV_ITEMS.map((item) => item.anchor);

    // Track which sections are currently intersecting
    const intersectingMap = new Map<string, number>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            intersectingMap.set(id, entry.intersectionRatio);
          } else {
            intersectingMap.delete(id);
          }
        });

        // Pick the section with the highest intersection ratio
        if (intersectingMap.size > 0) {
          let bestId = '';
          let bestRatio = 0;
          intersectingMap.forEach((ratio, id) => {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestId = id;
            }
          });
          if (bestId) setActiveSection(bestId);
        }
      },
      {
        rootMargin: '-10% 0px -60% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Smooth scroll đến section khi click
  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, anchor: string) => {
      e.preventDefault();
      const target = document.getElementById(anchor);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setMenuOpen(false);
    },
    []
  );

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        height: '44px',
      }}
      aria-label="Điều hướng trang"
    >
      <div
        style={{
          maxWidth: '1262px',
          margin: '0 auto',
          padding: '0 16px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        {/* Desktop navigation links */}
        <ul
          className="sticky-nav-desktop"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            height: '44px',
            overflow: 'hidden',
          }}
          role="list"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.anchor;
            return (
              <li key={item.anchor} style={{ height: '44px', display: 'flex', alignItems: 'center' }}>
                <a
                  href={`#${item.anchor}`}
                  onClick={(e) => handleNavClick(e, item.anchor)}
                  aria-current={isActive ? 'location' : undefined}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: '44px',
                    padding: '0 10px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    lineHeight: '21px',
                    color: isActive ? '#0071E3' : 'rgba(0,0,0,0.8)',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s ease',
                    borderBottom: isActive ? '2px solid #0071E3' : '2px solid transparent',
                  }}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Hamburger button — mobile only */}
        <button
          className="sticky-nav-hamburger"
          onClick={toggleMenu}
          aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={menuOpen}
          aria-controls="sticky-nav-mobile-menu"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: 'rgba(0,0,0,0.8)',
          }}
        >
          {menuOpen ? (
            // Close icon
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4 4L16 16M16 4L4 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            // Hamburger icon
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3 5H17M3 10H17M3 15H17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          id="sticky-nav-mobile-menu"
          className="sticky-nav-mobile-menu"
          style={{
            position: 'absolute',
            top: '44px',
            left: 0,
            right: 0,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            zIndex: 49,
          }}
        >
          <ul
            style={{ listStyle: 'none', margin: 0, padding: '8px 0' }}
            role="list"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.anchor;
              return (
                <li key={item.anchor}>
                  <a
                    href={`#${item.anchor}`}
                    onClick={(e) => handleNavClick(e, item.anchor)}
                    aria-current={isActive ? 'location' : undefined}
                    style={{
                      display: 'block',
                      padding: '12px 24px',
                      fontSize: '15px',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#0071E3' : 'rgba(0,0,0,0.8)',
                      textDecoration: 'none',
                      borderLeft: isActive ? '3px solid #0071E3' : '3px solid transparent',
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Responsive styles via <style> tag */}
      <style>{`
        @media (max-width: 767px) {
          .sticky-nav-desktop {
            display: none !important;
          }
          .sticky-nav-hamburger {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
        }
        @media (min-width: 768px) {
          .sticky-nav-mobile-menu {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
