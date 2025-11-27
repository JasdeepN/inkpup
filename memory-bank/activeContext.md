# Active Context

## Current Goals

- [CONTEXT:2025-11-26] Planning: Dashboard Overhaul updated with Inquiry Inbox integration. Plan file: plan-dashboard-overhaul-2025-11-26.md. Ready for execution - ~2 hours estimated.

## Current Focus
- [CONTEXT:2025-11-26] **Unified Gallery View COMPLETE**:
  - Created `GallerySection.tsx` - collapsible category section
  - Created `GallerySectionList.tsx` - expand/collapse state manager
  - Updated gallery page to fetch all 5 categories in parallel
  - First section expanded by default, others collapsed
  - Each section has image grid + upload panel
  - **Status**: Ready for manual testing and commit

## Recently Completed
- [CONTEXT:2025-11-26] **Gallery/Uploads Merge - COMPLETE** ✅
  - Created `GalleryUploadPanel.tsx` - collapsible client component
  - Updated `/gallery` page with panel + pending jobs badge
  - `/uploads` now redirects to `/gallery`

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

