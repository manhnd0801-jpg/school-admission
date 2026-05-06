/**
 * On-demand ISR revalidation helpers
 *
 * Called after CMS saves changes to trigger immediate cache invalidation
 * instead of waiting for the time-based ISR interval.
 *
 * Requirements: 6.2
 */

import { revalidatePath } from 'next/cache';

/**
 * Revalidates the landing page.
 * Call after saving any Section changes.
 *
 * Invalidates:
 *   - '/'                    — the home page (SSG/ISR)
 *   - '/(public)' layout     — the public route group layout
 */
export function revalidateLandingPage(): void {
  revalidatePath('/');
  revalidatePath('/(public)', 'layout');
}

/**
 * Revalidates a specific article page and the article listing.
 * Call after publishing or updating an Article.
 *
 * Invalidates:
 *   - '/tin-tuc'             — the article listing page
 *   - '/tin-tuc/[slug]'      — the specific article detail page
 *
 * @param slug - The article slug to revalidate
 */
export function revalidateArticle(slug: string): void {
  revalidatePath('/tin-tuc');
  revalidatePath('/tin-tuc/' + slug);
}
