# Active Context

## Current Focus
- [CONTEXT:2025-11-22] ✅ COMPLETE: Animation Phase 1 - CSS Micro-interactions
- Status: All 6 components implemented successfully in ~1 hour
- Results: 10 new keyframes, 6 SCSS files enhanced, 238 tests passing, 0KB bundle increase
- Files modified: _animations.scss, _buttons.scss, _forms.scss, _base.scss, _gallery.scss, _components.scss, _layout.scss, _variables.scss
- Next decision: Continue to Phase 2 (Intersection Observer) or stop here?
- Branch: dev-test (ready for review/merge)
- [CONTEXT:2025-11-22] Previously completed: ALL animation phase planning (196 tasks across 4 phases)
  - Phase 1: ✅ Complete (41 tasks, 1 hour actual vs 4-6 hour estimate)
  - Phase 2: Intersection Observer (47 tasks, 1-2 days, ≤2KB bundle)
  - Phase 3: View Transitions API (56 tasks, 2-3 days, ≤3KB bundle)
  - Phase 4: Advanced Polish (52 tasks, 2-3 days, ≤5KB bundle, optional)
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
