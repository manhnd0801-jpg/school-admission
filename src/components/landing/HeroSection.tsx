'use client';

/**
 * HeroSection — Section Hero của Landing Page
 *
 * - Background: full-width image hoặc video
 * - H1 heading với headline text
 * - Subheadline paragraph
 * - CTA button scroll đến #registration-form (client-side scroll)
 * - Next.js <Image> với priority (eager loading cho hero)
 * - Min-height: 580px
 *
 * Requirements: 2.1, 2.2
 */

import Image from 'next/image';
import { useCallback } from 'react';

export interface HeroContent {
  headline: string;
  subheadline: string;
  backgroundType: 'image' | 'video';
  backgroundUrl: string;
  ctaText: string;
  ctaTarget: string;
}

interface HeroSectionProps {
  id: string;
  content: HeroContent;
  isVisible: boolean;
}

export default function HeroSection({ id, content, isVisible }: HeroSectionProps) {
  if (!isVisible) return null;

  const { headline, subheadline, backgroundType, backgroundUrl, ctaText, ctaTarget } = content;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleCtaClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const targetId = ctaTarget.replace(/^#/, '');
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [ctaTarget]
  );

  return (
    <section
      id={id}
      aria-label={headline}
      style={{
        position: 'relative',
        minHeight: '580px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#1D1D1F',
      }}
    >
      {/* Background: image or video */}
      {backgroundType === 'video' ? (
        <video
          src={backgroundUrl}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
          }}
        >
          <Image
            src={backgroundUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Dark overlay for text readability */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1262px',
          width: '100%',
          margin: '0 auto',
          padding: '80px 24px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily:
              'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: 'clamp(24px, 5vw, 40px)',
            fontWeight: 600,
            lineHeight: '1.1',
            color: '#FFFFFF',
            marginBottom: '16px',
            letterSpacing: '-0.5px',
          }}
        >
          {headline}
        </h1>

        <p
          style={{
            fontFamily:
              'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: 'clamp(17px, 2.5vw, 21px)',
            fontWeight: 400,
            lineHeight: '1.47',
            color: 'rgba(255,255,255,0.85)',
            marginBottom: '40px',
            maxWidth: '640px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {subheadline}
        </p>

        <a
          href={ctaTarget}
          onClick={handleCtaClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '44px',
            padding: '0 24px',
            background: '#0071E3',
            color: '#FFFFFF',
            borderRadius: '50px',
            fontSize: '17px',
            fontWeight: 400,
            lineHeight: '25px',
            textDecoration: 'none',
            transition: 'background 0.15s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = '#006EDB';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = '#0071E3';
          }}
        >
          {ctaText}
        </a>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 767px) {
          #${id} h1 {
            font-size: 24px !important;
          }
          #${id} p {
            font-size: 17px !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          #${id} h1 {
            font-size: 28px !important;
          }
        }
      `}</style>
    </section>
  );
}
