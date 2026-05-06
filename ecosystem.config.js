/**
 * PM2 Ecosystem Configuration
 * Used for production worker process management
 *
 * Requirements: 22.3
 */

module.exports = {
  apps: [
    {
      name: 'tuyen-sinh-app',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'tuyen-sinh-worker',
      script: 'node_modules/.bin/tsx',
      args: 'src/workers/index.ts',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
