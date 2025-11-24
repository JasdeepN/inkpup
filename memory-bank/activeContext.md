# Active Context

## Current Focus
- [CONTEXT:2025-11-24] ✅ COMPLETE: Animation Phase 3 - View Transitions API implementation
- Implemented full View Transitions API support with progressive enhancement.
- Key features: Page transitions (slide/fade), Gallery modal morphing, Theme toggle animation, Pricing estimator state transitions.
- Components delivered: A (Foundation), B (Page Nav), C (Gallery Modal), D (Image Expansion via Modal), E (State Transitions), F (Tests).
- Build status: Passing, 300 tests passing.
- Next focus: Review project status or move to next priority (e.g., SEO refinement or content updates).

## Recent Changes
- **Feature**: Added `PageTransitionWrapper` and `TransitionLink` for SPA-like page transitions.
- **Feature**: Integrated `startViewTransition` into `GalleryView` for smooth modal open/close.
- **Feature**: Animated Theme Toggle and Pricing Estimator state changes.
- **Refactor**: Removed `RevealOnScroll` from initial viewport elements (Hero, Page Titles) to prevent conflict with View Transitions (glitching/snapping).
- **Refactor**: Updated View Transitions to be sequential (Fade Out -> Fade In) to prevent text overlap on transparent backgrounds.
- **Fix**: Implemented `waitForNavigation` signal to ensure View Transitions wait for Next.js navigation to complete before capturing the new state. This fixes the "glitch" where the transition would happen on the old page content.
- **Fix**: Added `scrollbar-gutter: stable` to `html` to prevent layout shifts when the scrollbar disappears during transitions.
- **Refactor**: Disabled `::view-transition-group` animation (duration 0s) for page transitions to prevent layout morphing/jumping between pages of different heights.
- **Refactor**: Restructured `layout.tsx` so `PageTransitionWrapper` wraps a full-width `<main>` and the centered `.container` is nested, eliminating narrow snapshot artifacts.
- **Feature**: Added debug instrumentation (bounding rect logging) in `startViewTransition` when `NEXT_PUBLIC_VT_DEBUG=true`.
- **Feature**: Added debug CSS overrides via `html[data-vt-debug="true"]` to force pure fade transitions for isolation (removes scale/slide).
- **Fix**: Added `.page-transition-wrapper { width:100%; }` to guarantee full-width snapshot capture.
- **Feature**: Implemented simplified View Transitions using the `root` (viewport) transition instead of element-based transitions. This resolves the "tiny page" artifact by ensuring snapshots are always viewport-sized.
- **Refactor**: Removed `view-transition-name` from `PageTransitionWrapper` and updated CSS to target `::view-transition-group(root)`.
- **Fix**: Removed `transform: none` from `::view-transition-group(root)` and switched to simultaneous cross-fade (300ms) to resolve "snapping" artifacts caused by incorrect snapshot positioning and sequential fade delays.
- **Change**: Currently disabled stabilization wait inside `TransitionLink` (caused ViewTransition timeouts). Utility retained for future tuning.
- **Refactor**: Simplified page transitions across all routes to a single sequential fade (180ms out -> 180ms in) to reduce visual complexity while issues are investigated.
- **Fix**: Removed conditional style gating in `PageTransitionWrapper` to eliminate hydration mismatch warning; now always sets `view-transition-name` and uses `suppressHydrationWarning`.
- **Fix**: Resolved build issue by cleaning cache; verified `PageTransitionWrapper` integration.
- **Refactor**: Updated `layout.tsx` to include `PageTransitionWrapper`.
- **Refactor**: Updated `Header.tsx` and `Hero.tsx` to use `TransitionLink`.
- **Test**: Added unit tests for new components and verified build.
- [CONTEXT:2025-11-24] Cross-browser glassmorphism refinement completed for sticky navigation (reduced blur for particle clarity, Firefox-specific override, transparent wrapper). Monitoring visual consistency; potential future enhancement: optional particle overlay layer above nav for added depth without further blur reduction.
- [CONTEXT:2025-11-22] ✅ COMPLETE: Animation Phase 2 - Intersection Observer Scroll Effects
- All 6 components delivered: A (Foundation), C (Section Reveals), E (Gallery Stagger), D (Counters), F (Documentation), B (Parallax utilities for future use)
- Status: Phase 2 execution complete, ready for Phase 3 planning or other priorities
- Branch: dev
- Performance: 283 tests passing, About 106KB, Gallery 103KB, build successful
- Next decision: Evaluate timing for Phase 3 (View Transitions API) vs. additional particle visual polish
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
