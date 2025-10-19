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


## Centralized metadata management

Site metadata is exported from lib/site-metadata.ts as a typed Metadata object derived from business.json. This single source of truth is imported into app/layout.tsx and provides consistent SEO, Open Graph, and Twitter card metadata across the application.

### Examples

- lib/site-metadata.ts exports siteMetadata and siteMetadataFields
- app/layout.tsx imports and exports siteMetadata as metadata const


## App Router error boundaries

Next.js App Router uses file-based error boundaries: error.tsx for route-level errors, global-error.tsx for application-wide errors, and not-found.tsx for 404s. All error pages are client components ('use client') with consistent styling and recovery actions (reset, navigate home).

### Examples

- app/error.tsx handles route errors with reset button
- app/global-error.tsx wraps entire app with minimal HTML shell
- app/not-found.tsx uses force-dynamic to prevent static prerendering


## Admin routes with server actions: Direct routing over route groups

Password-protected admin routes that use server actions should be placed as direct routes (app/admin/page.tsx) rather than within route groups (app/(admin)/admin/page.tsx). Route groups that include a root page.tsx with notFound() or redirect() cause clientReferenceManifest conflicts when server actions exist in adjacent pages. Admin portal uses server actions (loginAction, logoutAction, uploadAction, deleteAction) with signed session cookies for authentication. Session tokens are verified via verifySessionToken() before exposing admin functionality.

### Examples

- app/admin/page.tsx - Direct admin route with server actions
- Session management: verifySessionToken(sessionToken) with signed cookies
- R2 operations: listGalleryImages(category).asPromise(), uploadGalleryImage(), deleteGalleryImage()


## Build configuration: NODE_ENV=production enforcement

Always use cross-env to enforce NODE_ENV=production in build scripts. Next.js uses NODE_ENV to determine bundling strategy - when set to 'development' during build, it incorrectly bundles Pages Router Document component during App Router error page prerendering (/404, /500), causing "Html should not be imported outside of pages/_document" error. The build script must be: "build": "cross-env NODE_ENV=production next build" to ensure production bundling across all platforms (Linux, macOS, Windows).

### Examples

- package.json: "build": "cross-env NODE_ENV=production next build"
- cross-env package installed as devDependency
- Validates across Next.js 15.x and 16.x versions
