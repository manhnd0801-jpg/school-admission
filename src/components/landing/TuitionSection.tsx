/**
 * TuitionSection — Section Học phí
 *
 * - Optional title, items array (grade, amount, currency, period, notes), scholarshipInfo
 * - Apple Design System: table/card layout
 * - Accessible: H2 cho section title, table với proper headers
 *
 * Requirements: 1.1, 4.6
 */

export interface TuitionItem {
  grade: string;
  amount: number;
  currency: string;
  period: string;
  notes?: string;
}

export interface TuitionContent {
  title?: string;
  items: TuitionItem[];
  scholarshipInfo?: string;
}

interface TuitionSectionProps {
  id: string;
  content: TuitionContent;
  isVisible: boolean;
}

function formatAmount(amount: number, currency: string): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return `${amount.toLocaleString()} ${currency}`;
}

export default function TuitionSection({ id, content, isVisible }: TuitionSectionProps) {
  if (!isVisible) return null;

  const { title, items, scholarshipInfo } = content;

  return (
    <section
      id={id}
      aria-labelledby={title ? `${id}-title` : undefined}
      style={{
        background: '#FFFFFF',
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

        {/* Tuition table */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily:
                'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            <thead>
              <tr
                style={{
                  background: '#F5F5F7',
                  borderBottom: '2px solid #EDEDF2',
                }}
              >
                <th
                  scope="col"
                  style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    lineHeight: '16px',
                    color: '#6E6E73',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Khối lớp
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '16px 24px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: 600,
                    lineHeight: '16px',
                    color: '#6E6E73',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Học phí
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    lineHeight: '16px',
                    color: '#6E6E73',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Kỳ hạn
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    lineHeight: '16px',
                    color: '#6E6E73',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: '1px solid #EDEDF2',
                    background: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                  }}
                >
                  <td
                    style={{
                      padding: '20px 24px',
                      fontSize: '17px',
                      fontWeight: 600,
                      lineHeight: '25px',
                      color: '#1D1D1F',
                    }}
                  >
                    {item.grade}
                  </td>
                  <td
                    style={{
                      padding: '20px 24px',
                      fontSize: '17px',
                      fontWeight: 400,
                      lineHeight: '25px',
                      color: '#0071E3',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatAmount(item.amount, item.currency)}
                  </td>
                  <td
                    style={{
                      padding: '20px 24px',
                      fontSize: '17px',
                      fontWeight: 400,
                      lineHeight: '25px',
                      color: '#333336',
                    }}
                  >
                    {item.period}
                  </td>
                  <td
                    style={{
                      padding: '20px 24px',
                      fontSize: '12px',
                      fontWeight: 400,
                      lineHeight: '16px',
                      color: '#6E6E73',
                    }}
                  >
                    {item.notes ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Scholarship info */}
        {scholarshipInfo && (
          <div
            style={{
              marginTop: '32px',
              padding: '24px 32px',
              background: 'rgba(0,113,227,0.05)',
              border: '1px solid rgba(0,113,227,0.2)',
            }}
          >
            <h3
              style={{
                fontFamily:
                  'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '17px',
                fontWeight: 600,
                lineHeight: '25px',
                color: '#0071E3',
                margin: '0 0 8px 0',
              }}
            >
              Chính sách học bổng
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
              {scholarshipInfo}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
