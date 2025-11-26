# Active Context

## Current Goals
- [CONTEXT:2025-11-26] **Session Complete - Ready for Commit**
- All features implemented and tested
- Build passing, 459 tests passing
- Ready for git commit and push to origin/dev

## Current Focus
- [CONTEXT:2025-11-26] **Session work completed**:
  1. Price Breakdown Preview: ✅ COMPLETE (72 tests)
  2. Hero Carousel Multi-Select: ✅ COMPLETE  
  3. Glass Panel Admin Theme: ✅ COMPLETE
  4. Diagnostics Page Layout: ✅ Improved (2x2 grid)

## Recent Changes (2025-11-26)
- **Price Breakdown Preview**: lib/pricing-breakdown.ts, PriceBreakdownPreview.tsx, integrated into pricing layout
- **Hero Carousel**: Multi-select UI with order badges, reorder arrows, saves to D1 as JSON array
- **Glass Panel Theme**: Unified admin-card styling using glass-panel mixin
- **Diagnostics**: Better KV detection, improved 2x2 grid layout
- **Hero Admin**: Changed from D1 to R2 for image listing (R2 is source of truth)

## Active Decisions
- [DECISION:2025-11-26] Hero carousel: Store image keys as JSON array in site_settings (hero_carousel_ids)
- [DECISION:2025-11-26] Price breakdown: Collapsible panel in layout vs inline previews
- [DECISION:2025-11-26] Hero images: Read from R2 directly, D1 only for settings
- [DECISION:2025-11-25] Server actions over API routes for admin CRUD
- [DECISION:2025-11-25] Zod for form validation before D1 operations

## Current State
- **Branch**: `dev` (ahead of origin/dev by 1 commit)
- **Build**: ✅ Passing
- **Tests**: ✅ 459 tests passing (55 suites)
- **Uncommitted**: 15 modified files, 4 new files

## Current Blockers
- None - session work complete, ready for commit

## Next Steps
1. Commit and push changes
2. Test hero carousel in browser
3. Verify homepage reflects carousel selection
4. Consider E2E tests for new features

## Deferred / Upcoming
- D1 shim for local dev (Option B from research - evaluate after MVP)
- KV caching layer refinements (Phase 2 continuation)
- Animation Phase 4: Performance & A11y audit
- E2E tests for hero carousel and price breakdown

