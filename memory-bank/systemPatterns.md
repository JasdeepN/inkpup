# System Patterns

## Architectural Patterns
- Cloudflare Worker deployment via OpenNext: Next.js App Router builds are produced by @opennextjs/cloudflare/OpenNext and run on Cloudflare Workers with nodejs_compat enabled, mirroring production in Wrangler dev.
- Layered R2 access and fallback: lib/r2server prefers Cloudflare bindings, falls back to the AWS S3 client, and serves bundled gallery backups in non-production environments so the UI remains responsive without credentials.

## Design Patterns
- Server actions with signed session cookies: the admin portal authenticates via password-protected forms, stores sessions in signed cookies, and revalidates pages after uploads or deletes.
- Instrumented storage helpers: listGalleryImages and callSendAndMaybeGlobal mirror client.send calls to global mocks, keeping Jest suites synchronous without refactoring to async observers.

## Common Idioms
- Use data/business.json as the single source of truth for business copy, metadata, and structured data components.
- Call listGalleryImages().asPromise() when asynchronous iteration is required while preserving the legacy synchronous result object.
- Run Jest from the terminal with `npx jest --forceExit` (and additional flags as needed) to avoid hung processes.
