'use client';

/**
 * Admin Articles Management Page
 * Route: /admin/articles
 * Requirements: 7.1, 7.7, 7.8, 7.9
 *
 * Features:
 * - Fetch articles from GET /api/admin/articles with filter/search/pagination (20/page)
 * - Display table with columns: title, category, status badge, publishedAt, author, actions
 * - Filter controls: search input (title), category dropdown, status dropdown
 * - Pagination: prev/next buttons
 * - "Tạo bài viết" button → navigate to /admin/articles/new
 * - "Sửa" button per row → navigate to /admin/articles/[id]
 * - "Xóa" button per row → confirm dialog → DELETE /api/admin/articles/[id]
 * - Status badges: DRAFT=gray, PENDING=yellow, PUBLISHED=green, ARCHIVED=red
 * - Loading states, error handling, success/error notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArticleStatus } from '@/types';

interface ArticleAuthor {
  id: string;
  name: string;
  email: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  status: ArticleStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: ArticleAuthor;
}

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ duyệt',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Đã ẩn',
};

const STATUS_BADGE_CLASSES: Record<ArticleStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 border border-gray-200',
  PENDING: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  PUBLISHED: 'bg-green-50 text-green-700 border border-green-200',
  ARCHIVED: 'bg-red-50 text-red-700 border border-red-200',
};

const ALL_STATUSES: ArticleStatus[] = ['DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED'];

export default function ArticlesPage() {
  const router = useRouter();

  // Data state
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | ''>('');
  const [page, setPage] = useState(1);

  // Delete confirm dialog state
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (search.trim()) params.set('search', search.trim());
    if (categoryFilter.trim()) params.set('category', categoryFilter.trim());
    if (statusFilter) params.set('status', statusFilter);

    try {
      const res = await fetch(`/api/admin/articles?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể tải danh sách bài viết');
      }

      setArticles(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setError(message);
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const handleStatusChange = (value: ArticleStatus | '') => {
    setStatusFilter(value);
    setPage(1);
  };

  // Delete article
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể xóa bài viết');
      }

      showToast('success', `Đã xóa bài viết "${deleteTarget.title}"`);
      setDeleteTarget(null);

      // Refresh list — if current page is now empty, go back one page
      if (articles.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchArticles();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      showToast('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8" style={{ color: '#1D1D1F' }}>
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`px-4 py-3 rounded-lg shadow-lg text-sm ${
              toast.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <div
          className="fixed inset-0 flex items-center justify-center z-40 p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-8"
            style={{ border: '1px solid #EDEDF2' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-3" style={{ color: '#1D1D1F' }}>
              Xác nhận xóa bài viết
            </h2>
            <p className="text-sm mb-1" style={{ color: '#6E6E73' }}>
              Bạn có chắc chắn muốn xóa vĩnh viễn bài viết:
            </p>
            <p className="text-sm font-medium mb-6" style={{ color: '#1D1D1F' }}>
              &ldquo;{deleteTarget.title}&rdquo;
            </p>
            <p className="text-sm mb-6" style={{ color: '#6E6E73' }}>
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-6 py-2 text-sm font-medium rounded-full transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#EDEDF2', color: '#1D1D1F' }}
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-6 py-2 text-sm font-medium text-white rounded-full transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#FF3B30' }}
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
              Quản lý bài viết
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#6E6E73' }}>
              {total > 0 ? `${total} bài viết` : 'Chưa có bài viết nào'}
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/articles/new')}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-full transition-colors hover:opacity-90"
            style={{ backgroundColor: '#0071E3', height: '44px' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo bài viết
          </button>
        </div>

        {/* Filter controls */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ border: '1px solid #EDEDF2', backgroundColor: '#FFFFFF' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search by title */}
            <div>
              <label
                htmlFor="search-input"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#6E6E73' }}
              >
                Tìm kiếm tiêu đề
              </label>
              <input
                id="search-input"
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Nhập tiêu đề bài viết..."
                className="w-full px-3 text-sm rounded-lg transition-shadow"
                style={{
                  height: '44px',
                  border: '1px solid #D5D5D7',
                  color: '#1D1D1F',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0071E3';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D5D5D7';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Category filter */}
            <div>
              <label
                htmlFor="category-filter"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#6E6E73' }}
              >
                Danh mục
              </label>
              <input
                id="category-filter"
                type="text"
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                placeholder="Lọc theo danh mục..."
                className="w-full px-3 text-sm rounded-lg transition-shadow"
                style={{
                  height: '44px',
                  border: '1px solid #D5D5D7',
                  color: '#1D1D1F',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0071E3';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D5D5D7';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Status filter */}
            <div>
              <label
                htmlFor="status-filter"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#6E6E73' }}
              >
                Trạng thái
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value as ArticleStatus | '')}
                className="w-full px-3 text-sm rounded-lg appearance-none"
                style={{
                  height: '44px',
                  border: '1px solid #D5D5D7',
                  color: statusFilter ? '#1D1D1F' : '#6E6E73',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <option value="">Tất cả trạng thái</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Articles table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #EDEDF2' }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div
                  className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-4"
                  style={{ borderColor: '#0071E3' }}
                  aria-hidden="true"
                />
                <p className="text-sm" style={{ color: '#6E6E73' }}>
                  Đang tải...
                </p>
              </div>
            </div>
          ) : error && articles.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-sm mb-4" style={{ color: '#FF3B30' }}>
                  {error}
                </p>
                <button
                  onClick={fetchArticles}
                  className="px-4 py-2 text-sm font-medium text-white rounded-full"
                  style={{ backgroundColor: '#0071E3' }}
                >
                  Thử lại
                </button>
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: '#D5D5D7' }}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm font-medium mb-1" style={{ color: '#1D1D1F' }}>
                  Không có bài viết nào
                </p>
                <p className="text-sm" style={{ color: '#6E6E73' }}>
                  {search || categoryFilter || statusFilter
                    ? 'Thử thay đổi bộ lọc để tìm kiếm'
                    : 'Nhấn "Tạo bài viết" để bắt đầu'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #EDEDF2', backgroundColor: '#FAFAFA' }}>
                      <th
                        className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: '#6E6E73' }}
                      >
                        Tiêu đề
                      </th>
                      <th
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: '#6E6E73' }}
                      >
                        Danh mục
                      </th>
                      <th
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: '#6E6E73' }}
                      >
                        Trạng thái
                      </th>
                      <th
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: '#6E6E73' }}
                      >
                        Ngày xuất bản
                      </th>
                      <th
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: '#6E6E73' }}
                      >
                        Tác giả
                      </th>
                      <th
                        className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: '#6E6E73' }}
                      >
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((article, index) => (
                      <tr
                        key={article.id}
                        style={{
                          borderBottom:
                            index < articles.length - 1 ? '1px solid #EDEDF2' : 'none',
                        }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Title */}
                        <td className="px-6 py-4">
                          <div>
                            <p
                              className="font-medium line-clamp-2 max-w-xs"
                              style={{ color: '#1D1D1F' }}
                            >
                              {article.title}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: '#6E6E73' }}>
                              /{article.slug}
                            </p>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-4">
                          <span className="text-sm" style={{ color: '#333336' }}>
                            {article.category}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE_CLASSES[article.status]}`}
                          >
                            {STATUS_LABELS[article.status]}
                          </span>
                        </td>

                        {/* Published at */}
                        <td className="px-4 py-4">
                          <span className="text-sm" style={{ color: '#6E6E73' }}>
                            {formatDate(article.publishedAt)}
                          </span>
                        </td>

                        {/* Author */}
                        <td className="px-4 py-4">
                          <span className="text-sm" style={{ color: '#333336' }}>
                            {article.author.name}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/admin/articles/${article.id}`)}
                              className="px-4 py-1.5 text-xs font-medium rounded-full transition-colors"
                              style={{
                                border: '1px solid #0071E3',
                                color: '#0071E3',
                                backgroundColor: 'transparent',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(0,113,227,0.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              aria-label={`Sửa bài viết "${article.title}"`}
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => setDeleteTarget(article)}
                              className="px-4 py-1.5 text-xs font-medium rounded-full transition-colors"
                              style={{
                                border: '1px solid #FF3B30',
                                color: '#FF3B30',
                                backgroundColor: 'transparent',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255,59,48,0.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              aria-label={`Xóa bài viết "${article.title}"`}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y" style={{ borderColor: '#EDEDF2' }}>
                {articles.map((article) => (
                  <div key={article.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium text-sm line-clamp-2"
                          style={{ color: '#1D1D1F' }}
                        >
                          {article.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#6E6E73' }}>
                          {article.category}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE_CLASSES[article.status]}`}
                      >
                        {STATUS_LABELS[article.status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-xs" style={{ color: '#6E6E73' }}>
                        <span>{article.author.name}</span>
                        <span className="mx-1">·</span>
                        <span>{formatDate(article.publishedAt ?? article.createdAt)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/admin/articles/${article.id}`)}
                          className="px-3 py-1 text-xs font-medium rounded-full"
                          style={{
                            border: '1px solid #0071E3',
                            color: '#0071E3',
                            backgroundColor: 'transparent',
                          }}
                          aria-label={`Sửa bài viết "${article.title}"`}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setDeleteTarget(article)}
                          className="px-3 py-1 text-xs font-medium rounded-full"
                          style={{
                            border: '1px solid #FF3B30',
                            color: '#FF3B30',
                            backgroundColor: 'transparent',
                          }}
                          aria-label={`Xóa bài viết "${article.title}"`}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm" style={{ color: '#6E6E73' }}>
              Trang {page} / {totalPages} &nbsp;·&nbsp; {total} bài viết
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  border: '1px solid #D5D5D7',
                  color: '#1D1D1F',
                  backgroundColor: '#FFFFFF',
                }}
                aria-label="Trang trước"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  border: '1px solid #D5D5D7',
                  color: '#1D1D1F',
                  backgroundColor: '#FFFFFF',
                }}
                aria-label="Trang sau"
              >
                Sau
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
