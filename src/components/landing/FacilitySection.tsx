/**
 * FacilitySection — Section Cơ sở vật chất
 *
 * - Title, facilities array (name, description, imageUrl) — gallery layout
 * - Next.js <Image> với WebP, lazy loading
 * - Apple Design System: gallery grid layout
 * - Accessible: H2 cho section title, H3 cho facility names
 *
 * Requirements: 1.1, 4.6
 */

import Image from 'next/image';

export interface FacilityItem {
  name: string;
  description: string;
  imageUrl?: string;
}

export interface FacilityContent {
  title: string;
  facilities: FacilityItem[];
}

interface FacilitySectionProps {
  id: string;
  content: FacilityContent;
  isVisible: boolean;
}

export default function FacilitySection({ id, content, isVisible }: FacilitySectionProps) {
  if (!isVisible) return null;

  const { title, facilities } = content;

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

        {/* Gallery grid: first item spans 2 columns if there are 3+ items */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}
          className="facility-gallery"
        >
          {facilities.map((facility, index) => (
            <article
              key={index}
              style={{
                position: 'relative',
                background: '#FFFFFF',
                overflow: 'hidden',
                // First item spans 2 columns in a 3-col grid when there are enough items
                gridColumn: index === 0 && facilities.length >= 3 ? 'span 2' : 'span 1',
              }}
              className={index === 0 && facilities.length >= 3 ? 'facility-featured' : ''}
            >
              {facility.imageUrl && (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: index === 0 && facilities.length >= 3 ? '16/7' : '4/3',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={facility.imageUrl}
                    alt={facility.name}
                    fill
                    loading="lazy"
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              )}

              <div style={{ padding: '24px' }}>
                <h3
                  style={{
                    fontFamily:
                      'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '24px',
                    fontWeight: 600,
                    lineHeight: '28px',
                    color: '#1D1D1F',
                    margin: '0 0 8px 0',
                  }}
                >
                  {facility.name}
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
                  {facility.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .facility-gallery {
            grid-template-columns: 1fr !important;
          }
          .facility-featured {
            grid-column: span 1 !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .facility-gallery {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .facility-featured {
            grid-column: span 2 !important;
          }
        }
      `}</style>
    </section>
  );
}
