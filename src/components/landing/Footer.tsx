'use client';

/**
 * Footer — Footer của Landing Page
 *
 * - schoolName, address, phone, email, socialLinks, copyrightText
 * - Apple Design System: dark background (#272729)
 * - Accessible: proper landmark role, links with descriptive text
 *
 * Requirements: 1.1, 4.6
 */

export interface SocialLink {
  platform: string;
  url: string;
}

export interface FooterContent {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  socialLinks?: SocialLink[];
  copyrightText?: string;
}

interface FooterProps {
  id: string;
  content: FooterContent;
  isVisible: boolean;
}

function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();

  if (p === 'facebook') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }

  if (p === 'youtube') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }

  if (p === 'zalo') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 16.5c-.375.375-.938.375-1.313 0l-2.25-2.25c-.375-.375-.375-.938 0-1.313l.563-.563-1.875-1.875-.563.563c-.375.375-.938.375-1.313 0l-2.25-2.25c-.375-.375-.375-.938 0-1.313l1.5-1.5c.375-.375.938-.375 1.313 0l6.75 6.75c.375.375.375.938 0 1.313l-1.5 1.5-.062-.062z" />
      </svg>
    );
  }

  // Generic link icon
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export default function Footer({ id, content, isVisible }: FooterProps) {
  if (!isVisible) return null;

  const { schoolName, address, phone, email, socialLinks, copyrightText } = content;
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id={id}
      aria-label="Footer"
      style={{
        background: '#272729',
        color: '#FFFFFF',
        padding: '48px 24px 32px',
      }}
    >
      <div style={{ maxWidth: '1262px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: '48px',
            marginBottom: '40px',
          }}
          className="footer-grid"
        >
          {/* School info */}
          <div>
            <h3
              style={{
                fontFamily:
                  'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '17px',
                fontWeight: 600,
                lineHeight: '25px',
                color: '#FFFFFF',
                margin: '0 0 16px 0',
              }}
            >
              {schoolName}
            </h3>

            <address
              style={{
                fontStyle: 'normal',
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '12px',
                fontWeight: 400,
                lineHeight: '20px',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <p style={{ margin: '0 0 8px 0' }}>{address}</p>
            </address>
          </div>

          {/* Contact */}
          <div>
            <h3
              style={{
                fontFamily:
                  'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '12px',
                fontWeight: 600,
                lineHeight: '16px',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '0 0 16px 0',
              }}
            >
              Liên hệ
            </h3>

            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <li>
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  style={{
                    fontFamily:
                      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '16px',
                    color: 'rgba(255,255,255,0.8)',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.8)';
                  }}
                >
                  📞 {phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${email}`}
                  style={{
                    fontFamily:
                      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '16px',
                    color: 'rgba(255,255,255,0.8)',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.8)';
                  }}
                >
                  ✉️ {email}
                </a>
              </li>
            </ul>
          </div>

          {/* Social links */}
          {socialLinks && socialLinks.length > 0 && (
            <div>
              <h3
                style={{
                  fontFamily:
                    'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '12px',
                  fontWeight: 600,
                  lineHeight: '16px',
                  color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  margin: '0 0 16px 0',
                }}
              >
                Mạng xã hội
              </h3>

              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                {socialLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${schoolName} trên ${link.platform}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.8)',
                        textDecoration: 'none',
                        transition: 'background 0.15s ease, color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.background = 'rgba(255,255,255,0.2)';
                        el.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.background = 'rgba(255,255,255,0.1)';
                        el.style.color = 'rgba(255,255,255,0.8)';
                      }}
                    >
                      <SocialIcon platform={link.platform} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
          className="footer-bottom"
        >
          <p
            style={{
              fontFamily:
                'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '12px',
              fontWeight: 400,
              lineHeight: '16px',
              color: 'rgba(255,255,255,0.4)',
              margin: 0,
            }}
          >
            {copyrightText ?? `© ${currentYear} ${schoolName}. Bảo lưu mọi quyền.`}
          </p>

          <a
            href="/chinh-sach-bao-mat"
            style={{
              fontFamily:
                'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '12px',
              fontWeight: 400,
              lineHeight: '16px',
              color: 'rgba(255,255,255,0.4)',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.8)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.4)';
            }}
          >
            Chính sách bảo mật
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .footer-bottom {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
