/**
 * Zod schemas for Section content validation
 *
 * Each SectionType has a specific content schema.
 * validateSectionContent() is called before saving any Section to the DB
 * to prevent Landing Page crashes from malformed content.
 *
 * Requirements: 6.1
 */

import { z } from 'zod';

export const HeroContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().min(1),
  backgroundType: z.enum(['image', 'video']),
  backgroundUrl: z.string().url(),
  ctaText: z.string().min(1),
  ctaTarget: z.string().default('#registration-form'),
});

export const IntroContentSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  imageUrl: z.string().url().optional(),
  stats: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .optional(),
});

export const ProgramContentSchema = z.object({
  title: z.string().min(1),
  programs: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string(),
      imageUrl: z.string().url().optional(),
    })
  ),
});

export const AchievementContentSchema = z.object({
  title: z.string().min(1),
  achievements: z.array(
    z.object({
      label: z.string().min(1),
      value: z.string().min(1),
      description: z.string().optional(),
    })
  ),
});

export const FacilityContentSchema = z.object({
  title: z.string().min(1),
  facilities: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string(),
      imageUrl: z.string().url().optional(),
    })
  ),
});

export const ExtracurricularContentSchema = z.object({
  title: z.string().min(1),
  activities: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string(),
      imageUrl: z.string().url().optional(),
    })
  ),
});

export const TeacherContentSchema = z.object({
  title: z.string().min(1).optional(),
  teachers: z.array(
    z.object({
      name: z.string().min(1),
      subject: z.string().min(1),
      bio: z.string(),
      avatarUrl: z.string().url(),
    })
  ),
});

export const AdmissionContentSchema = z.object({
  title: z.string().min(1),
  steps: z.array(
    z.object({
      step: z.number().int().positive(),
      title: z.string().min(1),
      description: z.string(),
    })
  ),
  requirements: z.string().optional(),
  deadline: z.string().optional(),
});

export const TuitionContentSchema = z.object({
  title: z.string().min(1).optional(),
  items: z.array(
    z.object({
      grade: z.string().min(1),
      amount: z.number().positive(),
      currency: z.string().default('VND'),
      period: z.string().min(1),
      notes: z.string().optional(),
    })
  ),
  scholarshipInfo: z.string().optional(),
});

export const TestimonialContentSchema = z.object({
  title: z.string().min(1).optional(),
  testimonials: z.array(
    z.object({
      authorName: z.string().min(1),
      role: z.enum(['Phụ huynh', 'Học sinh cũ']),
      content: z.string().min(1),
      avatarUrl: z.string().url().optional(),
      rating: z.number().int().min(1).max(5),
    })
  ),
});

export const FooterContentSchema = z.object({
  schoolName: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  socialLinks: z
    .array(
      z.object({
        platform: z.string().min(1),
        url: z.string().url(),
      })
    )
    .optional(),
  copyrightText: z.string().optional(),
});

// Map SectionType → Zod schema
export const SectionContentSchemas: Record<string, z.ZodTypeAny> = {
  HERO: HeroContentSchema,
  INTRO: IntroContentSchema,
  PROGRAM: ProgramContentSchema,
  ACHIEVEMENT: AchievementContentSchema,
  FACILITY: FacilityContentSchema,
  EXTRACURRICULAR: ExtracurricularContentSchema,
  TEACHER: TeacherContentSchema,
  ADMISSION: AdmissionContentSchema,
  TUITION: TuitionContentSchema,
  TESTIMONIAL: TestimonialContentSchema,
  FOOTER: FooterContentSchema,
};

/**
 * Validates section content against the appropriate Zod schema.
 * Falls back to z.record(z.unknown()) for unknown section types.
 *
 * @param type - SectionType string
 * @param content - Content object to validate
 * @returns Zod SafeParseReturnType
 */
export function validateSectionContent(type: string, content: unknown) {
  const schema = SectionContentSchemas[type] ?? z.record(z.unknown());
  return schema.safeParse(content);
}
