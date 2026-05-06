/**
 * Landing Page — Trang chủ tuyển sinh (SSG/ISR)
 *
 * Fetch nội dung từ /api/content và render đầy đủ 11 section theo thứ tự:
 * Hero, Giới thiệu, Chương trình, Thành tích, Cơ sở vật chất, Ngoại khóa,
 * Giáo viên, Tuyển sinh, Học phí, Testimonials, Form đăng ký, Footer
 *
 * Mỗi section có id attribute cho smooth scroll navigation.
 *
 * Requirements: 1.1, 1.2
 */

import type { SectionProps } from '@/types';
import HeroSection from '@/components/landing/HeroSection';
import IntroSection from '@/components/landing/IntroSection';
import ProgramSection from '@/components/landing/ProgramSection';
import AchievementSection from '@/components/landing/AchievementSection';
import FacilitySection from '@/components/landing/FacilitySection';
import ExtracurricularSection from '@/components/landing/ExtracurricularSection';
import TeacherSection from '@/components/landing/TeacherSection';
import AdmissionSection from '@/components/landing/AdmissionSection';
import TuitionSection from '@/components/landing/TuitionSection';
import TestimonialSection from '@/components/landing/TestimonialSection';
import Footer from '@/components/landing/Footer';
import FloatingCTA from '@/components/landing/FloatingCTA';
import RegistrationForm from '@/components/landing/RegistrationForm';

// ISR: revalidate every 60 seconds
export const revalidate = 60;

// Section ID mapping: SectionType → anchor id
const SECTION_ANCHOR: Record<string, string> = {
  HERO: 'hero',
  INTRO: 'intro',
  PROGRAM: 'program',
  ACHIEVEMENT: 'achievement',
  FACILITY: 'facility',
  EXTRACURRICULAR: 'extracurricular',
  TEACHER: 'teacher',
  ADMISSION: 'admission',
  TUITION: 'tuition',
  TESTIMONIAL: 'testimonial',
  FOOTER: 'footer',
};

// Ordered list of section types as they appear on the page
const SECTION_ORDER = [
  'HERO',
  'INTRO',
  'PROGRAM',
  'ACHIEVEMENT',
  'FACILITY',
  'EXTRACURRICULAR',
  'TEACHER',
  'ADMISSION',
  'TUITION',
  'TESTIMONIAL',
  'FOOTER',
];

async function fetchSections(): Promise<SectionProps[]> {
  try {
    const baseUrl =
      process.env['NEXT_PUBLIC_APP_URL'] ??
      (process.env['VERCEL_URL'] ? `https://${process.env['VERCEL_URL']}` : 'http://localhost:3000');

    const res = await fetch(`${baseUrl}/api/content`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error(`[LandingPage] /api/content responded with ${res.status}`);
      return [];
    }

    const json = (await res.json()) as { success: boolean; data: SectionProps[] };
    if (!json.success) return [];
    return json.data;
  } catch (err) {
    console.error('[LandingPage] Failed to fetch sections:', err);
    return [];
  }
}

/**
 * Render the appropriate section component based on section type.
 * Falls back to null for unknown types.
 */
function renderSection(section: SectionProps, anchor: string): React.ReactNode {
  const props = {
    id: anchor,
    content: section.content as Record<string, unknown>,
    isVisible: section.isVisible,
  };

  switch (section.type) {
    case 'HERO':
      return (
        <HeroSection
          key={section.type}
          id={anchor}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={section.content as any}
          isVisible={section.isVisible}
        />
      );
    case 'INTRO':
      return (
        <IntroSection
          key={section.type}
          {...props}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={section.content as any}
        />
      );
    case 'PROGRAM':
      return (
        <ProgramSection
          key={section.type}
          {...props}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={section.content as any}
        />
      );
    case 'ACHIEVEMENT':
      return (
        <AchievementSection
          key={section.type}
          {...props}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={section.content as any}
        />
      );
    case 'FACILITY':
      return (
        <FacilitySection
          key={section.type}
          {...props}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={section.content as any}
        />
      );
    case 'EXTRACURRICULAR':
      return (
        <ExtracurricularSection
          key={section.type}
          {...props}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={section.content as any}
        />
      );
    case 'TEACHER':
      return (
        <TeacherSection
          key={section.type}
          {...props}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={section.content as any}
        />
      );
    case 'ADMISSION':
      return (
        <AdmissionSection
          key={section.type}
          {...props}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={section.content as any}
        />
      );
    case 'TUITION':
      return (
        <TuitionSection
          key={section.type}
          {...props}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={section.content as any}
        />
      );
    case 'TESTIMONIAL':
      return (
        <TestimonialSection
          key={section.type}
          {...props}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={section.content as any}
        />
      );
    case 'FOOTER':
      return (
        <Footer
          key={section.type}
          {...props}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={section.content as any}
        />
      );
    default:
      return null;
  }
}

export default async function LandingPage() {
  const sections = await fetchSections();

  // Build a map of type → section data for quick lookup
  const sectionMap = new Map<string, SectionProps>();
  sections.forEach((s) => sectionMap.set(s.type, s));

  return (
    <>
      {SECTION_ORDER.map((type) => {
        const section = sectionMap.get(type);
        const anchor = SECTION_ANCHOR[type] ?? type.toLowerCase();

        // Skip sections that are explicitly hidden in CMS
        if (section && !section.isVisible) return null;

        // If no section data from API, skip rendering
        if (!section) return null;

        // Footer section: render registration form placeholder before footer
        if (type === 'FOOTER') {
          return (
            <div key={type}>
              {/* Registration form — Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.11 */}
              <RegistrationForm />

              {/* Footer */}
              {renderSection(section, anchor)}
            </div>
          );
        }

        return renderSection(section, anchor);
      })}

      {/* Floating CTA — visible only on mobile */}
      <FloatingCTA />
    </>
  );
}
