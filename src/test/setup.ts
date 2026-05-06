/**
 * Global test setup file
 * Runs before each test file
 */

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['NEXTAUTH_SECRET'] = 'test-secret-for-testing-only';
process.env['NEXTAUTH_URL'] = 'http://localhost:3000';
process.env['DATABASE_URL'] = process.env['DATABASE_URL'] ?? 'postgresql://postgres:password@localhost:5432/tuyen_sinh_test';
process.env['REDIS_URL'] = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
