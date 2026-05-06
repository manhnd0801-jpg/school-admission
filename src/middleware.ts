/**
 * Next.js Middleware for route protection and RBAC
 * Requirements: 5.1, 5.4
 *
 * - Protects all /admin/* routes
 * - Redirects to /admin/login when not authenticated
 * - RBAC: only ADMIN role can access /admin/users
 */

import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // RBAC: /admin/users is restricted to ADMIN role only
    if (pathname.startsWith('/admin/users')) {
      const role = token?.['role'] as string | undefined;
      if (!token || role !== 'ADMIN') {
        // Redirect STAFF (or any non-ADMIN) to dashboard
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        // Require authentication for all /admin/* routes
        return !!token;
      },
    },
    pages: {
      signIn: '/admin/login',
    },
  }
);

export const config = {
  matcher: ['/admin/:path*'],
};
