/**
 * IntroSection — Section Giới thiệu trường
 *
 * - Title, body text, optional image, stats array
 * - Next.js <Image> với WebP, lazy loading
 * - Apple Design System: colors, typography, spacing
 * - Accessible: H2 cho section title
 *
 * Requirements: 1.1, 4.6
 */

import Image from 'next/image';

export interface IntroContent {
  title: string;
  body: string;
  imageUrl?: string;
  stats?: Array<{ label: string; value: string }>;
}

interface IntroSectionProps {
  id: string;
  content: IntroContent;
  isVisible: boolean;
}

export default function IntroSection({ id, content, isVisible }: IntroSectionProps) {
  if (!isVisible) return null;

  const { title, body, imageUrl, stats } = content;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      style={{
        background: '#FFFFFF',
        padding: '56px 24px',
        borderBottom: '1px solid #EDEDF2',
      }}
    >
      <div
        style={{
          maxWidth: '1262px',
          margin: '0 auto',
        }}
      >
        {/* Two-column layout when image is present */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: imageUrl ? '1fr 1fr' : '1fr',
            gap: '48px',
            alignItems: 'center',
          }}
          className="intro-grid"
        >
          {/* Text content */}
          <div>
            <h2
              id={`${id}-title`}
              style={{
                fontFamily:
                  'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '28px',
                fontWeight: 400,
                lineHeight: '32px',
                color: '#1D1D1F',
                marginBottom: '24px',
              }}
            >
              {title}
            </h2>

            <p
              style={{
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '17px',
                fontWeight: 400,
                lineHeight: '25px',
                color: '#333336',
                marginBottom: stats && stats.length > 0 ? '40px' : '0',
                whiteSpace: 'pre-line',
              }}
            >
              {body}
            </p>

            {/* Stats */}
            {stats && stats.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(stats.length, 3)}, 1fr)`,
                  gap: '24px',
                }}
              >
                {stats.map((stat, index) => (
                  <div key={index} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontFamily:
                          'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontSize: '34px',
                        fontWeight: 600,
                        lineHeight: '50px',
                        color: '#0071E3',
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      style={{
                        fontFamily:
                          'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontSize: '12px',
                        fontWeight: 400,
                        lineHeight: '16px',
                        color: '#6E6E73',
                        marginTop: '4px',
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optional image */}
          {imageUrl && (
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '4/3',
                borderRadius: '0px',
                overflow: 'hidden',
              }}
            >
              <Image
                src={imageUrl}
                alt={title}
                fill
                loading="lazy"
                sizes="(max-width: 767px) 100vw, 50vw"
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .intro-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
