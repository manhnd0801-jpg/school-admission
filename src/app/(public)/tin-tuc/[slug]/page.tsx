/**
 * Trang Chi Tiết Bài Viết — /tin-tuc/[slug] (SSG/ISR)
 *
 * Pre-generates all published article pages via generateStaticParams.
 * Returns 404 if slug not found or article not published.
 * Includes per-article Open Graph metadata (title, description, image).
 *
 * Requirements: 8.4, 8.5, 8.6, 4.1
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// ISR: revalidate every 60 seconds
export const revalidate = 60;

// ============================================================
// Types
// ============================================================

interface ArticleAuthor {
  id: string;
  name: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  publishedAt: string | null;
  author: ArticleAuthor;
}

interface ArticleDetailApiResponse {
  success: true;
  data: Article;
}

interface ArticlesListApiResponse {
  success: true;
  data: {
    items: Pick<Article, 'slug'>[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// ============================================================
// Helpers
// ============================================================

function getBaseUrl(): string {
  return (
    process.env['NEXT_PUBLIC_APP_URL'] ??
    (process.env['VERCEL_URL'] ? `https://${process.env['VERCEL_URL']}` : 'http://localhost:3000')
  );
}

/**
 * Format a date string in Vietnamese locale.
 * Example: "15 tháng 3, 2024"
 */
function formatDateVi(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ============================================================
// Data fetching
// ============================================================

async function fetchArticle(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/articles/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;

    const json = (await res.json()) as ArticleDetailApiResponse;
    if (!json.success) return null;
    return json.data;
  } catch (err) {
    console.error(`[ArticleDetailPage] Failed to fetch article "${slug}":`, err);
    return null;
  }
}

async function fetchAllPublishedSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  const pageSize = 100;

  try {
    while (true) {
      const res = await fetch(
        `${getBaseUrl()}/api/articles?page=${page}&pageSize=${pageSize}`,
        { next: { revalidate: 60 } }
      );

      if (!res.ok) break;

      const json = (await res.json()) as ArticlesListApiResponse;
      if (!json.success) break;

      const { items, totalPages } = json.data;
      slugs.push(...items.map((a) => a.slug));

      if (page >= totalPages) break;
      page++;
    }
  } catch (err) {
    console.error('[ArticleDetailPage] Failed to fetch slugs for generateStaticParams:', err);
  }

  return slugs;
}

// ============================================================
// generateStaticParams — pre-generate all published article pages
// ============================================================

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await fetchAllPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

// ============================================================
// generateMetadata — per-article Open Graph tags
// ============================================================

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);

  if (!article) {
    return {
      title: 'Bài viết không tồn tại',
    };
  }

  const description = article.excerpt ?? article.title;
  const images = article.coverImage ? [{ url: article.coverImage }] : [];

  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      images,
      type: 'article',
      publishedTime: article.publishedAt ?? undefined,
      authors: [article.author.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: article.coverImage ? [article.coverImage] : [],
    },
  };
}

// ============================================================
// Page component
// ============================================================

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await fetchArticle(slug);

  // 404 if not found or not published
  if (!article) {
    notFound();
  }

  const formattedDate = formatDateVi(article.publishedAt);

  return (
    <>
      <div
        style={{
          maxWidth: '1262px',
          margin: '0 auto',
          padding: '40px 24px 80px',
        }}
      >
        {/* Back link */}
        <Link
          href="/tin-tuc"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '15px',
            fontWeight: 400,
            color: '#0071E3',
            textDecoration: 'none',
            marginBottom: '32px',
          }}
          aria-label="Quay lại danh sách tin tức"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M10 3L5 8L10 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Quay lại tin tức
        </Link>

        {/* Article container — centered, max readable width */}
        <article
          style={{
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          {/* Category badge */}
          <div style={{ marginBottom: '16px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '50px',
                background: 'rgba(0,113,227,0.08)',
                color: '#0071E3',
                fontSize: '13px',
                fontWeight: 600,
                lineHeight: '20px',
              }}
            >
              {article.category}
            </span>
          </div>

          {/* H1 title */}
          <h1
            style={{
              margin: '0 0 16px',
              fontSize: '34px',
              fontWeight: 700,
              lineHeight: '1.25',
              color: '#1D1D1F',
              letterSpacing: '-0.5px',
            }}
          >
            {article.title}
          </h1>

          {/* Meta: date + author */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '32px',
            }}
          >
            {formattedDate && (
              <time
                dateTime={article.publishedAt ?? undefined}
                style={{
                  fontSize: '14px',
                  color: '#6E6E73',
                }}
              >
                {formattedDate}
              </time>
            )}
            <span
              style={{
                fontSize: '14px',
                color: '#6E6E73',
              }}
            >
              {article.author.name}
            </span>
          </div>

          {/* Cover image */}
          {article.coverImage && (
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '40px',
                background: '#EDEDF2',
              }}
            >
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                sizes="(max-width: 767px) 100vw, 800px"
                style={{ objectFit: 'cover' }}
                priority
              />
            </div>
          )}

          {/* Article content — HTML from TipTap */}
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>

        {/* Bottom back link */}
        <div
          style={{
            maxWidth: '800px',
            margin: '48px auto 0',
            paddingTop: '32px',
            borderTop: '1px solid #EDEDF2',
          }}
        >
          <Link
            href="/tin-tuc"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '15px',
              fontWeight: 400,
              color: '#0071E3',
              textDecoration: 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M10 3L5 8L10 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Quay lại tin tức
          </Link>
        </div>
      </div>

      {/* Article content typography styles */}
      <style>{`
        .article-content {
          font-size: 17px;
          line-height: 1.7;
          color: #1D1D1F;
        }
        .article-content h1,
        .article-content h2,
        .article-content h3,
        .article-content h4,
        .article-content h5,
        .article-content h6 {
          margin: 1.5em 0 0.5em;
          font-weight: 600;
          line-height: 1.3;
          color: #1D1D1F;
        }
        .article-content h2 { font-size: 26px; }
        .article-content h3 { font-size: 22px; }
        .article-content h4 { font-size: 19px; }
        .article-content p {
          margin: 0 0 1.2em;
        }
        .article-content ul,
        .article-content ol {
          margin: 0 0 1.2em;
          padding-left: 1.5em;
        }
        .article-content li {
          margin-bottom: 0.4em;
        }
        .article-content a {
          color: #0071E3;
          text-decoration: underline;
        }
        .article-content a:hover {
          text-decoration: none;
        }
        .article-content blockquote {
          margin: 1.5em 0;
          padding: 16px 20px;
          border-left: 4px solid #0071E3;
          background: rgba(0, 113, 227, 0.04);
          border-radius: 0 8px 8px 0;
          color: #6E6E73;
          font-style: italic;
        }
        .article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1em 0;
        }
        .article-content pre {
          background: #EDEDF2;
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
          font-size: 14px;
          margin: 1.2em 0;
        }
        .article-content code {
          background: #EDEDF2;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 14px;
        }
        .article-content pre code {
          background: none;
          padding: 0;
        }
        .article-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.2em 0;
          font-size: 15px;
        }
        .article-content th,
        .article-content td {
          border: 1px solid #EDEDF2;
          padding: 10px 14px;
          text-align: left;
        }
        .article-content th {
          background: #EDEDF2;
          font-weight: 600;
        }
        .article-content hr {
          border: none;
          border-top: 1px solid #EDEDF2;
          margin: 2em 0;
        }
        @media (max-width: 767px) {
          .article-content {
            font-size: 16px;
          }
          .article-content h2 { font-size: 22px; }
          .article-content h3 { font-size: 19px; }
        }
      `}</style>
    </>
  );
}
