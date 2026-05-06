/**
 * ProgramSection — Section Chương trình đào tạo
 *
 * - Title, programs array (name, description, imageUrl)
 * - Next.js <Image> với WebP, lazy loading
 * - Apple Design System: Feature Card layout
 * - Accessible: H2 cho section title, H3 cho program names
 *
 * Requirements: 1.1, 4.6
 */

import Image from 'next/image';

export interface ProgramItem {
  name: string;
  description: string;
  imageUrl?: string;
}

export interface ProgramContent {
  title: string;
  programs: ProgramItem[];
}

interface ProgramSectionProps {
  id: string;
  content: ProgramContent;
  isVisible: boolean;
}

export default function ProgramSection({ id, content, isVisible }: ProgramSectionProps) {
  if (!isVisible) return null;

  const { title, programs } = content;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      style={{
        background: '#F5F5F7',
        padding: '56px 24px',
        borderBottom: '1px solid #EDEDF2',
      }}
    >
      <div style={{ maxWidth: '1262px', margin: '0 auto' }}>
        <h2
          id={`${id}-title`}
          style={{
            fontFamily:
              'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '28px',
            fontWeight: 400,
            lineHeight: '32px',
            color: '#1D1D1F',
            marginBottom: '40px',
            textAlign: 'center',
          }}
        >
          {title}
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
          }}
          className="program-grid"
        >
          {programs.map((program, index) => (
            <article
              key={index}
              style={{
                background: '#FFFFFF',
                border: '1px solid #EDEDF2',
                padding: '32px 40px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {program.imageUrl && (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/9',
                    overflow: 'hidden',
                    marginBottom: '8px',
                  }}
                >
                  <Image
                    src={program.imageUrl}
                    alt={program.name}
                    fill
                    loading="lazy"
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              )}

              <h3
                style={{
                  fontFamily:
                    'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '24px',
                  fontWeight: 600,
                  lineHeight: '28px',
                  color: '#1D1D1F',
                  margin: 0,
                }}
              >
                {program.name}
              </h3>

              <p
                style={{
                  fontFamily:
                    'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '17px',
                  fontWeight: 400,
                  lineHeight: '25px',
                  color: '#333336',
                  margin: 0,
                }}
              >
                {program.description}
              </p>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .program-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .program-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
