/**
 * Chính Sách Bảo Mật — Privacy Policy Page
 *
 * Trang tĩnh mô tả chính sách bảo mật dữ liệu cá nhân của trường.
 * - noindex meta tag: không được index bởi search engine
 * - Liên kết từ Footer và Form đăng ký
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Chính Sách Bảo Mật',
  description: 'Chính sách bảo mật dữ liệu cá nhân của Trường THPT Nguyễn Trãi.',
  robots: {
    index: false,
    follow: false,
  },
};

const SCHOOL_NAME = 'Trường THPT Nguyễn Trãi';
const SCHOOL_EMAIL = 'tuyensinh@nguyentrai.edu.vn';
const SCHOOL_PHONE = '028 3456 7890';

export default function ChinhSachBaoMatPage() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        minHeight: '100vh',
        paddingTop: '80px',
        paddingBottom: '80px',
      }}
    >
      <div
        style={{
          maxWidth: '1262px',
          margin: '0 auto',
          padding: '0 24px',
        }}
      >
        {/* Back link */}
        <div style={{ marginBottom: '32px' }}>
          <Link
            href="/"
            style={{
              fontFamily:
                'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '15px',
              fontWeight: 400,
              color: '#0071E3',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Quay lại trang chủ
          </Link>
        </div>

        {/* Page heading */}
        <h1
          style={{
            fontFamily:
              'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '40px',
            fontWeight: 700,
            lineHeight: '44px',
            letterSpacing: '-0.5px',
            color: '#1D1D1F',
            margin: '0 0 16px 0',
          }}
        >
          Chính Sách Bảo Mật
        </h1>

        <p
          style={{
            fontFamily:
              'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '17px',
            fontWeight: 400,
            lineHeight: '25px',
            color: '#6E6E73',
            margin: '0 0 48px 0',
          }}
        >
          Cập nhật lần cuối: tháng 1 năm 2025
        </p>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #EDEDF2', marginBottom: '48px' }} />

        {/* Content */}
        <div
          style={{
            maxWidth: '800px',
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
          }}
        >
          {/* Intro */}
          <section>
            <p
              style={{
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '17px',
                fontWeight: 400,
                lineHeight: '25px',
                color: '#1D1D1F',
                margin: 0,
              }}
            >
              {SCHOOL_NAME} cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của quý phụ huynh và
              học sinh. Chính sách bảo mật này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ
              thông tin cá nhân khi quý vị sử dụng trang web tuyển sinh của trường.
            </p>
          </section>

          {/* Section 1: Loại dữ liệu thu thập */}
          <section aria-labelledby="data-collected-heading">
            <h2
              id="data-collected-heading"
              style={{
                fontFamily:
                  'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '28px',
                fontWeight: 600,
                lineHeight: '36px',
                color: '#1D1D1F',
                margin: '0 0 16px 0',
              }}
            >
              1. Loại Dữ Liệu Thu Thập
            </h2>
            <p
              style={{
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '17px',
                lineHeight: '25px',
                color: '#1D1D1F',
                margin: '0 0 16px 0',
              }}
            >
              Khi quý phụ huynh đăng ký tư vấn tuyển sinh, chúng tôi thu thập các thông tin sau:
            </p>
            <ul
              style={{
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '17px',
                lineHeight: '25px',
                color: '#1D1D1F',
                margin: 0,
                paddingLeft: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <li>
                <strong>Họ và tên phụ huynh:</strong> Tên đầy đủ của người đăng ký tư vấn
              </li>
              <li>
                <strong>Số điện thoại:</strong> Số điện thoại liên hệ để tư vấn viên có thể gọi lại
              </li>
              <li>
                <strong>Địa chỉ email:</strong> Email để gửi thông tin tuyển sinh và xác nhận đăng ký
              </li>
              <li>
                <strong>Tên học sinh:</strong> Họ và tên của học sinh dự kiến nhập học
              </li>
              <li>
                <strong>Năm học dự kiến:</strong> Năm học mà học sinh dự kiến bắt đầu theo học tại trường
              </li>
            </ul>
          </section>

          {/* Section 2: Mục đích sử dụng */}
          <section aria-labelledby="purpose-heading">
            <h2
              id="purpose-heading"
              style={{
                fontFamily:
                  'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '28px',
                fontWeight: 600,
                lineHeight: '36px',
                color: '#1D1D1F',
                margin: '0 0 16px 0',
              }}
            >
              2. Mục Đích Sử Dụng Dữ Liệu
            </h2>
            <p
              style={{
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '17px',
                lineHeight: '25px',
                color: '#1D1D1F',
                margin: '0 0 16px 0',
              }}
            >
              Thông tin cá nhân được thu thập chỉ nhằm mục đích:
            </p>
            <ul
              style={{
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '17px',
                lineHeight: '25px',
                color: '#1D1D1F',
                margin: 0,
                paddingLeft: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <li>Liên hệ tư vấn tuyển sinh theo yêu cầu của quý phụ huynh</li>
              <li>Cung cấp thông tin về chương trình đào tạo, học phí và quy trình nhập học</li>
              <li>Gửi tài liệu tuyển sinh và thông báo liên quan đến quá trình đăng ký</li>
              <li>Cải thiện chất lượng dịch vụ tư vấn tuyển sinh của trường</li>
            </ul>
            <p
              style={{
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '17px',
                lineHeight: '25px',
                color: '#1D1D1F',
                margin: '16px 0 0 0',
              }}
            >
              Chúng tôi <strong>không</strong> chia sẻ, bán hoặc chuyển nhượng thông tin cá nhân
              của quý vị cho bên thứ ba vì mục đích thương mại.
            </p>
          </section>

          {/* Section 3: Thời gian lưu trữ */}
          <section aria-labelledby="retention-heading">
            <h2
              id="retention-heading"
              style={{
                fontFamily:
                  'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '28px',
                fontWeight: 600,
                lineHeight: '36px',
                color: '#1D1D1F',
                margin: '0 0 16px 0',
              }}
            >
              3. Thời Gian Lưu Trữ Dữ Liệu
            </h2>
            <p
              style={{
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '17px',
                lineHeight: '25px',
                color: '#1D1D1F',
                margin: '0 0 16px 0',
              }}
            >
              Dữ liệu cá nhân của quý vị được lưu trữ trong thời gian{' '}
              <strong>tối thiểu 3 năm</strong> kể từ ngày đăng ký, theo quy định của pháp luật
              Việt Nam về lưu trữ hồ sơ giáo dục.
            </p>
            <p
              style={{
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '17px',
                lineHeight: '25px',
                color: '#1D1D1F',
                margin: 0,
              }}
            >
              Sau thời hạn lưu trữ bắt buộc, dữ liệu sẽ được xóa an toàn khỏi hệ thống của chúng
              tôi, trừ khi có yêu cầu lưu trữ lâu hơn theo quy định pháp luật hoặc theo yêu cầu
              của quý vị.
            </p>
          </section>

          {/* Section 4: Quyền của người dùng */}
          <section aria-labelledby="user-rights-heading">
            <h2
              id="user-rights-heading"
              style={{
                fontFamily:
                  'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '28px',
                fontWeight: 600,
                lineHeight: '36px',
                color: '#1D1D1F',
                margin: '0 0 16px 0',
              }}
            >
              4. Quyền Của Người Dùng
            </h2>
            <p
              style={{
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '17px',
                lineHeight: '25px',
                color: '#1D1D1F',
                margin: '0 0 16px 0',
              }}
            >
              Quý vị có đầy đủ các quyền sau đối với dữ liệu cá nhân của mình:
            </p>
            <ul
              style={{
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '17px',
                lineHeight: '25px',
                color: '#1D1D1F',
                margin: 0,
                paddingLeft: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <li>
                <strong>Quyền truy cập:</strong> Quý vị có quyền yêu cầu xem toàn bộ thông tin cá
                nhân mà chúng tôi đang lưu trữ về quý vị.
              </li>
              <li>
                <strong>Quyền chỉnh sửa:</strong> Quý vị có quyền yêu cầu cập nhật hoặc sửa đổi
                thông tin cá nhân không chính xác hoặc không đầy đủ.
              </li>
              <li>
                <strong>Quyền xóa dữ liệu:</strong> Quý vị có quyền yêu cầu xóa dữ liệu cá nhân
                của mình, trừ trường hợp chúng tôi có nghĩa vụ pháp lý phải lưu giữ.
              </li>
            </ul>
            <p
              style={{
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '17px',
                lineHeight: '25px',
                color: '#1D1D1F',
                margin: '16px 0 0 0',
              }}
            >
              Để thực hiện bất kỳ quyền nào nêu trên, vui lòng liên hệ với chúng tôi theo thông
              tin bên dưới. Chúng tôi sẽ phản hồi trong vòng 5 ngày làm việc.
            </p>
          </section>

          {/* Section 5: Thông tin liên hệ */}
          <section aria-labelledby="contact-heading">
            <h2
              id="contact-heading"
              style={{
                fontFamily:
                  'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '28px',
                fontWeight: 600,
                lineHeight: '36px',
                color: '#1D1D1F',
                margin: '0 0 16px 0',
              }}
            >
              5. Thông Tin Liên Hệ
            </h2>
            <p
              style={{
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '17px',
                lineHeight: '25px',
                color: '#1D1D1F',
                margin: '0 0 16px 0',
              }}
            >
              Nếu quý vị có bất kỳ câu hỏi nào về chính sách bảo mật này hoặc muốn thực hiện các
              quyền của mình, vui lòng liên hệ với bộ phận tuyển sinh của {SCHOOL_NAME}:
            </p>

            <div
              style={{
                background: '#EDEDF2',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontFamily:
                      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#1D1D1F',
                    minWidth: '80px',
                  }}
                >
                  Email:
                </span>
                <a
                  href={`mailto:${SCHOOL_EMAIL}`}
                  style={{
                    fontFamily:
                      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '15px',
                    color: '#0071E3',
                    textDecoration: 'none',
                  }}
                >
                  {SCHOOL_EMAIL}
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontFamily:
                      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#1D1D1F',
                    minWidth: '80px',
                  }}
                >
                  Điện thoại:
                </span>
                <a
                  href={`tel:${SCHOOL_PHONE.replace(/\s/g, '')}`}
                  style={{
                    fontFamily:
                      'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '15px',
                    color: '#0071E3',
                    textDecoration: 'none',
                  }}
                >
                  {SCHOOL_PHONE}
                </a>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #EDEDF2' }} />

          {/* Footer note */}
          <p
            style={{
              fontFamily:
                'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '14px',
              lineHeight: '20px',
              color: '#6E6E73',
              margin: 0,
            }}
          >
            Chính sách bảo mật này có thể được cập nhật theo thời gian để phản ánh các thay đổi
            trong quy định pháp luật hoặc thực tiễn hoạt động của trường. Mọi thay đổi quan trọng
            sẽ được thông báo trên trang web này.
          </p>
        </div>
      </div>
    </div>
  );
}
