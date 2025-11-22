# Active Context

## Current Focus
- [CONTEXT:2025-11-22] Database Integration - EXECUTING Phase 1: Pricing Data Migration (POC)
- Branch: db-migration
- Status: IN PROGRESS - Phase 0 COMPLETE, Phase 1 in progress
- Completed: D1 database created, KV namespace created, wrangler.toml updated, schema migrated, data seeded
- Current: Creating D1 client wrapper and updating pricing.ts with fallback logic
- Plan document: memory-bank/plan-database-migration-2025-11-22.md
- Next: Update PricingEstimator to use async data, add tests, validate POC
- [CONTEXT:2025-11-22] Previously: Animation Phase 2 complete on dev-test branch
- Performance: 283 tests passing, About 106KB, Gallery 103KB, build successful
- Next decision: Continue to Phase 3 (View Transitions API) or pause for production validation
- [CONTEXT:2025-11-22] Previously completed: Animation Phase 1 - CSS Micro-interactions (10 keyframes, 0KB bundle, ~1 hour)
- [CONTEXT:2025-11-20] Completed unification of glassmorphism styles across the application.
- Established `.glass-panel` and `.btn--glass` as the standard reusable classes for the "futuristic glass" aesthetic (Image 2).
- Refactored `PricingEstimator`, `PricingPage`, and `LoginForm` to use these unified classes.

## Recent Changes
- **Refactor**: Extracted `.hero-path-card` styles into a reusable `.glass-panel` class in `app/globals.scss`.
- **Refactor**: Created `.btn--glass` for consistent glass buttons.
- **Update**: Replaced ad-hoc Tailwind glass styles (`bg-white/10`, `backdrop-blur-lg`, etc.) with `.glass-panel` and `.btn--glass` in:
  - `components/PricingEstimator.tsx`
  - `app/pricing/page.tsx`
  - `components/admin/LoginForm.tsx`
- [CONTEXT:2025-11-20] Fixed regression where particle background was not visible.
  - Removed aggressive mobile check in `ParticlesBackground.tsx` (was disabling on <640px).
  - Reduced glass blur (`--glass-blur-md`) from 14px to 10px to improve visibility of particles behind glass panels.
  - Explicitly set `.site-content` background to transparent.
- [CONTEXT:2025-11-20] Completed comprehensive glassmorphism refactor across all pages.
  - Updated `app/globals.scss` to apply `.glass-panel` via `@extend` to:
    - `.service-explainer__card` (Home)
    - `.flash-pricing`, `.flash-card` (Flash)
    - `.custom-step`, `.custom-pricing__card`, `.custom-showcase__item` (Custom Design)
  - Removed opaque section backgrounds to reveal particles.
  - Refactored `app/about/page.tsx` and `app/contact/page.tsx` to use `.glass-panel`.

## Active Decisions
- **Design System**: Use global CSS classes (`.glass-panel`, `.btn--glass`) for complex visual effects like glassmorphism to ensure consistency, rather than repeating Tailwind utilities.
- **Aesthetic**: "Futuristic Glass" (Image 2) is the standard: high blur, saturation, contrast, layered gradients, and a highlight overlay.

## Current State
- Build passing.
- CSS unified for glass elements.

## Current Blockers

- None

## Todo
- [x] Unify Glassmorphism Styles
  - Refactor codebase to unify glassmorphism styles using a shared .glass-panel class based on the futuristic 'Image 2' design.
  - [x] Update .glass-panel to use richer background variables for dark mode to ensure visibility against dark body.
  - [x] Add subtle background gradient to .particles-wrapper to restore depth.
