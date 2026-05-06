/**
 * Next.js App Router robots.txt
 *
 * Allows all crawlers on public routes.
 * Disallows crawling of admin and API routes.
 *
 * Requirements: 4.5
 */

import { MetadataRoute } from 'next';

const BASE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
