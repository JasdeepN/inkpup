# System Patterns

## Architectural Patterns
- Cloudflare Worker deployment via OpenNext: Next.js App Router builds are produced by @opennextjs/cloudflare/OpenNext and run on Cloudflare Workers with nodejs_compat enabled, mirroring production in Wrangler dev.
- Layered R2 access and fallback: lib/r2server prefers Cloudflare bindings, falls back to the AWS S3 client, and serves bundled gallery backups in non-production environments so the UI remains responsive without credentials.
 - Non-blocking D1 synchronization for gallery metadata: Upload/delete flows attempt D1 insert/delete but never fail the primary R2 operation on D1 error; R2 is the source of truth, D1 provides structured query capability (width, height, size, category) for future filtering & admin experience. [PATTERN:2025-11-25]
 - Manual migration fallback strategy: If `wrangler d1 migrations apply` encounters UNIQUE constraint on existing schema versions (e.g. version 1 already applied remotely), prefer targeted manual CREATE TABLE statements plus `INSERT OR IGNORE` into schema_migrations rather than destructive reset, preserving historical pricing data. [PATTERN:2025-11-25]

## Design Patterns
- Server actions with signed session cookies: the admin portal authenticates via password-protected forms, stores sessions in signed cookies, and revalidates pages after uploads or deletes.
- Instrumented storage helpers: listGalleryImages and callSendAndMaybeGlobal mirror client.send calls to global mocks, keeping Jest suites synchronous without refactoring to async observers.
 - KV-first read with D1 fallback (planned): Gallery listing will query KV for cached, denormalized image metadata (id, key, url, dims) keyed by `gallery:<category>`; on miss, fall back to D1 SELECT, hydrate KV, and return. Ensures high-frequency reads avoid direct D1 queries. [PATTERN:2025-11-25]

## Common Idioms
- Use data/business.json as the single source of truth for business copy, metadata, and structured data components.
- Call listGalleryImages().asPromise() when asynchronous iteration is required while preserving the legacy synchronous result object.
- Run Jest from the terminal with `npx jest --forceExit` (and additional flags as needed) to avoid hung processes.
- Cloudflare analytics fetcher requests <=24h windows in sequence and caps historical lookback when the API reports retention limits, ensuring dashboards degrade gracefully.
 - Record manual migrations with explicit version numbers to maintain chronological integrity; do not overwrite existing schema_migrations rows—use `INSERT OR IGNORE`. [PATTERN:2025-11-25]


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


## Scroll-Reveal Animations Site-Wide [ANIMATION:2025-11-23]

Systematic implementation of scroll-triggered reveal animations across all public pages using Intersection Observer API for performance and accessibility.

### Animation Architecture

**Core Components:**
- `RevealOnScroll` wrapper component (components/animations/RevealOnScroll.tsx)
- `useScrollReveal` hook with Intersection Observer (lib/animations/useScrollReveal.ts)
- `useReducedMotion` hook for accessibility (lib/animations/useReducedMotion.ts)
- CSS animation classes: `reveal-hidden` → `reveal-visible` (app/styles/_animations.scss)

**Animation System:**
- **Effect**: translateY(30px) opacity(0) → translateY(0) opacity(1)
- **Duration**: var(--animation-duration-slow) (~600ms)
- **Easing**: var(--animation-ease-smooth) (cubic-bezier)
- **Trigger**: 10% element visibility (THRESHOLD.EARLY)
- **Trigger once**: Default true (no re-animation on scroll-up)
- **Accessibility**: Auto-disabled for users with prefers-reduced-motion

### Stagger Delay Pattern

Consistent cascading animation timing across all pages:
- **0ms**: Page title/hero heading (immediate reveal)
- **100ms**: Primary subtitle or first content block
- **150ms**: Secondary content section
- **200ms**: Third content section or gallery
- **250ms**: Additional cards/items
- **300ms**: CTA sections
- **350ms**: Footer or final content

### Pages Implemented

1. **Homepage (components/Hero.tsx)**
   - Hero title & subtitle: 0ms
   - Flash card: 100ms
   - Custom card: 200ms

2. **About Page (app/about/page.tsx)**
   - Header: 0ms
   - "What to expect": 100ms
   - Studio details: 200ms
   - Ready CTA: immediate (no reveal)

3. **Portfolio Page (app/portfolio/page.tsx)**
   - Intro (title + subtitle): 0ms
   - Gallery grid: 100ms

4. **Portfolio Detail (app/portfolio/[slug]/page.tsx)**
   - Page title: 0ms
   - Gallery: 100ms

5. **Flash Page (app/flash/page.tsx)**
   - Hero title/subtitle: 0ms
   - Pricing info: 100ms
   - Gallery heading: 200ms
   - Gallery grid/empty state: 250ms
   - Bottom CTA: 300ms

6. **Custom Design Page (app/custom-design/page.tsx)**
   - Hero section: 0ms
   - "How It Works" title: 100ms
   - Process steps 1-5: 150ms, 200ms, 250ms, 300ms, 350ms (staggered)
   - Pricing section: 100ms
   - Showcase gallery: 150ms
   - Final CTA: 200ms

7. **Pricing Page (app/pricing/page.tsx)**
   - Header: 0ms
   - Pricing estimator: 100ms
   - "What Affects Pricing": 200ms
   - Multi-session projects: 250ms
   - Why estimates vary: 300ms
   - Ready CTA: 350ms
   - Data sources: immediate (no reveal)

8. **Contact Page (app/contact/page.tsx)**
   - Header & Instagram CTA: 0ms
   - Calendly section: 100ms (conditional)
   - Contact form: 150ms

### Technical Implementation

**Import pattern:**
```tsx
import RevealOnScroll from '../../components/animations/RevealOnScroll';
```

**Usage pattern:**
```tsx
<RevealOnScroll delay={100}>
  <section>
    {/* Content here */}
  </section>
</RevealOnScroll>
```

**Props available:**
- `delay`: number (milliseconds, default 0)
- `threshold`: number (0-1, default 0.1)
- `rootMargin`: string (default '0px')
- `triggerOnce`: boolean (default true)
- `className`: string (additional CSS classes)

### Performance Characteristics

- **Bundle impact**: ~1KB per page using RevealOnScroll
- **Runtime overhead**: Minimal (Intersection Observer is async/non-blocking)
- **Browser support**: Graceful degradation (immediate show if unsupported)
- **Accessibility**: Respects prefers-reduced-motion automatically
- **SEO**: No impact (content in DOM, only CSS transform/opacity animated)

### Best Practices

1. **Consistent delays**: Use multiples of 50ms (50, 100, 150, 200...)
2. **Maximum stagger**: Keep total cascade under 400ms for perceived performance
3. **Group related content**: Wrap logical sections together
4. **Title priority**: Always animate page titles first (0ms delay)
5. **CTA timing**: Delay CTAs slightly (200-350ms) to draw attention after content
6. **Avoid over-animation**: Don't wrap every individual element; group sections
7. **Test with motion disabled**: Verify layout works without animations

### Animation Constants Reference

From lib/animations/constants.ts:
- THRESHOLD.EARLY: 0.1 (10% visible)
- THRESHOLD.QUARTER: 0.25
- THRESHOLD.HALF: 0.5
- STAGGER.FAST: 50ms
- STAGGER.NORMAL: 100ms
- STAGGER.SLOW: 150ms

### Future Enhancement Opportunities

- Stagger individual gallery items with map index delays
- Add slide-from-side variants (RevealFromLeft, RevealFromRight)
- Implement parallax scrolling for hero images
- Add count-up animations for pricing numbers
- Create reveal variants for different entry directions (up, down, left, right, scale)

### Migration Notes

When adding new pages:
1. Import RevealOnScroll component
2. Wrap page title with 0ms delay reveal
3. Wrap major content sections with staggered delays (100ms increments)
4. Test with reduced motion enabled
5. Verify build completes without errors
6. Check bundle size impact (should be minimal)


## Task Breakdown and Management

## Adaptive Glass Blur Pattern [PATTERN:2025-11-24]

### Context
Navigation glass panel needed to preserve luminous particle points. Original blur (10px light / 16px dark) diffused small particle pixels into a uniform haze in Firefox.

### Pattern
Use parameterized `@include glass-panel($bg, $blur)` to adjust blur per component instead of duplicating styles. For sensitive layered visuals (particles behind glass), reduce blur to 4px–6px while keeping saturation/contrast filters.

### Firefox-Specific Adjustment
Firefox implements backdrop-filter differently (heavier diffusion). Detect via `@supports (-moz-appearance: none)` rather than UA sniffing and apply a lower blur value only for affected elements.

```scss
.sticky-nav { @include glass-panel(var(--glass-panel-bg), 6px); }
@supports (-moz-appearance: none) {
  .sticky-nav { backdrop-filter: blur(4px) saturate(var(--glass-saturate)) contrast(var(--glass-contrast)); }
}
```

### Ancestor Transparency Requirement
Ensure wrapper (`.sticky-header`) has `background: transparent;` or backdrop-filter will block underlying layers in Firefox.

### When To Reduce Blur
- Background contains small, bright particle sprites.
- Underlying layer relies on color contrast for visual depth.
- Performance concerns on low-power devices (smaller blur kernel cheaper).

### Do Not Reduce Blur When
- Large background imagery benefits from strong diffusion.
- Element is primary hero card (retain default aesthetic consistency).

### Benefits
- Preserves particle visibility & depth.
- Avoids code duplication by reusing mixin.
- Maintains consistent theming variables.
- Minimizes browser-specific hacks; uses feature detection.

### Risks & Mitigation
| Risk | Mitigation |
|------|------------|
| Over-reduction makes glass look like plain transparent panel | Maintain saturation/contrast filters and highlight ::before overlay |
| Future browser changes to backdrop-filter detection | Fallback remains acceptable (slightly stronger blur) |
| Inconsistent blur across components | Document per-component overrides; keep hero at default |

### Future Enhancements
- Particle overlay layer above nav (second canvas with selective opacity).
- Dynamic blur reduction on scroll (progressive clarity as user scrolls).
- User preference toggle for “High Clarity Nav”.

## Test-Friendly Animation Progressive Enhancement [PATTERN:2025-11-24]

### Context
React 19 test environment produced AggregateError during render of components wrapping animated children with `RevealOnScroll` due to immediate `useEffect` state updates (IntersectionObserver unsupported → synchronous `setIsVisible(true)`). Multiple rapid state commits triggered act aggregation in Jest.

### Pattern
Provide a test-only shortcut inside animation wrapper components (`if (process.env.NODE_ENV === 'test') return <div>{children}</div>;`). This bypasses runtime feature detection and state updates while preserving production behavior. Export internal caches and reset helpers (e.g., `__viewTransitionsSupportCache` + `__resetViewTransitionsSupportCache`) for deterministic unit tests of progressive enhancement utilities.

### Benefits
- Eliminates noisy AggregateError act failures in Jest without complex mocking.
- Keeps production logic unchanged (progressive enhancement, IntersectionObserver, View Transitions API).
- Simplifies unit tests by allowing direct assertion of feature detection and wrapper fallbacks.

### Implementation Example
```tsx
// RevealOnScroll.tsx
if (process.env.NODE_ENV === 'test') {
   return <div className={className}>{children}</div>;
}
```

```ts
// viewTransitions.ts
export let __viewTransitionsSupportCache: boolean | undefined;
export function __resetViewTransitionsSupportCache() { __viewTransitionsSupportCache = undefined; }
```

### Use Cases
- Complex intersection or animation wrappers that trigger immediate state changes.
- Feature detection functions requiring cache resets between tests.
- Avoiding brittle global mocks for newer browser APIs (View Transitions, IntersectionObserver).

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Divergence between test and production behavior | Tests explicitly focus on logic units (feature detection, naming) while integration/E2E suites exercise real behavior in browser. |
| Developers forget shortcut exists and misinterpret missing classes in unit snapshots | Document pattern here and ensure integration tests (Playwright) cover visual animations. |
| Overuse of NODE_ENV conditionals | Restrict usage to animation wrappers and API feature detection caches only. |

### Future Enhancements
- Introduce optional `TEST_DISABLE_ANIMATIONS` env to widen scope (e.g., count-up, parallax) when needed.
- Add a Jest custom environment to auto-mock IntersectionObserver for more realistic visibility unit tests without triggering act errors.

## Gallery Modal View Transition Pattern [PATTERN:2025-11-24]

### Context
Phase 3 Component C begins implementing View Transitions for the gallery modal to morph a thumbnail image into its expanded preview without JavaScript animation libraries. Existing CSS pseudo-element rules in `_animations.scss` target `.gallery-modal` and `.gallery-img` transition groups.

### Implementation
1. On thumbnail click, feature detection (`supportsViewTransitions()`) gates enhancement.
2. Thumbnail image element (`.gallery-card__img`) receives `view-transition-name: gallery-img` just before state update.
3. State update (`setSelected(item)`) wrapped in `startViewTransition()` to capture old/new DOM snapshots.
4. Modal dialog assigns `view-transition-name: gallery-modal`; expanded image assigns `view-transition-name: gallery-img` for morph.
5. Fallback: Unsupported browsers perform instant open/close without added styles.

### CSS Groups
Defined in `_animations.scss`:
```scss
::view-transition-group(.gallery-modal) { animation-duration: 400ms; }
::view-transition-group(.gallery-img) { animation-duration: 350ms; }
```

### Benefits
- Native morphing effect (scale/fade) with minimal code and zero external libs.
- Consistent with progressive enhancement & reduced-motion preferences.
- Reuses existing utility functions (feature detection, naming) for predictable tests.

### Testing Strategy
- Simulate API support by assigning `document.startViewTransition` mock returning finished promises.
- Assert inline style contains `view-transition-name: gallery-modal` and `view-transition-name: gallery-img` after click.
- Non-support scenario implicitly covered by existing modal tests (absence of style attribute match).

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Style attribute not preserved in all environments (JSDOM differences) | Tests match raw style string via regex; avoids relying on typed style API. |
| Future need for per-image unique names | Pattern can evolve to `generateTransitionName('gallery-img', item.id)` with supplemental CSS generation if individualized timing needed. |
| Leaving transition names permanently could affect unrelated transitions | Name assignment kept scoped to gallery; future cleanup function available via `setTransitionName` return value if needed. |

### Future Enhancements
- Add backdrop fade group (`modal-backdrop`) for darkening underlying content.
- Expand pattern to image category tab switches (`tab-panel`).
- Consider dynamic unique names for thumbnail → modal to enable simultaneous multi-modal patterns (if design evolves).

## View Transitions API (Progressive Enhancement)

The application uses the native View Transitions API for smooth state changes and page navigation, with a fallback for unsupported browsers.

### Core Components
- `lib/animations/viewTransitions.ts`: Utilities for feature detection (`supportsViewTransitions`) and wrapping updates (`startViewTransition`).
- `components/PageTransitionWrapper.tsx`: Assigns unique `view-transition-name` to the page root based on the current route (e.g., `page-home`, `page-about`).
- `components/TransitionLink.tsx`: A wrapper around `next/link` that intercepts navigation to trigger a view transition.
- `app/styles/_animations.scss`: Defines the CSS animations for view transitions (slide, fade, scale) using `::view-transition-group`, `::view-transition-old`, and `::view-transition-new`.

### Usage Patterns
1. **Page Navigation**: Use `<TransitionLink>` instead of `<Link>` for internal navigation.
2. **State Changes**: Wrap state updates (e.g., modal open/close, tab switching, theme toggle) in `startViewTransition(() => { setState(...) })`.
3. **Shared Elements**: Assign matching `view-transition-name` styles to elements that should morph between states (e.g., `gallery-img` for modal expansion).
4. **CSS Customization**: Use `[data-transition-name="..."]` or specific class selectors in `_animations.scss` to customize the transition behavior (duration, easing, transform).
5. **Initial Viewport**: Avoid using `RevealOnScroll` for elements in the initial viewport (e.g., Hero titles). `RevealOnScroll` initially hides content (`opacity: 0`), which causes the View Transition API to capture an empty snapshot, leading to visual glitches/snapping. Let the View Transition handle the entrance animation for the page itself.
6. **Transparent Backgrounds**: For pages with transparent backgrounds (e.g., glassmorphism over particles), use **sequential** View Transitions (Fade Out completely, *then* Fade In) rather than simultaneous cross-fades. This prevents visual clutter where text from the new page overlaps text from the old page during the transition.
7. **Disable Group Morphing**: For full-page transitions where the layout size or scroll position changes significantly, explicitly set `animation-duration: 0s` on the `::view-transition-group` (e.g., `::view-transition-group(root)`). This prevents the browser from interpolating the geometry (width/height/transform) of the page container, which can cause "jumping" or "compression" artifacts. The content should animate via `::view-transition-old` and `::view-transition-new` (fade/slide) instead.
8. **Simplified View Transitions**: Use a unified Fade Out / Fade In sequence for all page transitions to ensure stability and prevent layout artifacts. Complex geometry morphing and layout stabilization logic (`waitForStableLayout`) have been removed to avoid timeouts and visual glitches.
   - Implementation: `startViewTransition(async () => { router.push(url); await waitForNavigation(); })`
   - Debug: Use `NEXT_PUBLIC_VT_DEBUG=true` to log pre/post heights and stabilization progress.
   - Trade-off: Adds up to ~700ms delay for pages with heavy late layout changes; tune timeout to balance smoothness vs. responsiveness.

### Example
```tsx
// In a component
import { startViewTransition } from '@/lib/animations/viewTransitions';

const toggleTheme = () => {
  void startViewTransition(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  });
};
```




## Server Component D1 Detection Pattern

Admin layouts that need to conditionally show D1 availability notices must be server components (not client components) to access getD1Binding(). When client-side interactivity is needed (e.g., usePathname for navigation), extract that logic to a separate client component. Pattern: 1) Server component layout calls getD1Binding() and passes isD1Available prop to D1UnavailableNotice, 2) Client navigation extracted to separate component (e.g., PricingNav.tsx), 3) D1UnavailableNotice receives server-computed availability. This matches the hero page pattern and ensures consistent D1 status across admin UI.

### Examples

- app/dashboard/pricing/layout.tsx - async server component with getD1Binding() check
- app/dashboard/pricing/PricingNav.tsx - 'use client' navigation component with usePathname()
- app/dashboard/hero/page.tsx - server component passing isD1Available to D1UnavailableNotice


## Price Breakdown Preview Panel

Admin pricing pages need to show how changes affect final estimates. Solution: Add a collapsible PriceBreakdownPreview panel to the pricing layout that displays live calculation breakdown (Size base × Style multiplier × Color multiplier = Final estimate) with percentage contribution visualization. Component receives all pricing data from server layout, manages selection state client-side, and shows visual bars for each multiplier's impact.

### Examples

- app/dashboard/pricing/layout.tsx - fetch getSizeCategories, getStyles, getColorProfiles and pass to PriceBreakdownPreview
- components/admin/PriceBreakdownPreview.tsx - client component with size/style/color selectors and breakdown display


## Glass Panel Admin Theme

Admin components now use the glass-panel mixin from _components.scss for visual consistency with the main site. The admin-card base class uses @include glass-panel which provides backdrop-filter blur, gradient backgrounds, and border styling. Admin-nav uses a lighter 6px blur to match the sticky-nav. Table headers within admin-cards use glass styling via CSS rules rather than inline classes.

### Examples

- app/styles/_admin.scss - .admin-card { @include glass-panel; }
- app/styles/_admin.scss - .admin-nav.admin-card { @include glass-panel(var(--glass-panel-bg), 6px); }
- app/styles/_admin.scss - .admin-card thead { background: var(--glass-panel-bg); backdrop-filter: blur(6px); }


## Hero Carousel Multi-Select Pattern

Hero carousel images stored as JSON array in D1 site_settings (key: hero_carousel_ids). Admin selects images via checkboxes, reorders with arrows. getHeroImages() filters R2 images by stored IDs, maintaining order. Backward compatible: null/empty = show all images. R2 is source of truth for images, D1 only stores selection preferences.

### Examples

- lib/hero-gallery.ts - getHeroCarouselIds() fetches JSON array from D1
- lib/admin-actions-pricing.ts - updateHeroCarouselAction saves ordered keys
- app/dashboard/hero/HeroClient.tsx - multi-select UI with order management


## Centralized Logging

Use lib/logger.ts createLogger(namespace) for module logging. Pre-configured: r2Logger, heroLogger, dbLogger, cacheLogger. Respects LOG_LEVEL env (debug/info/warn/error/silent). Default is 'warn' in production, 'info' in development.

### Examples

- import { r2Logger as log } from '../logger'; log.debug('msg'); log.warn('issue');
- LOG_LEVEL=debug npm run dev  # Show all logs


## Import Path Convention

Use @/ path aliases for cleaner imports. New code should always use @/ (e.g., `import { foo } from '@/lib/utils'`). Existing relative imports (../) are acceptable for 1-2 levels deep. Convert deep relative imports (3+ levels like ../../../../) to @/ when editing those files. Both styles work identically at runtime - no need for mass migration.

### Examples

- // New code - ALWAYS use @/
import { Inquiry } from '@/lib/schemas/inquiry';
import AdminNav from '@/components/admin/AdminNav';
- // Shallow relative - OK to leave
import { toPublicR2Url } from '../r2';
- // Deep relative - CONVERT when editing
// BAD: from '../../../../lib/admin-actions-pricing'
// GOOD: from '@/lib/admin-actions-pricing'


## Zod v4 API Changes

Zod v4 requires explicit key AND value schemas for records: `z.record(keySchema, valueSchema)`. Single-argument `z.record(valueSchema)` no longer works. Error messages use `{ error: "message" }` instead of plain string or `{ message: "..." }`.

### Examples

- // Zod v4 record (REQUIRED two args)
z.record(z.string(), z.string()) // ✅
z.record(z.string()) // ❌ ERROR
- // Zod v4 error messages
z.string().min(1, { error: 'Required' }) // preferred
z.string().min(1, 'Required') // deprecated but works
