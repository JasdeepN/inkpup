# Progress (Updated: 2025-11-25)

## Done

### UI/UX & Design System
- [x] Glassmorphism Design System Implementation
  - Created `.glass-panel` and `.btn--glass` utilities.
  - Applied to Hero, Pricing, Flash, Custom Design, About, and Contact pages.
  - Fixed particle background visibility behind glass.
- [x] SCSS Modularization
  - Split `globals.scss` into `_variables`, `_animations`, `_base`, `_buttons`, `_forms`, `_layout`, `_components`, `_pages`.
  - Migrated to `@use`/`@forward` syntax.
- [x] Animation Phase 1: CSS Micro-interactions
  - Implemented 10+ GPU-accelerated keyframes.
  - Applied to buttons, inputs, navigation, and cards.
- [x] Animation Phase 3: View Transitions
  - Implemented View Transitions API for page navigation.
  - Added `TransitionLink` and `PageTransitionWrapper`.
  - Enabled gallery modal morphing and theme toggle transitions.

### Database Migration (Cloudflare D1 + KV)
- [x] Phase 0: Infrastructure Setup
  - Configured `wrangler.toml` with D1 and KV bindings.
  - Created migration scripts (`export-data.sh`, `import-data.sh`).
  - Added SQL migrations for pricing tables.
- [x] Phase 1: Pricing POC
   - [x] Phase 2 (Partial): Remote Gallery Table Creation
     - Manually applied gallery_images table on remote dev DB (migration version 3) due to wrangler uniqueness constraint.
     - Verified empty state then inserted sample row `test1`.
     - Added migrations_dir for production in wrangler.toml for future apply.
     - Decision logged: manual migration fallback strategy & production migrations_dir addition.
  - Implemented `lib/db/d1.ts` client.
  - Created `getPricingData` with D1-first, JSON-fallback strategy.
  - Added `ENABLE_D1_PRICING` feature flag.
  - Created `app/test-d1/page.tsx` for verification.
  - Verified `/test-d1` endpoint (bypassed middleware).

### Infrastructure & DevOps
- [x] CI/CD Pipeline
  - Added Playwright E2E tests to deploy workflow.
  - Configured environment secrets for admin credentials.
- [x] Admin Portal Refactor
  - Moved to root-level routes (`/dashboard`, `/gallery`, `/uploads`).
  - Implemented server action authentication.

## In Progress

- [ ] Database Phase 2: Gallery Metadata & KV Caching (remaining tasks)
  - [ ] Implement KV caching layer `lib/cache/kv.ts` for gallery listing (set/get/delete + prefixing).
  - [ ] Add D1 → KV sync in upload queue after successful insert.

## Recently Completed (2025-11-25)

### Phase 4: Database & UI Integration (COMPLETED)
- [x] Created `004_create_site_settings.sql` migration with key/value/updated_at schema
- [x] Fixed wrangler d1_migrations tracking (seeded existing migrations 1-3)
- [x] Applied migration 004 to remote D1 via `wrangler d1 migrations apply`
- [x] Verified `site_settings` table created with `active_hero_id` row
- [x] Updated `app/dashboard/diagnostics/page.tsx`:
  - `checkD1Health()` now queries actual D1 via `getD1Binding()`
  - Shows "D1 (live)" source when connected, "JSON fallback" otherwise
  - Renamed from "Pricing Data" to "Cloudflare D1 Database"
- [x] Created `components/admin/D1UnavailableNotice.tsx` dismissible notice
- [x] Added D1 notice to `/dashboard/pricing/layout.tsx`
- [x] Added D1 notice to `/dashboard/hero/page.tsx` (server component)
- [x] Wired `lib/hero-gallery.ts` to D1:
  - Added `getActiveHeroId()` to read from site_settings
  - Added `prioritizeActiveHero()` to reorder images
  - Active hero image now shown first in carousel
- [x] Build verified - all changes compile correctly

### Phase 3: Admin UI for Pricing & Hero (COMPLETED)
- [x] Installed Zod for form validation
- [x] Created `lib/schemas/pricing.ts` with Zod schemas for styles/sizes/colors
- [x] Created `lib/admin-actions-pricing.ts` with server actions:
  - createStyleAction, updateStyleAction, deleteStyleAction
  - createSizeAction, updateSizeAction, deleteSizeAction
  - createColorAction, updateColorAction, deleteColorAction
  - getActiveHeroId, setActiveHeroAction
- [x] Updated `components/admin/AdminNav.tsx` with Pricing and Hero links
- [x] Created pricing layout with sub-navigation tabs
- [x] Created `/dashboard/pricing` overview page
- [x] Created `/dashboard/pricing/styles` with full CRUD UI
- [x] Created `/dashboard/pricing/sizes` with full CRUD UI
- [x] Created `/dashboard/pricing/colors` with full CRUD UI
- [x] Created `/dashboard/hero` for hero image selection
- [x] Build verified with all new routes working
  - [ ] Add KV invalidation after successful delete.
  - [ ] Refactor gallery listing to KV-first (fallback to D1).
  - [ ] Add metrics/logging for KV hit/miss & latency.
- [ ] Animation Phase 2: Scroll-Linked Animations
  - Implement Intersection Observer for section reveals.
  - Add parallax effects (deferred).

## Planned

- [ ] Database Phase 5: KV Caching Layer
  - [ ] Implement KV caching for pricing data
  - [ ] Add cache invalidation on pricing updates
  - [ ] Wire gallery listing to KV-first strategy
- [ ] Animation Phase 4: Performance & A11y
  - `prefers-reduced-motion` audit.
  - Performance profiling.

## Status
- **Branch**: `dev`
- **Build**: Passing
- **Tests**: Passing
