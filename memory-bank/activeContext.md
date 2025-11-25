# Active Context

## Current Focus
- [CONTEXT:2025-11-25] **Database Migration Phase 4 (Integration & Wiring)**:
  - **Status**: Planning complete. Ready for execution.
  - **Plan:** `memory-bank/plan-phase4-integration-2025-11-25.md`
  - **Goal**: Wire Admin UI to D1 for production, update diagnostics, create site_settings table.
  - **Next Immediate Task**: Create migration 004_create_site_settings.sql
- [CONTEXT:2025-11-25] **Phase 3 Complete**: Admin pricing UI and hero selector pages created.
  - Files: `/dashboard/pricing/styles|sizes|colors`, `/dashboard/hero`
  - Server actions: `lib/admin-actions-pricing.ts`
  - Schemas: `lib/schemas/pricing.ts` (Zod)

## Recent Changes
- Phase 3 Admin UI completed (2025-11-25): Pricing CRUD pages, Hero selector, Zod schemas, server actions
- Zod installed for form validation
- AdminNav updated with Pricing and Hero links
- Research brief created: `memory-bank/research-phase4-integration-2025-11-25.md`

## Active Decisions
- [DECISION:2025-11-25] Server actions over API routes for admin CRUD
- [DECISION:2025-11-25] Zod for form validation before D1 operations
- [DECISION:2025-11-25] site_settings table for runtime configuration (hero selection)
- Non-blocking D1 writes: Gallery flows don't hard-fail on D1 errors
- JSON fallback maintained for public pricing page

## Current State
- **Branch**: `dev`
- **Build**: Passing
- **Tests**: Passing
- **Remote D1**: size_categories (8), styles (16), color_profiles (5), gallery_images - all populated
- **Missing**: site_settings table

## Current Blockers
- site_settings table required for hero selector to work in production
- Admin pages show empty in local dev (D1 unavailable) - needs user messaging

## Todo (Phase 4 - Next 6)
- [ ] Create migration 004_create_site_settings.sql
- [ ] Apply migration 004 to remote D1 (wrangler d1 migrations apply)
- [ ] Update diagnostics page to check actual D1 health (not just JSON)
- [ ] Add "D1 unavailable locally" notice to admin pricing pages
- [ ] Wire hero-gallery.ts to read active_hero_id from site_settings
- [ ] Test admin pages in deployed Cloudflare Workers environment

## Deferred / Upcoming
- D1 shim for local dev (Option B from research - evaluate after MVP)
- KV caching layer refinements (Phase 2 continuation)
- Animation Phase 4: Performance & A11y audit

