/**
 * ExtracurricularSection — Section Hoạt động ngoại khóa
 *
 * - Title, activities array (name, description, imageUrl)
 * - Next.js <Image> với WebP, lazy loading
 * - Apple Design System: card grid layout
 * - Accessible: H2 cho section title, H3 cho activity names
 *
 * Requirements: 1.1, 4.6
 */

import Image from 'next/image';

export interface ActivityItem {
  name: string;
  description: string;
  imageUrl?: string;
}

export interface ExtracurricularContent {
  title: string;
  activities: ActivityItem[];
}

interface ExtracurricularSectionProps {
  id: string;
  content: ExtracurricularContent;
  isVisible: boolean;
}

export default function ExtracurricularSection({
  id,
  content,
  isVisible,
}: ExtracurricularSectionProps) {
  if (!isVisible) return null;

  const { title, activities } = content;

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
          className="extracurricular-grid"
        >
          {activities.map((activity, index) => (
            <article
              key={index}
              style={{
                background: '#F5F5F7',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {activity.imageUrl && (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/9',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={activity.imageUrl}
                    alt={activity.name}
                    fill
                    loading="lazy"
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              )}

              <div style={{ padding: '24px', flex: 1 }}>
                <h3
                  style={{
                    fontFamily:
                      'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '24px',
                    fontWeight: 600,
                    lineHeight: '28px',
                    color: '#1D1D1F',
                    margin: '0 0 12px 0',
                  }}
                >
                  {activity.name}
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
                  {activity.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .extracurricular-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .extracurricular-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
