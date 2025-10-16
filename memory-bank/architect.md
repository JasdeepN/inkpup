# InkPup Tattoos: System Architecture

## Overview
Architecture notes for the InkPup Tattoos web platform deployed on Cloudflare Workers via OpenNext and surfaced through Next.js App Router.

## Architectural Decisions
- Serve the public site with Next.js App Router (Next 15) bundled by @opennextjs/cloudflare/OpenNext so the worker build runs on Cloudflare Workers with .open-next assets and nodejs_compat enabled.
- Persist gallery media in Cloudflare R2; lib/r2server probes for native bindings, falls back to the AWS S3 client, and can return bundled backups in non-production environments to keep the UI responsive.
- Expose a password-protected admin portal scoped to approved admin hosts; server actions manage uploads and deletes while enforcing signed session cookies.
- Run image uploads through Sharp optimization (rotate, resize to MAX_IMAGE_WIDTH, WebP) before writing to R2, falling back to original buffers when Sharp is unavailable.
- Centralize business metadata and SEO schema through data/business.json, Meta, and LocalBusinessJsonLd components so copy updates stay consistent across the site.

## Design Considerations
- Local development toggles between Next-only dev (shimmed bindings) and Wrangler dev with real bindings; scripts make it easy to switch without leaking credentials.
- Storage helpers preserve synchronous instrumentation (global sendMock) so existing Jest suites can assert on client behavior without refactoring.

## Components

### Public App Router
app/ layout, head, and page modules render the marketing site, hero, and Instagram CTA.

**Responsibilities:**
- Render marketing content and Instagram CTAs for InkPup Tattoos.
- Load structured data and analytics scripts.
- Share global styles, header, footer, and particles background.

### Admin Portal
app/(admin)/admin/page.tsx implements server actions, authentication, and gallery management UI.

**Responsibilities:**
- Gate access by host and portal password.
- Handle uploads, deletions, and feedback messaging.
- Revalidate gallery routes after mutations.

### R2 Storage Module
lib/r2server/* houses credentials, storage helpers, and fallback logic.

**Responsibilities:**
- Create S3 clients or use Cloudflare bindings.
- Optimize and upload images, delete keys, list gallery entries.
- Report credential status and expose fallback results when R2 is unreachable.

### Business Data
data/business.json and SEO components synchronize contact information and LocalBusiness JSON-LD.

**Responsibilities:**
- Provide canonical business details for metadata and UI.
- Drive dynamic titles, descriptions, and schema markup.

### Deployment & Infrastructure Config
open-next.config.*, wrangler.toml, and scripts/configure-r2-*.js encode Cloudflare build and storage automation.

**Responsibilities:**
- Build Worker bundles and asset manifests.
- Bind R2 buckets and configure routes per environment.
- Manage R2 CORS, custom domains, and GitHub Actions secrets.
