/**
 * AchievementSection — Section Thành tích
 *
 * - Title, achievements array (label, value, description)
 * - Apple Design System: colors, typography, spacing
 * - Accessible: H2 cho section title, H3 cho achievement values
 *
 * Requirements: 1.1, 4.6
 */

export interface AchievementItem {
  label: string;
  value: string;
  description?: string;
}

export interface AchievementContent {
  title: string;
  achievements: AchievementItem[];
}

interface AchievementSectionProps {
  id: string;
  content: AchievementContent;
  isVisible: boolean;
}

export default function AchievementSection({ id, content, isVisible }: AchievementSectionProps) {
  if (!isVisible) return null;

  const { title, achievements } = content;

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
            marginBottom: '48px',
            textAlign: 'center',
          }}
        >
          {title}
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(achievements.length, 4)}, 1fr)`,
            gap: '32px',
          }}
          className="achievement-grid"
        >
          {achievements.map((item, index) => (
            <div
              key={index}
              style={{
                textAlign: 'center',
                padding: '32px 24px',
                border: '1px solid #EDEDF2',
              }}
            >
              <h3
                style={{
                  fontFamily:
                    'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '34px',
                  fontWeight: 600,
                  lineHeight: '50px',
                  color: '#0071E3',
                  margin: '0 0 8px 0',
                }}
              >
                {item.value}
              </h3>

              <div
                style={{
                  fontFamily:
                    'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '17px',
                  fontWeight: 400,
                  lineHeight: '25px',
                  color: '#1D1D1F',
                  marginBottom: item.description ? '8px' : '0',
                }}
              >
                {item.label}
              </div>

              {item.description && (
                <p
                  style={{
                    fontFamily:
                      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '16px',
                    color: '#6E6E73',
                    margin: 0,
                  }}
                >
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .achievement-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .achievement-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
