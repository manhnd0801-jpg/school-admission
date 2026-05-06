'use client';

/**
 * Admin Article Editor Page
 * Route: /admin/articles/[id]
 * Requirements: 7.2, 7.3, 7.4, 7.6, 7.10
 *
 * Features:
 * - TipTap rich text editor for article content
 * - Form fields: title, slug (editable, auto-generated), category, cover image, excerpt, status, scheduledAt
 * - If id === 'new': create mode (POST /api/admin/articles)
 * - If id !== 'new': edit mode (GET /api/admin/articles/[id], then PUT /api/admin/articles/[id])
 * - Auto-generate slug from title (debounced)
 * - Upload cover image via POST /api/admin/upload
 * - Success: redirect to /admin/articles
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { ArticleStatus } from '@/types';
import { generateSlug } from '@/lib/slug';

interface ArticleData {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  coverImage: string;
  excerpt: string | null;
  status: ArticleStatus;
  scheduledAt: string | null;
}

const STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ duyệt',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Đã ẩn',
};

const ALL_STATUSES: ArticleStatus[] = ['DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED'];

export default function ArticleEditorPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;
  const isCreateMode = articleId === 'new';

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState<ArticleStatus>('DRAFT');
  const [scheduledAt, setScheduledAt] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(!isCreateMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      Placeholder.configure({
        placeholder: 'Nhập nội dung bài viết...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
  });

  // Track whether article data has been loaded into the editor
  const contentLoadedRef = useRef(false);
  // Store content fetched before editor was ready
  const pendingContentRef = useRef<string | null>(null);

  // Fetch article data in edit mode
  useEffect(() => {
    if (isCreateMode) return;

    const fetchArticle = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/admin/articles/${articleId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Không thể tải bài viết');
        }

        const article: ArticleData = data.data;
        setTitle(article.title);
        setSlug(article.slug);
        setCategory(article.category);
        setCoverImage(article.coverImage);
        setExcerpt(article.excerpt ?? '');
        setStatus(article.status);

        // Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:mm)
        if (article.scheduledAt) {
          const dt = new Date(article.scheduledAt);
          const pad = (n: number) => String(n).padStart(2, '0');
          const localDatetime = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
          setScheduledAt(localDatetime);
        } else {
          setScheduledAt('');
        }

        // Store content for editor — will be applied once editor is ready
        if (editor && !contentLoadedRef.current) {
          editor.commands.setContent(article.content);
          contentLoadedRef.current = true;
        } else if (!editor) {
          // Editor not ready yet — store content to apply when editor initializes
          pendingContentRef.current = article.content;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, isCreateMode]);

  // Auto-generate slug from title (debounced)
  useEffect(() => {
    if (!isCreateMode) return; // Only auto-generate in create mode

    const timeoutId = setTimeout(() => {
      if (title.trim()) {
        setSlug(generateSlug(title));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [title, isCreateMode]);

  // Apply pending content once editor is ready (handles race condition in edit mode)
  useEffect(() => {
    if (!editor || contentLoadedRef.current) return;
    if (pendingContentRef.current !== null) {
      editor.commands.setContent(pendingContentRef.current);
      pendingContentRef.current = null;
      contentLoadedRef.current = true;
    }
  }, [editor]);

  // Handle cover image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFieldErrors((prev) => ({ ...prev, coverImage: '' }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể tải ảnh lên');
      }

      setCoverImage(data.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setFieldErrors((prev) => ({ ...prev, coverImage: message }));
    } finally {
      setIsUploading(false);
    }
  };

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Tiêu đề không được để trống';
    }

    if (!slug.trim()) {
      errors.slug = 'Slug không được để trống';
    }

    if (!category.trim()) {
      errors.category = 'Danh mục không được để trống';
    }

    if (!coverImage.trim()) {
      errors.coverImage = 'Ảnh đại diện không được để trống';
    }

    const content = editor?.getHTML() ?? '';
    if (!content || content === '<p></p>') {
      errors.content = 'Nội dung không được để trống';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [title, slug, category, coverImage, editor]);

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setIsSaving(true);
    setError(null);

    const content = editor?.getHTML() ?? '';

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      content,
      category: category.trim(),
      coverImage: coverImage.trim(),
      excerpt: excerpt.trim() || undefined,
      status,
      scheduledAt: scheduledAt || null,
    };

    try {
      const url = isCreateMode
        ? '/api/admin/articles'
        : `/api/admin/articles/${articleId}`;
      const method = isCreateMode ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể lưu bài viết');
      }

      // Success: redirect to articles list
      router.push('/admin/articles');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // TipTap toolbar actions
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const setHeading = (level: 1 | 2 | 3) => editor?.chain().focus().toggleHeading({ level }).run();

  const addLink = () => {
    const url = window.prompt('Nhập URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Nhập URL ảnh:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
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
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8" style={{ color: '#1D1D1F' }}>
      <div className="max-w-4xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
            {isCreateMode ? 'Tạo bài viết mới' : 'Chỉnh sửa bài viết'}
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#6E6E73' }}>
            {isCreateMode
              ? 'Điền thông tin bài viết và nhấn Lưu để tạo bài viết mới'
              : 'Chỉnh sửa thông tin bài viết và nhấn Lưu để cập nhật'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg p-4 border"
            style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', color: '#991B1B' }}
          >
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-semibold mb-1.5"
              style={{ color: '#1D1D1F' }}
            >
              Tiêu đề <span style={{ color: '#FF3B30' }}>*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 text-sm rounded-lg transition-shadow"
              style={{
                height: '44px',
                border: `1px solid ${fieldErrors.title ? '#FF3B30' : '#D5D5D7'}`,
                color: '#1D1D1F',
                outline: 'none',
              }}
              onFocus={(e) => {
                if (!fieldErrors.title) {
                  e.target.style.borderColor = '#0071E3';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.1)';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = fieldErrors.title ? '#FF3B30' : '#D5D5D7';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Nhập tiêu đề bài viết"
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs" style={{ color: '#FF3B30' }}>
                {fieldErrors.title}
              </p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-semibold mb-1.5"
              style={{ color: '#1D1D1F' }}
            >
              Slug <span style={{ color: '#FF3B30' }}>*</span>
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 text-sm rounded-lg transition-shadow"
              style={{
                height: '44px',
                border: `1px solid ${fieldErrors.slug ? '#FF3B30' : '#D5D5D7'}`,
                color: '#1D1D1F',
                outline: 'none',
              }}
              onFocus={(e) => {
                if (!fieldErrors.slug) {
                  e.target.style.borderColor = '#0071E3';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.1)';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = fieldErrors.slug ? '#FF3B30' : '#D5D5D7';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="slug-bai-viet"
            />
            {fieldErrors.slug && (
              <p className="mt-1 text-xs" style={{ color: '#FF3B30' }}>
                {fieldErrors.slug}
              </p>
            )}
            <p className="mt-1 text-xs" style={{ color: '#6E6E73' }}>
              URL: /tin-tuc/{slug || 'slug-bai-viet'}
            </p>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-semibold mb-1.5"
              style={{ color: '#1D1D1F' }}
            >
              Danh mục <span style={{ color: '#FF3B30' }}>*</span>
            </label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 text-sm rounded-lg transition-shadow"
              style={{
                height: '44px',
                border: `1px solid ${fieldErrors.category ? '#FF3B30' : '#D5D5D7'}`,
                color: '#1D1D1F',
                outline: 'none',
              }}
              onFocus={(e) => {
                if (!fieldErrors.category) {
                  e.target.style.borderColor = '#0071E3';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.1)';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = fieldErrors.category ? '#FF3B30' : '#D5D5D7';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Tin tức, Thông báo, Sự kiện..."
            />
            {fieldErrors.category && (
              <p className="mt-1 text-xs" style={{ color: '#FF3B30' }}>
                {fieldErrors.category}
              </p>
            )}
          </div>

          {/* Cover Image */}
          <div>
            <label
              htmlFor="coverImage"
              className="block text-sm font-semibold mb-1.5"
              style={{ color: '#1D1D1F' }}
            >
              Ảnh đại diện <span style={{ color: '#FF3B30' }}>*</span>
            </label>
            <div className="flex gap-3 items-start">
              <input
                id="coverImage"
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="flex-1 px-3 text-sm rounded-lg transition-shadow"
                style={{
                  height: '44px',
                  border: `1px solid ${fieldErrors.coverImage ? '#FF3B30' : '#D5D5D7'}`,
                  color: '#1D1D1F',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  if (!fieldErrors.coverImage) {
                    e.target.style.borderColor = '#0071E3';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.1)';
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = fieldErrors.coverImage ? '#FF3B30' : '#D5D5D7';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="https://example.com/image.jpg"
              />
              <label
                htmlFor="coverImageFile"
                className="inline-flex items-center gap-2 px-4 text-sm font-medium rounded-full transition-colors cursor-pointer"
                style={{
                  height: '44px',
                  border: '1px solid #0071E3',
                  color: '#0071E3',
                  backgroundColor: 'transparent',
                  lineHeight: '42px',
                }}
              >
                {isUploading ? 'Đang tải...' : 'Tải lên'}
              </label>
              <input
                id="coverImageFile"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="hidden"
              />
            </div>
            {fieldErrors.coverImage && (
              <p className="mt-1 text-xs" style={{ color: '#FF3B30' }}>
                {fieldErrors.coverImage}
              </p>
            )}
            {coverImage && (
              <div className="mt-3">
                <img
                  src={coverImage}
                  alt="Preview"
                  className="max-w-xs rounded-lg border"
                  style={{ borderColor: '#EDEDF2' }}
                />
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label
              htmlFor="excerpt"
              className="block text-sm font-semibold mb-1.5"
              style={{ color: '#1D1D1F' }}
            >
              Đoạn trích (tùy chọn)
            </label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg transition-shadow resize-none"
              style={{
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
              placeholder="Mô tả ngắn gọn về bài viết..."
            />
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1D1D1F' }}>
              Nội dung <span style={{ color: '#FF3B30' }}>*</span>
            </label>

            {/* TipTap Toolbar */}
            <div
              className="flex flex-wrap gap-1 p-2 rounded-t-lg border-t border-x"
              style={{ borderColor: fieldErrors.content ? '#FF3B30' : '#D5D5D7', backgroundColor: '#FAFAFA' }}
            >
              <button
                type="button"
                onClick={toggleBold}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  editor?.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'
                }`}
                title="Đậm (Ctrl+B)"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={toggleItalic}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  editor?.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'
                }`}
                title="Nghiêng (Ctrl+I)"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onClick={toggleStrike}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  editor?.isActive('strike') ? 'bg-gray-200' : 'hover:bg-gray-100'
                }`}
                title="Gạch ngang"
              >
                <s>S</s>
              </button>
              <button
                type="button"
                onClick={() => setHeading(1)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  editor?.isActive('heading', { level: 1 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
                }`}
                title="Heading 1"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => setHeading(2)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
                }`}
                title="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => setHeading(3)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  editor?.isActive('heading', { level: 3 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
                }`}
                title="Heading 3"
              >
                H3
              </button>
              <button
                type="button"
                onClick={toggleBulletList}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  editor?.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'
                }`}
                title="Danh sách không thứ tự"
              >
                •
              </button>
              <button
                type="button"
                onClick={toggleOrderedList}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  editor?.isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'
                }`}
                title="Danh sách có thứ tự"
              >
                1.
              </button>
              <button
                type="button"
                onClick={addLink}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  editor?.isActive('link') ? 'bg-gray-200' : 'hover:bg-gray-100'
                }`}
                title="Chèn liên kết"
              >
                🔗
              </button>
              <button
                type="button"
                onClick={addImage}
                className="px-3 py-1.5 text-sm rounded transition-colors hover:bg-gray-100"
                title="Chèn ảnh"
              >
                🖼️
              </button>
            </div>

            {/* TipTap Editor */}
            <div
              className="border-x border-b rounded-b-lg"
              style={{ borderColor: fieldErrors.content ? '#FF3B30' : '#D5D5D7' }}
            >
              <EditorContent editor={editor} />
            </div>
            {fieldErrors.content && (
              <p className="mt-1 text-xs" style={{ color: '#FF3B30' }}>
                {fieldErrors.content}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-semibold mb-1.5"
              style={{ color: '#1D1D1F' }}
            >
              Trạng thái
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ArticleStatus)}
              className="w-full px-3 text-sm rounded-lg appearance-none"
              style={{
                height: '44px',
                border: '1px solid #D5D5D7',
                color: '#1D1D1F',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Scheduled Publish */}
          <div>
            <label
              htmlFor="scheduledAt"
              className="block text-sm font-semibold mb-1.5"
              style={{ color: '#1D1D1F' }}
            >
              Lên lịch xuất bản (tùy chọn)
            </label>
            <input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
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
            <p className="mt-1 text-xs" style={{ color: '#6E6E73' }}>
              Để trống nếu muốn xuất bản ngay khi chuyển trạng thái sang "Đã xuất bản"
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-medium text-white rounded-full transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#0071E3', height: '44px' }}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu bài viết'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/articles')}
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-medium rounded-full transition-colors disabled:opacity-50"
              style={{
                backgroundColor: '#EDEDF2',
                color: '#1D1D1F',
                height: '44px',
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
