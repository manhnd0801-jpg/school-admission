/**
 * AdmissionSection — Section Tuyển sinh
 *
 * - Title, steps array (step, title, description), requirements, deadline
 * - Apple Design System: numbered steps layout
 * - Accessible: H2 cho section title, H3 cho step titles
 *
 * Requirements: 1.1, 4.6
 */

export interface AdmissionStep {
  step: number;
  title: string;
  description: string;
}

export interface AdmissionContent {
  title: string;
  steps: AdmissionStep[];
  requirements?: string;
  deadline?: string;
}

interface AdmissionSectionProps {
  id: string;
  content: AdmissionContent;
  isVisible: boolean;
}

export default function AdmissionSection({ id, content, isVisible }: AdmissionSectionProps) {
  if (!isVisible) return null;

  const { title, steps, requirements, deadline } = content;

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

        {/* Steps */}
        <ol
          style={{
            listStyle: 'none',
            margin: '0 0 40px 0',
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '32px',
          }}
          className="admission-steps"
        >
          {steps.map((step) => (
            <li
              key={step.step}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Step number */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#0071E3',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily:
                    'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '17px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                {step.step}
              </div>

              <h3
                style={{
                  fontFamily:
                    'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '17px',
                  fontWeight: 600,
                  lineHeight: '25px',
                  color: '#1D1D1F',
                  margin: 0,
                }}
              >
                {step.title}
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
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        {/* Requirements and deadline */}
        {(requirements || deadline) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: requirements && deadline ? '1fr 1fr' : '1fr',
              gap: '24px',
            }}
            className="admission-info"
          >
            {requirements && (
              <div
                style={{
                  background: '#F5F5F7',
                  padding: '32px',
                  border: '1px solid #EDEDF2',
                }}
              >
                <h3
                  style={{
                    fontFamily:
                      'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '17px',
                    fontWeight: 600,
                    lineHeight: '25px',
                    color: '#1D1D1F',
                    margin: '0 0 12px 0',
                  }}
                >
                  Điều kiện tuyển sinh
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
                    whiteSpace: 'pre-line',
                  }}
                >
                  {requirements}
                </p>
              </div>
            )}

            {deadline && (
              <div
                style={{
                  background: '#F5F5F7',
                  padding: '32px',
                  border: '1px solid #EDEDF2',
                }}
              >
                <h3
                  style={{
                    fontFamily:
                      'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '17px',
                    fontWeight: 600,
                    lineHeight: '25px',
                    color: '#1D1D1F',
                    margin: '0 0 12px 0',
                  }}
                >
                  Hạn nộp hồ sơ
                </h3>
                <p
                  style={{
                    fontFamily:
                      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '17px',
                    fontWeight: 600,
                    lineHeight: '25px',
                    color: '#0071E3',
                    margin: 0,
                  }}
                >
                  {deadline}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .admission-steps {
            grid-template-columns: 1fr !important;
          }
          .admission-info {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .admission-steps {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
