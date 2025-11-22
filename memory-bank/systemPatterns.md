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


## Dual-pathway UX implementation strategy

When implementing multi-segment service offerings (e.g., flash tattoos vs custom designs), prioritize functional completeness over polish: (1) Build navigation immediately after creating new pages to ensure discoverability, (2) Complete both pathways before adding enhancements, (3) Test user journeys end-to-end before optimization, (4) Consider leveraging existing forms (e.g., /contact with query params) for MVP before building specialized forms, (5) Defer homepage enhancements, analytics, and tests until core functionality is validated. Follow "narrow but deep" over "wide but shallow" - complete one full user journey before expanding features.

### Examples

- InkPup dual-pathway: Built Hero CTAs + ServiceExplainer + Flash page before realizing navigation was missing (blocker)
- Lesson: Task 9 (navigation) should have been priority #2 after Task 1 (Hero)
- Revised approach: Tasks 9 + 4 (navigation + custom page) = functional MVP in 45-60 min
- Decision point pattern: Test if existing /contact form + query params sufficient before building specialized forms (Tasks 5-8)


## Adaptive context-driven contact form

Single /contact form adapts to booking scenarios using query params (design=<id> for flash, type=custom for consultations). Conditional required fields (placement, concept, placement_size) and dynamic email subject/body reduce need for multiple endpoints while keeping UX focused. Pattern favors extendability (add new booking types via param enumeration) and reduces maintenance overhead.

### Examples

- URL /contact?design=42 triggers Flash Booking form (hidden design_id, placement field required)
- URL /contact?type=custom triggers Custom Consultation form (concept, placement_size required, budget optional)
- Email subject logic: design_id -> 'Flash Booking Request', booking_type=custom -> 'Custom Consultation Request', else generic contact


## Glassmorphism/Frosted Glass Containers

[PATTERN:2025-11-20] Glassmorphism Design System - Frosted glass aesthetic with transparent backgrounds, backdrop-blur effects, and depth hierarchy. Use CSS variables (--surface-glass, --surface-glass-elevated, --border-glass) for consistent theming across light/dark modes. Apply backdrop-filter: blur(12px) with -webkit- prefix for Safari. Tailwind pattern: bg-white/10 dark:bg-white/8 backdrop-blur-lg border border-white/20 dark:border-white/18 shadow-lg. Enhance text readability with font-weight: 600 and text-shadow: 0 1px 2px rgba(0,0,0,0.1). Reference implementation: LoginForm, hero-path-card, PricingEstimator.

### Examples

- app/globals.scss: --surface-glass: rgba(255,255,255,0.1) in :root, rgba(255,255,255,0.08) in html.dark
- app/globals.scss: .hero-path-card with backdrop-filter: blur(12px) and -webkit-backdrop-filter
- components/PricingEstimator.tsx: bg-white/10 dark:bg-white/8 backdrop-blur-lg border-white/20
- app/pricing/page.tsx: Info cards with glassmorphism shadow-lg treatment

## Animation Architecture
[PATTERN:2025-11-22]
- **Core animations**: 7 keyframes defined in `app/styles/_animations.scss` (slideInDown, fadeIn, scaleIn, slideInUp, pulse-glow, admin-stat-skeleton, gallery-skeleton)
- **Animation variables**: CSS custom properties in `_variables.scss` for timing (--animation-duration-fast/normal/slow: 200ms/300ms/500ms) and easing (--animation-ease-smooth/spring/bounce with cubic-bezier curves)
- **3D perspective**: --card-perspective: 1000px for 3D transform effects
- **Performance focus**: All animations use GPU-accelerated properties only (transform, opacity, box-shadow). Zero layout-triggering animations (width/height/top/left forbidden)
- **Accessibility**: `@media (prefers-reduced-motion: reduce)` support with animation-duration: 0.01ms override
- **Gallery stagger**: `.gallery-card` children animated with incremental delays (50ms increments, 9 children supported)
- **No animation libraries**: Pure CSS approach, zero JavaScript animation frameworks (no Framer Motion, GSAP, react-spring)
- **Browser targets**: 95%+ support, fallback-first approach for newer APIs like View Transitions
- **Performance budget**: 60fps target (16.66ms frame budget), CSS <10KB increase limit

### Phase 1 CSS Micro-interactions (Implemented 2025-11-22)
**Status**: ✅ Complete - 10 new keyframes, 0KB bundle increase, 238 tests passing

**Keyframes Added** (app/styles/_animations.scss):
- `buttonPress`: Scale press feedback (0.95 → 1.0) with spring easing
- `buttonGlowPulse`: Pulsing box-shadow for primary button hover states (1.5s infinite)
- `inputFocusGlow`: Ring animation on input focus (300ms smooth easing)
- `inputShake`: Horizontal shake for validation errors (10 steps, -8px to +8px)
- `checkmarkDraw`: SVG stroke-dashoffset animation for success checkmarks
- `successBounce`: Scale bounce effect (0 → 1.1 → 1.0) with overshoot easing
- `successFadeIn`: Opacity + translateY combo for success message appearance
- `navGlowTrail`: ScaleX animation for navigation link underlines
- `themeTransition`: 360° rotation with scale pulse for theme toggle (500ms)

**Implementation Locations**:
- **_buttons.scss**: `.btn:active` uses buttonPress, `.btn--primary:hover` uses buttonGlowPulse
- **_forms.scss**: `input:focus` uses inputFocusGlow, `input:invalid` uses inputShake
- **_base.scss**: `.success-message`, `.success-icon`, `.checkmark-path` utility classes
- **_gallery.scss**: `.gallery-card` with perspective and 3D tilt on hover (rotateX/rotateY)
- **_components.scss**: `.glass-panel:hover` with translateY + scale + enhanced shadows
- **_layout.scss**: `.primary-nav a:hover` with translateY + navGlowTrail, `.header-toggle:active` with themeTransition

**Performance Characteristics**:
- All keyframes use transform/opacity/box-shadow only (GPU-accelerated)
- No layout thrashing or reflow triggers
- Respects prefers-reduced-motion (inherited from existing @media rule)
- Zero JavaScript, pure CSS solution
- Bundle size: 0KB increase (CSS only)

**Usage Examples**:
```scss
// Button press feedback
.btn:active:not(:disabled) {
  animation: buttonPress var(--animation-duration-fast) var(--animation-ease-spring);
}

// Input focus glow
input:focus {
  animation: inputFocusGlow var(--animation-duration-normal) var(--animation-ease-smooth) forwards;
}

// Success message appearance
.success-message {
  animation: successFadeIn var(--animation-duration-normal) var(--animation-ease-smooth);
}

// 3D card tilt on hover
.gallery-card {
  perspective: var(--card-perspective);
}
.gallery-card:hover {
  transform: translateY(-6px) scale(1.02) rotateX(2deg) rotateY(-2deg);
}
```

### Animation Enhancement Roadmap (Planned)
- **Phase 2** (Intersection Observer, ~2KB): Scroll-triggered parallax, section reveals, counter animations, progressive stagger
- **Phase 3** (View Transitions API, ~3KB): Page navigation morphing, modal expansion, image gallery transitions (86% browser support)
- **Phase 4** (Advanced polish, ~5KB): Confetti effects, skeleton morphing, blur-up loading states (optional enhancement)

### Legacy Animation Examples
- Button hover: `transition: transform var(--animation-duration-fast) var(--animation-ease-spring)`
- Gallery card: `animation: fadeIn var(--animation-duration-normal) var(--animation-ease-smooth) backwards`
- Reduced motion: `* { animation-duration: 0.01ms !important; }`

## Glassmorphism (Futuristic Style)
[PATTERN:2025-11-20]
- **Class**: `.glass-panel` (defined in `app/globals.scss`)
- **Characteristics**:
  - Background: Layered linear gradients with low opacity (white/5-20%).
  - Filter: `backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate)) contrast(var(--glass-contrast))`
  - Border: `1px solid var(--border-glass)`
  - Highlight: `::before` pseudo-element with `radial-gradient` and `mix-blend-mode: overlay`.
  - Shadow: Deep, multi-layered box-shadows.
  - Radius: `1.25rem` (default).
- **Usage**: Apply `.glass-panel` to containers requiring the "futuristic glass" look.
- **Buttons**: Use `.btn--glass` for glass-styled buttons (inherits from `.glass-panel` but with button-specific padding and radius).
