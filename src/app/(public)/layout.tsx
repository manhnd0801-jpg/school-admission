/**
 * Public Layout — Layout cho các route công khai (Landing Page)
 *
 * Server Component layout bao gồm StickyNav.
 * Metadata: meta title, meta description, Open Graph tags cho SEO.
 * Requirements: 1.6, 1.7, 4.1, 4.4
 */

import type { Metadata } from 'next';
import StickyNav from '@/components/landing/StickyNav';

const SCHOOL_NAME = 'Trường THPT Nguyễn Trãi';
const SITE_DESCRIPTION =
  'Trang tuyển sinh chính thức của Trường THPT Nguyễn Trãi. Khám phá chương trình đào tạo chất lượng cao, đội ngũ giáo viên giàu kinh nghiệm và cơ sở vật chất hiện đại. Đăng ký tư vấn tuyển sinh ngay hôm nay.';

export const metadata: Metadata = {
  title: {
    default: `${SCHOOL_NAME} - Tuyển Sinh`,
    template: `%s | ${SCHOOL_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'tuyển sinh THPT',
    'trường THPT Nguyễn Trãi',
    'đăng ký tư vấn tuyển sinh',
    'chương trình đào tạo THPT',
    'học phí THPT',
  ],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: SCHOOL_NAME,
    title: `${SCHOOL_NAME} - Tuyển Sinh`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: `${SCHOOL_NAME} - Tuyển Sinh`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SCHOOL_NAME} - Tuyển Sinh`,
    description: SITE_DESCRIPTION,
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StickyNav />
      <main>{children}</main>
    </>
  );
}
