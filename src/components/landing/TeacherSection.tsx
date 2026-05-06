/**
 * TeacherSection — Section Giáo viên
 *
 * - Optional title, teachers array (name, subject, bio, avatarUrl)
 * - Next.js <Image> với WebP, lazy loading
 * - Apple Design System: card grid layout
 * - Accessible: H2 cho section title, H3 cho teacher names
 *
 * Requirements: 1.1, 4.6
 */

import Image from 'next/image';

export interface TeacherItem {
  name: string;
  subject: string;
  bio: string;
  avatarUrl: string;
}

export interface TeacherContent {
  title?: string;
  teachers: TeacherItem[];
}

interface TeacherSectionProps {
  id: string;
  content: TeacherContent;
  isVisible: boolean;
}

export default function TeacherSection({ id, content, isVisible }: TeacherSectionProps) {
  if (!isVisible) return null;

  const { title, teachers } = content;

  return (
    <section
      id={id}
      aria-labelledby={title ? `${id}-title` : undefined}
      style={{
        background: '#F5F5F7',
        padding: '56px 24px',
        borderBottom: '1px solid #EDEDF2',
      }}
    >
      <div style={{ maxWidth: '1262px', margin: '0 auto' }}>
        {title && (
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
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
          }}
          className="teacher-grid"
        >
          {teachers.map((teacher, index) => (
            <article
              key={index}
              style={{
                background: '#FFFFFF',
                border: '1px solid #EDEDF2',
                padding: '32px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  position: 'relative',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <Image
                  src={teacher.avatarUrl}
                  alt={`Ảnh đại diện của ${teacher.name}`}
                  fill
                  loading="lazy"
                  sizes="80px"
                  style={{ objectFit: 'cover' }}
                />
              </div>

              <div>
                <h3
                  style={{
                    fontFamily:
                      'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '17px',
                    fontWeight: 600,
                    lineHeight: '25px',
                    color: '#1D1D1F',
                    margin: '0 0 4px 0',
                  }}
                >
                  {teacher.name}
                </h3>

                <div
                  style={{
                    fontFamily:
                      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '16px',
                    color: '#0071E3',
                    marginBottom: '8px',
                  }}
                >
                  {teacher.subject}
                </div>

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
                  {teacher.bio}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .teacher-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .teacher-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
