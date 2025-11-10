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
- Cloudflare analytics fetcher requests <=24h windows in sequence and caps historical lookback when the API reports retention limits, ensuring dashboards degrade gracefully.


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


## Mobile-first UX design

Implement accessibility-focused mobile UX following 2025 best practices: minimum 44×44px touch targets (iOS) / 48×48dp (Android), 16px+ body text with 1.5 line-height, adequate spacing between interactive elements (min 8px), tactile feedback on touch interactions, and progressive enhancement from mobile to desktop.

### Examples

- Theme toggle: 3rem (48px) touch target
- Mobile menu button: 3rem min-width/height with increased padding
- Mobile nav links: 0.85rem vertical padding with background hover state
- Hero title: text-3xl on mobile, text-5xl on desktop (better fit)
- Gallery cards: active state with scale(0.98) for tactile feedback
- Gallery modal close: 3rem (48px) touch target
- All buttons: min-height 2.75rem (44px) for comfortable tapping
- Body text: explicit 16px font-size with 1.5 line-height
- Gallery captions: 0.9rem (improved from 0.85rem) for readability
- Mobile-specific spacing: reduced gallery grid gap to 1.25rem, increased hero actions padding


## Webhook & Admin-job patterns

- Canonical receiver: Use a single canonical webhook receiver at `/api/admin/reciever` to handle all job lifecycle notifications (events: `job_queued`, `job_failed`, `job_succeeded`, `job_dead_lettered`). Avoid duplicating handler logic across routes.
- Signing & timestamping: Accept signed JSON payloads where the HMAC-SHA256 hex digest of the payload is provided in header `x-hub-signature-256` prefixed by `sha256=` and the epoch-ms timestamp is provided in `x-hub-timestamp`. Enforce a timestamp tolerance window (default ±5 minutes).
- Revalidation: On valid events, the canonical receiver should revalidate admin pages (for example `revalidatePath('/admin')`) so the admin UI reflects job status changes.
- Tests & mocks: Use unit tests that mock `revalidatePath` and `NextResponse` to validate behavior without a running dev server.
- Legacy handling: Archive legacy or duplicate endpoints rather than keeping divergent logic; if needed, support redirects during a transition window but remove legacy routes once senders are migrated.


## GitHub Actions environment secrets in reusable workflows

When using GitHub environment secrets (scoped to dev/production) in reusable workflows, secrets must be explicitly passed via env: sections in job steps. Simply declaring them in the workflow_call secrets: section is insufficient. Additionally, when sourcing credential files that may contain special characters, temporarily disable undefined variable checking (set +u) before sourcing, then re-enable (set -u) to prevent exit code 127 errors. Use printf '%q' format when writing secrets to bash-sourceable files to properly escape special characters.

### Examples

- Workflow pattern: secrets declared at workflow_call level, passed to steps via env: ADMIN_PORTAL_PASSWORD: ${{ secrets.ADMIN_PORTAL_PASSWORD }}
- Safe sourcing: set +u; source .credentials; set -u
- Safe writing: printf 'SECRET=%q\n' "${SECRET}" >> file


## Task Breakdown and Management

Create a comprehensive prompt file that breaks down tasks into actionable steps, utilizing memory management and project management principles. Each step should be saved with a #todo tag for tracking progress.

### Examples

- Creating a project plan with defined milestones and tasks
- Breaking down a coding task into smaller functions with clear objectives


## Task Breakdown with Actionable Steps

Create a comprehensive prompt file that breaks down tasks into actionable steps, utilizing memory management and project management principles. Each step should be saved with a #todo tag for easy tracking and execution.

### Examples

- Creating a project plan with defined milestones and tasks
- Breaking down a coding task into smaller, manageable functions


## Memory Management Enhancement

Ensure that prompts save data to the designated memory management files instead of the prompt file. This enhances data organization and retrieval efficiency.

### Examples

- Saving user preferences to memory management files instead of the main prompt file.
- Storing session data in memory management for better performance.



## #MemoryManagement

Emphasizes the importance of memory management in coding practices, advocating for small, concise tasks and constant context updates to enhance efficiency and performance.

### Examples

- Optimizing data structures to reduce memory usage
- Implementing garbage collection techniques
- Using memory pools for resource management


Emphasizes the importance of memory management in coding practices, ensuring efficient use of resources and preventing memory leaks.

### Examples

- Using smart pointers in C++ to manage dynamic memory allocation.
- Implementing garbage collection in Java to automatically reclaim memory.
- Optimizing data structures to minimize memory usage.


## Adding Environment Variables to Cloudflare Workers Deployment

When adding a new environment variable to Cloudflare Workers deployments, you MUST update 5 locations in the workflow files:

1. **wrangler.toml** - Add to both `[env.dev.vars]` and `[env.production.vars]` sections with `${VAR_NAME}` placeholders
2. **.github/workflows/cloudflare-reusable.yml** - Add to `secrets:` input definition (required: true/false)
3. **.github/workflows/deploy-cloudflare-workers.yml** - Add to `secrets:` pass-through to reusable workflow
4. **.github/workflows/cloudflare-reusable.yml** - Add to "Append all environment variables to credentials file" step in `derive-r2-credentials` job
5. **.github/workflows/cloudflare-reusable.yml** - Add to ALL THREE "Export credentials to environment" steps:
   - Build job (line ~210)
   - Prepare job (line ~285)  
   - Deploy job (line ~362)
6. **.github/workflows/cloudflare-reusable.yml** - Add to `envsubst` variable list in "Render Wrangler config" step (deploy job)

**CRITICAL**: The variables must be exported to $GITHUB_ENV in all three jobs, and included in the envsubst command, otherwise they will be blank in the deployed worker.

**Pattern to add to export blocks:**
```bash
echo "VAR_NAME=${VAR_NAME:-}"
```

**Pattern for envsubst:**
```bash
envsubst '${EXISTING_VARS} ${NEW_VAR}' < wrangler.toml > wrangler.resolved.toml
```

### Examples

- RESEND_API_KEY and CONTACT_EMAIL added for Resend email integration (November 2025)
- ADMIN_PORTAL_PASSWORD and ADMIN_SESSION_SECRET for admin authentication
- R2 credentials (R2_API_TOKEN, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)
