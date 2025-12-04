/**
 * Custom Worker Entry Point
 *
 * Wraps OpenNext's generated worker and adds custom Durable Object exports.
 * This file becomes the main entry point in wrangler.toml.
 *
 * Pattern from: https://github.com/opennextjs/opennextjs-cloudflare/tree/main/examples/playground14
 */

// @ts-ignore - .open-next/worker.js is generated at build time
import { default as handler } from './.open-next/worker.js';

// Re-export OpenNext's Durable Objects
// @ts-ignore - .open-next/worker.js is generated at build time
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js';

// Export our custom Durable Object for inquiry WebSocket updates
export { InquiryUpdatesDO } from './lib/durable-objects/inquiry-updates.js';

/**
 * Main worker handler - delegates to OpenNext
 */
export default {
  fetch: handler.fetch,
} satisfies ExportedHandler<CloudflareEnv>;
