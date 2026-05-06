/**
 * Slug generation utility for Vietnamese article titles
 *
 * Handles Vietnamese diacritics, đ→d conversion, and URL-safe output.
 *
 * Requirements: 7.10
 */

/**
 * Generates a URL-safe slug from a Vietnamese title.
 *
 * Steps:
 * 1. Lowercase
 * 2. Replace đ/Đ with d (before NFD normalization strips the base character)
 * 3. Normalize NFD (decompose diacritics)
 * 4. Strip combining diacritical marks (U+0300–U+036F)
 * 5. Remove non-alphanumeric characters (except spaces and hyphens)
 * 6. Replace whitespace with hyphens
 * 7. Collapse multiple hyphens
 * 8. Trim leading/trailing hyphens
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '') // keep only alphanumeric, spaces, hyphens
    .replace(/\s+/g, '-') // spaces → hyphens
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

/**
 * Generates a unique slug by appending a numeric suffix if the base slug
 * already exists in the provided list.
 *
 * Examples:
 *   generateUniqueSlug('Tin tức', [])                    → 'tin-tuc'
 *   generateUniqueSlug('Tin tức', ['tin-tuc'])            → 'tin-tuc-2'
 *   generateUniqueSlug('Tin tức', ['tin-tuc', 'tin-tuc-2']) → 'tin-tuc-3'
 *
 * Requirements: 7.10
 */
export function generateUniqueSlug(title: string, existingSlugs: string[]): string {
  const base = generateSlug(title);

  if (!existingSlugs.includes(base)) {
    return base;
  }

  let counter = 2;
  while (existingSlugs.includes(`${base}-${counter}`)) {
    counter++;
  }

  return `${base}-${counter}`;
}
