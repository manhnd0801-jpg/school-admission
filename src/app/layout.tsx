import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Trường THPT - Tuyển Sinh',
    template: '%s | Trường THPT',
  },
  description: 'Trang tuyển sinh chính thức của Trường THPT. Đăng ký tư vấn tuyển sinh ngay hôm nay.',
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
