/**
 * Trang Danh Sách Bài Viết — /tin-tuc (SSG/ISR)
 *
 * Fetch bài viết đã xuất bản từ /api/articles, hiển thị dạng card grid.
 * Mỗi card gồm: ảnh đại diện, tiêu đề, danh mục, ngày xuất bản, đoạn trích.
 * Phân trang 12 bài/trang qua query param ?page=N.
 *
 * Requirements: 8.1, 8.2, 8.3
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

// ISR: revalidate every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Tin Tức & Thông Báo',
  description:
    'Cập nhật tin tức mới nhất, thông báo tuyển sinh và các hoạt động của Trường THPT Nguyễn Trãi.',
};

// ============================================================
// Types
// ============================================================

interface ArticleAuthor {
  name: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  publishedAt: string | null;
  author: ArticleAuthor;
}

interface ArticlesApiResponse {
  success: true;
  data: {
    items: Article[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// ============================================================
// Data fetching
// ============================================================

async function fetchArticles(page: number): Promise<ArticlesApiResponse['data'] | null> {
  try {
    const baseUrl =
      process.env['NEXT_PUBLIC_APP_URL'] ??
      (process.env['VERCEL_URL'] ? `https://${process.env['VERCEL_URL']}` : 'http://localhost:3000');

    const res = await fetch(`${baseUrl}/api/articles?page=${page}&pageSize=12`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error(`[TinTucPage] /api/articles responded with ${res.status}`);
      return null;
    }

    const json = (await res.json()) as ArticlesApiResponse;
    if (!json.success) return null;
    return json.data;
  } catch (err) {
    console.error('[TinTucPage] Failed to fetch articles:', err);
    return null;
  }
}

// ============================================================
// Helpers
// ============================================================

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
// Sub-components
// ============================================================

function ArticleCard({ article }: { article: Article }) {
  const formattedDate = formatDateVi(article.publishedAt);

  return (
    <Link
      href={`/tin-tuc/${article.slug}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      aria-label={`Đọc bài viết: ${article.title}`}
    >
      <article
        style={{
          border: '1px solid #EDEDF2',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#FFFFFF',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        }}
        className="article-card"
      >
        {/* Cover image */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            background: '#EDEDF2',
            flexShrink: 0,
          }}
        >
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
              loading="lazy"
            />
          ) : (
            /* Placeholder when no cover image */
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#EDEDF2',
              }}
              aria-hidden="true"
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden="true"
              >
                <rect width="48" height="48" rx="8" fill="#D5D5D7" />
                <path
                  d="M14 34L22 22L28 30L32 25L38 34H14Z"
                  fill="#6E6E73"
                />
                <circle cx="18" cy="18" r="4" fill="#6E6E73" />
              </svg>
            </div>
          )}
        </div>

        {/* Card body */}
        <div
          style={{
            padding: '20px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: 1,
          }}
        >
          {/* Category + date row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: '50px',
                background: 'rgba(0,113,227,0.08)',
                color: '#0071E3',
                fontSize: '12px',
                fontWeight: 600,
                lineHeight: '20px',
                whiteSpace: 'nowrap',
              }}
            >
              {article.category}
            </span>
            {formattedDate && (
              <time
                dateTime={article.publishedAt ?? undefined}
                style={{
                  fontSize: '12px',
                  lineHeight: '16px',
                  color: '#6E6E73',
                }}
              >
                {formattedDate}
              </time>
            )}
          </div>

          {/* Title */}
          <h2
            style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: 600,
              lineHeight: '24px',
              color: '#1D1D1F',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {article.title}
          </h2>

          {/* Excerpt */}
          {article.excerpt && (
            <p
              style={{
                margin: 0,
                fontSize: '15px',
                lineHeight: '22px',
                color: '#6E6E73',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                flex: 1,
              }}
            >
              {article.excerpt}
            </p>
          )}

          {/* Read more link */}
          <span
            style={{
              marginTop: '4px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#0071E3',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            aria-hidden="true"
          >
            Đọc thêm
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M3 7H11M8 4L11 7L8 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </article>
    </Link>
  );
}

function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
    height: '40px',
    padding: '0 8px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 400,
    textDecoration: 'none',
    transition: 'background 0.15s ease, color 0.15s ease',
    border: '1px solid transparent',
  };

  return (
    <nav
      aria-label="Phân trang bài viết"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        marginTop: '48px',
        flexWrap: 'wrap',
      }}
    >
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={`/tin-tuc?page=${currentPage - 1}`}
          aria-label="Trang trước"
          style={{
            ...btnBase,
            color: '#0071E3',
            border: '1px solid #EDEDF2',
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
        </Link>
      ) : (
        <span
          aria-disabled="true"
          style={{
            ...btnBase,
            color: '#D5D5D7',
            cursor: 'not-allowed',
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
        </span>
      )}

      {/* Page numbers */}
      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span
            key={`ellipsis-${idx}`}
            style={{ ...btnBase, color: '#6E6E73', cursor: 'default' }}
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={`/tin-tuc?page=${p}`}
            aria-label={`Trang ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
            style={{
              ...btnBase,
              background: p === currentPage ? '#0071E3' : 'transparent',
              color: p === currentPage ? '#FFFFFF' : '#1D1D1F',
              border: p === currentPage ? '1px solid #0071E3' : '1px solid #EDEDF2',
              fontWeight: p === currentPage ? 600 : 400,
            }}
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={`/tin-tuc?page=${currentPage + 1}`}
          aria-label="Trang tiếp theo"
          style={{
            ...btnBase,
            color: '#0071E3',
            border: '1px solid #EDEDF2',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M6 3L11 8L6 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      ) : (
        <span
          aria-disabled="true"
          style={{
            ...btnBase,
            color: '#D5D5D7',
            cursor: 'not-allowed',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M6 3L11 8L6 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </nav>
  );
}

// ============================================================
// Page component
// ============================================================

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function TinTucPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1);

  const data = await fetchArticles(currentPage);

  const articles = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  return (
    <>
      {/* Page container */}
      <div
        style={{
          maxWidth: '1262px',
          margin: '0 auto',
          padding: '56px 24px 80px',
        }}
      >
        {/* Page header */}
        <header style={{ marginBottom: '48px' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '34px',
              fontWeight: 600,
              lineHeight: '50px',
              color: '#1D1D1F',
            }}
          >
            Tin Tức &amp; Thông Báo
          </h1>
          {total > 0 && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: '17px',
                lineHeight: '25px',
                color: '#6E6E73',
              }}
            >
              {total} bài viết
            </p>
          )}
        </header>

        {/* Article grid or empty state */}
        {articles.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              color: '#6E6E73',
            }}
            role="status"
            aria-live="polite"
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              aria-hidden="true"
              style={{ margin: '0 auto 16px', display: 'block' }}
            >
              <rect width="64" height="64" rx="12" fill="#EDEDF2" />
              <path
                d="M20 20H44V44H20V20Z"
                stroke="#6E6E73"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M26 28H38M26 34H34"
                stroke="#6E6E73"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <p
              style={{
                margin: 0,
                fontSize: '17px',
                lineHeight: '25px',
                fontWeight: 400,
              }}
            >
              Không có bài viết nào
            </p>
          </div>
        ) : (
          <>
            <div
              className="article-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
              }}
            >
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </>
        )}
      </div>

      {/* Responsive styles */}
      <style>{`
        .article-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        .article-card:hover {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }
        @media (max-width: 1023px) {
          .article-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 767px) {
          .article-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
