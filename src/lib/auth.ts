/**
 * NextAuth.js configuration and authentication logic
 * Requirements: 5.1, 5.2, 5.3, 5.5, 5.6
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// Account lockout constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

/**
 * Handles login logic:
 * - Finds user by email
 * - Checks account lockout
 * - Compares password with bcrypt
 * - Manages failedLoginAttempts and lockedUntil
 *
 * Returns user object on success, null on failure.
 */
export async function handleLogin(
  email: string,
  password: string
): Promise<{ id: string; email: string; name: string; role: string } | null> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // User not found or not active — increment failed attempts if user exists
  if (!user || !user.isActive) {
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { increment: 1 } },
      });
    }
    return null;
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return null;
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    const newFailedAttempts = user.failedLoginAttempts + 1;
    const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newFailedAttempts,
        ...(shouldLock
          ? {
              lockedUntil: new Date(
                Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
              ),
            }
          : {}),
      },
    });

    return null;
  }

  // Successful login — reset failed attempts and clear lockout
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

/**
 * NextAuth.js configuration
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await handleLogin(credentials.email, credentials.password);
        return user;
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    // Sliding window: 8 hours
    maxAge: 8 * 60 * 60,
    updateAge: 60 * 60, // Update session every hour to implement sliding window
  },

  jwt: {
    maxAge: 8 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name:
        process.env['NODE_ENV'] === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env['NODE_ENV'] === 'production',
      },
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, add role to token
      if (user) {
        token['role'] = (user as { id: string; email: string; name: string; role: string }).role;
        token['id'] = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      // Add role and id to session from token
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token['id'] as string;
        (session.user as { id?: string; role?: string }).role = token['role'] as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
};
