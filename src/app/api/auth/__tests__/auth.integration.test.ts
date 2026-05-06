/**
 * Integration tests for authentication flow
 * Requirements: 5.1, 5.2, 5.3, 5.5, 5.6
 *
 * Tests:
 * - Successful login returns user with role
 * - Wrong password returns null
 * - Lockout after 5 failed attempts
 * - Locked account returns null even with correct password
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

// ============================================================
// Mock Prisma client — must use vi.hoisted so variables are
// available when vi.mock factory is hoisted to the top
// ============================================================

const { mockPrismaUser } = vi.hoisted(() => {
  return {
    mockPrismaUser: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
});

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: mockPrismaUser,
  },
  default: {
    user: mockPrismaUser,
  },
}));

import { handleLogin } from '@/lib/auth';

// ============================================================
// Test helpers
// ============================================================

const PASSWORD = 'SecurePassword123!';
let hashedPassword: string;

// Hash password once before tests
beforeEach(async () => {
  hashedPassword = await bcrypt.hash(PASSWORD, 12);
  vi.clearAllMocks();
});

function makeUser(overrides: Partial<{
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}> = {}) {
  return {
    id: 'user-1',
    email: 'admin@truong.edu.vn',
    passwordHash: hashedPassword,
    name: 'Admin User',
    role: 'ADMIN',
    isActive: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    ...overrides,
  };
}

// ============================================================
// Tests
// ============================================================

describe('handleLogin', () => {
  describe('Successful login', () => {
    it('returns user object with id, email, name, and role on correct credentials', async () => {
      const user = makeUser();
      mockPrismaUser.findUnique.mockResolvedValue(user);
      mockPrismaUser.update.mockResolvedValue({ ...user, failedLoginAttempts: 0, lockedUntil: null });

      const result = await handleLogin('admin@truong.edu.vn', PASSWORD);

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        id: 'user-1',
        email: 'admin@truong.edu.vn',
        name: 'Admin User',
        role: 'ADMIN',
      });
    });

    it('resets failedLoginAttempts to 0 on successful login', async () => {
      const user = makeUser({ failedLoginAttempts: 3 });
      mockPrismaUser.findUnique.mockResolvedValue(user);
      mockPrismaUser.update.mockResolvedValue({ ...user, failedLoginAttempts: 0, lockedUntil: null });

      await handleLogin('admin@truong.edu.vn', PASSWORD);

      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 0,
            lockedUntil: null,
          }),
        })
      );
    });

    it('returns user with STAFF role correctly', async () => {
      const user = makeUser({ role: 'STAFF', email: 'staff@truong.edu.vn' });
      mockPrismaUser.findUnique.mockResolvedValue(user);
      mockPrismaUser.update.mockResolvedValue(user);

      const result = await handleLogin('staff@truong.edu.vn', PASSWORD);

      expect(result).not.toBeNull();
      expect(result?.role).toBe('STAFF');
    });
  });

  describe('Wrong password', () => {
    it('returns null when password is incorrect', async () => {
      const user = makeUser();
      mockPrismaUser.findUnique.mockResolvedValue(user);
      mockPrismaUser.update.mockResolvedValue({ ...user, failedLoginAttempts: 1 });

      const result = await handleLogin('admin@truong.edu.vn', 'WrongPassword!');

      expect(result).toBeNull();
    });

    it('increments failedLoginAttempts on wrong password', async () => {
      const user = makeUser({ failedLoginAttempts: 2 });
      mockPrismaUser.findUnique.mockResolvedValue(user);
      mockPrismaUser.update.mockResolvedValue({ ...user, failedLoginAttempts: 3 });

      await handleLogin('admin@truong.edu.vn', 'WrongPassword!');

      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 3,
          }),
        })
      );
    });
  });

  describe('Account lockout after 5 failed attempts', () => {
    it('sets lockedUntil when failedLoginAttempts reaches 5', async () => {
      // User has 4 failed attempts, this is the 5th
      const user = makeUser({ failedLoginAttempts: 4 });
      mockPrismaUser.findUnique.mockResolvedValue(user);
      mockPrismaUser.update.mockResolvedValue({
        ...user,
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      });

      const result = await handleLogin('admin@truong.edu.vn', 'WrongPassword!');

      expect(result).toBeNull();
      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 5,
            lockedUntil: expect.any(Date),
          }),
        })
      );

      // Verify lockedUntil is approximately 15 minutes from now
      const updateCall = mockPrismaUser.update.mock.calls[0][0];
      const lockedUntil: Date = updateCall.data.lockedUntil;
      const expectedLockEnd = Date.now() + 15 * 60 * 1000;
      expect(lockedUntil.getTime()).toBeGreaterThan(Date.now());
      expect(lockedUntil.getTime()).toBeLessThanOrEqual(expectedLockEnd + 1000); // 1s tolerance
    });

    it('does not set lockedUntil before reaching 5 failed attempts', async () => {
      const user = makeUser({ failedLoginAttempts: 3 });
      mockPrismaUser.findUnique.mockResolvedValue(user);
      mockPrismaUser.update.mockResolvedValue({ ...user, failedLoginAttempts: 4 });

      await handleLogin('admin@truong.edu.vn', 'WrongPassword!');

      const updateCall = mockPrismaUser.update.mock.calls[0][0];
      expect(updateCall.data.lockedUntil).toBeUndefined();
    });
  });

  describe('Locked account', () => {
    it('returns null even with correct password when account is locked', async () => {
      const lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // locked for 10 more minutes
      const user = makeUser({ failedLoginAttempts: 5, lockedUntil });
      mockPrismaUser.findUnique.mockResolvedValue(user);

      const result = await handleLogin('admin@truong.edu.vn', PASSWORD);

      expect(result).toBeNull();
      // Should NOT call update (no password check performed)
      expect(mockPrismaUser.update).not.toHaveBeenCalled();
    });

    it('allows login after lockout period expires', async () => {
      // lockedUntil is in the past
      const lockedUntil = new Date(Date.now() - 1000);
      const user = makeUser({ failedLoginAttempts: 5, lockedUntil });
      mockPrismaUser.findUnique.mockResolvedValue(user);
      mockPrismaUser.update.mockResolvedValue({ ...user, failedLoginAttempts: 0, lockedUntil: null });

      const result = await handleLogin('admin@truong.edu.vn', PASSWORD);

      expect(result).not.toBeNull();
      expect(result?.email).toBe('admin@truong.edu.vn');
    });
  });

  describe('User not found or inactive', () => {
    it('returns null when user does not exist', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const result = await handleLogin('nonexistent@truong.edu.vn', PASSWORD);

      expect(result).toBeNull();
    });

    it('returns null when user account is inactive', async () => {
      const user = makeUser({ isActive: false });
      mockPrismaUser.findUnique.mockResolvedValue(user);
      mockPrismaUser.update.mockResolvedValue({ ...user, failedLoginAttempts: 1 });

      const result = await handleLogin('admin@truong.edu.vn', PASSWORD);

      expect(result).toBeNull();
    });

    it('increments failedLoginAttempts for inactive user', async () => {
      const user = makeUser({ isActive: false, failedLoginAttempts: 0 });
      mockPrismaUser.findUnique.mockResolvedValue(user);
      mockPrismaUser.update.mockResolvedValue({ ...user, failedLoginAttempts: 1 });

      await handleLogin('admin@truong.edu.vn', PASSWORD);

      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: { increment: 1 },
          }),
        })
      );
    });
  });
});
