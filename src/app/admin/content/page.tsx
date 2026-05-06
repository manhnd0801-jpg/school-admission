'use client';

/**
 * Admin Content Management Page
 * Route: /admin/content
 * Requirements: 6.1, 6.8
 *
 * Features:
 * - Fetch sections from GET /api/admin/sections on load
 * - Display list of all 11 sections with type, title, visibility status
 * - Toggle visibility via PUT /api/admin/sections/[id] with { isVisible: boolean }
 * - Inline JSON editor for section content (textarea with JSON, save button)
 * - Preview panel: show simplified preview of section content as JSON
 * - Edit history button that opens modal with history from GET /api/admin/sections/[id]/history
 * - Restore button in history modal that calls POST /api/admin/sections/[id]/restore
 * - Loading states, error handling, success/error toast notifications
 */

import { useState, useEffect } from 'react';
import { SectionType } from '@/types';

interface Section {
  id: string;
  type: SectionType;
  title: string;
  content: Record<string, unknown>;
  isVisible: boolean;
  order: number;
  updatedAt: string;
}

interface HistoryRecord {
  id: string;
  sectionId: string;
  contentBefore: Record<string, unknown>;
  contentAfter: Record<string, unknown>;
  createdAt: string;
  editor: {
    id: string;
    name: string;
    email: string;
  };
}

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

export default function ContentPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  // Toast management
  const showToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Fetch sections on mount
  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/sections');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể tải danh sách sections');
      }

      setSections(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setError(message);
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle visibility
  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/sections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !currentVisibility }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể cập nhật trạng thái hiển thị');
      }

      // Update local state
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isVisible: !currentVisibility } : s))
      );

      showToast('success', 'Đã cập nhật trạng thái hiển thị');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      showToast('error', message);
    } finally {
      setTogglingId(null);
    }
  };

  // Start editing
  const handleStartEdit = (section: Section) => {
    setEditingId(section.id);
    setEditContent(JSON.stringify(section.content, null, 2));
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  // Save content
  const handleSaveContent = async (id: string) => {
    setIsSaving(true);
    try {
      // Parse JSON
      let parsedContent: Record<string, unknown>;
      try {
        parsedContent = JSON.parse(editContent);
      } catch {
        throw new Error('JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.');
      }

      const res = await fetch(`/api/admin/sections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: parsedContent }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể lưu nội dung');
      }

      // Update local state
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, content: parsedContent, updatedAt: data.data.updatedAt } : s))
      );

      setEditingId(null);
      setEditContent('');
      showToast('success', 'Đã lưu nội dung thành công');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      showToast('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  // Open history modal
  const handleOpenHistory = async (sectionId: string) => {
    setCurrentSectionId(sectionId);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    setHistoryData([]);

    try {
      const res = await fetch(`/api/admin/sections/${sectionId}/history`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể tải lịch sử chỉnh sửa');
      }

      setHistoryData(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      showToast('error', message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Close history modal
  const handleCloseHistory = () => {
    setHistoryModalOpen(false);
    setCurrentSectionId(null);
    setHistoryData([]);
  };

  // Restore from history
  const handleRestore = async (historyId: string) => {
    if (!currentSectionId) return;

    setRestoring(historyId);
    try {
      const res = await fetch(`/api/admin/sections/${currentSectionId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể khôi phục phiên bản');
      }

      // Update local state
      setSections((prev) =>
        prev.map((s) =>
          s.id === currentSectionId
            ? { ...s, content: data.data.content, updatedAt: data.data.updatedAt }
            : s
        )
      );

      showToast('success', 'Đã khôi phục phiên bản thành công');
      handleCloseHistory();
      fetchSections(); // Refresh to get latest data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      showToast('error', message);
    } finally {
      setRestoring(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error && sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchSections}
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            style={{ backgroundColor: '#0071E3' }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
            role="alert"
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* History modal */}
      {historyModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
          onClick={handleCloseHistory}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Lịch sử chỉnh sửa</h2>
              <button
                onClick={handleCloseHistory}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Đóng"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 mt-2">Đang tải lịch sử...</p>
                </div>
              ) : historyData.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Chưa có lịch sử chỉnh sửa</p>
              ) : (
                <div className="space-y-4">
                  {historyData.map((record) => (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{record.editor.name}</p>
                          <p className="text-xs text-gray-500">{record.editor.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(record.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestore(record.id)}
                          disabled={restoring === record.id}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: restoring === record.id ? '#6E6E73' : '#0071E3' }}
                        >
                          {restoring === record.id ? 'Đang khôi phục...' : 'Khôi phục'}
                        </button>
                      </div>
                      <details className="mt-2">
                        <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                          Xem chi tiết thay đổi
                        </summary>
                        <div className="mt-2 space-y-2">
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Nội dung trước:</p>
                            <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto">
                              {JSON.stringify(record.contentBefore, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Nội dung sau:</p>
                            <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto">
                              {JSON.stringify(record.contentAfter, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Quản lý nội dung Landing Page</h1>
          <p className="text-gray-600 mt-2">Chỉnh sửa nội dung các section trên trang chủ</p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => {
            const isEditing = editingId === section.id;

            return (
              <div
                key={section.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Section header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                    <p className="text-sm text-gray-500">
                      Type: {section.type} • Cập nhật: {new Date(section.updatedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Visibility toggle */}
                    <button
                      onClick={() => handleToggleVisibility(section.id, section.isVisible)}
                      disabled={togglingId === section.id}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        section.isVisible
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {togglingId === section.id
                        ? 'Đang cập nhật...'
                        : section.isVisible
                        ? 'Hiển thị'
                        : 'Ẩn'}
                    </button>

                    {/* History button */}
                    <button
                      onClick={() => handleOpenHistory(section.id)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      Lịch sử
                    </button>

                    {/* Edit button */}
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(section)}
                        className="px-4 py-2 text-sm font-medium text-white rounded-full transition-colors"
                        style={{ backgroundColor: '#0071E3' }}
                      >
                        Chỉnh sửa
                      </button>
                    )}
                  </div>
                </div>

                {/* Section content */}
                <div className="px-6 py-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      {/* JSON editor */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nội dung JSON
                        </label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={15}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          style={{ fontFamily: 'Monaco, Consolas, monospace' }}
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSaveContent(section.id)}
                          disabled={isSaving}
                          className="px-6 py-2 text-sm font-medium text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: '#0071E3' }}
                        >
                          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview nội dung:</p>
                      <pre className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto text-sm font-mono">
                        {JSON.stringify(section.content, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
