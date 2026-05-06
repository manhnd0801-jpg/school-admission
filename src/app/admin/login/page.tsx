'use client';

/**
 * Admin Login Page
 * Requirements: 5.1, 5.2, 5.3
 *
 * - Form with email and password fields
 * - Calls NextAuth signIn on submit
 * - Displays generic error "Email hoặc mật khẩu không đúng" (does not reveal which field is wrong)
 * - Shows lockout message when account is locked
 */

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for error from URL params (e.g., after redirect)
  const urlError = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null): string | null => {
    if (!errorCode) return null;
    // Map NextAuth error codes to user-friendly messages
    switch (errorCode) {
      case 'CredentialsSignin':
        return 'Email hoặc mật khẩu không đúng';
      case 'AccountLocked':
        return 'Tài khoản đã bị khóa tạm thời do đăng nhập sai nhiều lần. Vui lòng thử lại sau 15 phút.';
      default:
        return 'Email hoặc mật khẩu không đúng';
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Display generic error — do not reveal which field is wrong
        setError('Email hoặc mật khẩu không đúng');
      } else if (result?.ok) {
        // Redirect to dashboard on success
        const callbackUrl = searchParams.get('callbackUrl') ?? '/admin/dashboard';
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = error ?? getErrorMessage(urlError);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h1 className="mt-6 text-center text-3xl font-semibold text-gray-900">
            Đăng nhập CMS
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hệ thống quản lý tuyển sinh
          </p>
        </div>

        {/* Error message */}
        {displayError && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md bg-red-50 p-4 border border-red-200"
          >
            <p className="text-sm text-red-700">{displayError}</p>
          </div>
        )}

        {/* Login form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="email@truong.edu.vn"
                aria-describedby={displayError ? 'login-error' : undefined}
              />
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
                aria-describedby={displayError ? 'login-error' : undefined}
              />
            </div>
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: '#0071E3' }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
