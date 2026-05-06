/**
 * BullMQ Worker Entry Point
 *
 * Starts all background workers:
 * - lead-submission: retry INSERT lead when DB recovers
 * - scheduled-publish: publish Articles when scheduledAt <= now()
 * - lead-export: async Excel export for large datasets
 *
 * This process runs separately from the Next.js app (see docker-compose.yml worker service).
 */

console.log('[Worker] Starting BullMQ workers...');

// Import workers — each module registers its own Worker instance on import
import './lead-submission.worker';
import './lead-export.worker';

// Graceful shutdown is handled by each individual worker module.
// This entry point just keeps the process alive.

console.log('[Worker] Workers started. Waiting for jobs...');
