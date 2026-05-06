/**
 * Next.js App Router sitemap
 *
 * Generates XML sitemap including:
 *   - Home page
 *   - Articles list page
 *   - Individual published article pages
 *   - Privacy policy page
 *
 * Requirements: 4.5
 */

import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all published articles
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
    },
    select: {
      slug: true,
      publishedAt: true,
    },
    orderBy: {
      publishedAt: 'desc',
    },
  });

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/tin-tuc/${article.slug}`,
    lastModified: article.publishedAt ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/tin-tuc`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...articleEntries,
    {
      url: `${BASE_URL}/chinh-sach-bao-mat`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
