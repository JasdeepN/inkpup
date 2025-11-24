# Active Context

## Current Focus
- [CONTEXT:2025-11-24] Database Migration (D1 + KV):
  - Plan adopted: `memory-bank/plan-database-migration-2025-11-24.md`.
  - Status: Phase 0 (Infra) and Phase 1 (Pricing POC) are implemented on `db-migration` branch.
  - Immediate Goal: Merge `db-migration` into `dev` to establish the D1 foundation.
  - Next: Proceed to Phase 2 (Gallery Metadata & KV Caching).
- [CONTEXT:2025-11-24] UI Polish: Updated Header navigation.
  - Added `active` class to current page link for better wayfinding.
  - Fixed vertical alignment of nav links relative to brand by removing `padding-bottom` and adjusting underline position.
- [CONTEXT:2025-11-24] ✅ COMPLETE: Animation Phase 3 - View Transitions API implementation
- Implemented full View Transitions API support with progressive enhancement.
- Key features: Page transitions (slide/fade), Gallery modal morphing, Theme toggle animation, Pricing estimator state transitions.
- Components delivered: A (Foundation), B (Page Nav), C (Gallery Modal), D (Image Expansion via Modal), E (State Transitions), F (Tests).
- Build status: Passing, 300 tests passing.
- Next focus: Review project status or move to next priority (e.g., SEO refinement or content updates).

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
