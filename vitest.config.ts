import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'node',

    // Global test setup
    globals: true,

    // Setup files run before each test file
    setupFiles: ['./src/test/setup.ts'],

    // Include patterns
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts', 'src/**/*.spec.tsx'],

    // Exclude patterns
    exclude: ['node_modules', '.next', 'e2e', 'playwright'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.spec.ts',
        'src/**/*.spec.tsx',
        'src/test/**',
        'src/types/**',
        'src/app/**/*.tsx', // Exclude page/layout components from coverage requirement
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Timeout for each test (ms)
    testTimeout: 30000,

    // Timeout for hooks (ms)
    hookTimeout: 30000,

    // Reporter
    reporter: ['verbose'],

    // Pool options for better performance
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
