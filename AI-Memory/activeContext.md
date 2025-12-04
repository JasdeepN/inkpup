# Active Context

## Current Goals

- [CONTEXT:2025-11-29] **EXECUTION COMPLETE: Portfolio Interactivity Enhancement**
- - All phases implemented successfully
- - Build passes, tests pass (64 Gallery tests, 3 portfolio tests)
- - Phase 1: RevealOnScroll fix, hover overlay, gradient glow, filter badges, micro-interactions
- - Phase 2: Keyboard nav (←→), swipe gestures, cursor spotlight, filter transitions
- - New file: lib/hooks/useCursorPosition.ts
- - Ready for browser testing and user feedback

## Current Focus
- [CONTEXT:2025-12-01] **Local Webhook Testing IMPLEMENTED** ✅:
  - Created mock fixture: tests/fixtures/resend-webhook-email-received.json
  - Created test script: scripts/test-webhook-local.sh (executable)
  - Added dev signature bypass to webhook route (NODE_ENV=development)
  - Created D1 seed script: scripts/db/seed-test-inquiry.sql
  - Documented in docs/local-webhook-testing.md
  - **Ready to test**: npm run dev → ./scripts/test-webhook-local.sh
  - **Next**: User validation, then commit

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
- [BLOCKER:2025-12-01] **Local webhook testing inefficient**: Deploying to dev for every test iteration kills productivity
  - Research complete: Hybrid approach (mock payloads + tunnel for validation)
  - Recommended: Mock fixtures for 95% of dev, cloudflared tunnel for final E2E
  - Implementation: Create test fixtures, add dev signature bypass, seed local D1
  - Next: Plan implementation (Plan.prompt.md) or execute directly

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

- [CONTEXT:2025-12-01] Memory Sync In Progress: structure/dependency/git review, documenting cursor spotlight pattern, updating progress & decisions, preparing checkpoint report.

[CONTEXT:2025-12-03]
[CONTEXT:2025-12-03] Planning DO real-time email updates. Created plan file at AI-Memory/plan-realtime-email-updates-DO-2025-12-03.md. Focus: separate realtime worker, DO WebSocket, no polling; service binding from main app; tests and pipeline.

[CONTEXT:2025-12-03]
[CONTEXT:2025-12-03] EXECUTING: DO Real-time Email Updates - Starting systematic implementation per plan. Critical path: 1) Create realtime worker, 2) Configure bindings, 3) Hook + UI wiring, 4) Webhook notify, 5) Tests, 6) Build & smoke.

[CONTEXT:2025-12-03]
[CONTEXT:2025-12-03] Implemented realtime integration: service binding configured (REALTIME), webhook now notifies realtime worker on inbound emails, client WebSocket hook added and wired into InquiryDetail for no-polling updates.

[CONTEXT:2025-12-03]
[CONTEXT:2025-01-06] Completed final todos for realtime email updates: Pipeline integration (cloudflare-reusable.yml updated to deploy realtime worker before main), E2E test (tests/e2e/realtime-updates.spec.ts), and documentation (workers/realtime/README.md + docs/local-webhook-testing.md). All 9 todos from plan-realtime-email-updates-DO-2025-12-03.md are complete. Feature ready for testing and deployment.

[CONTEXT:2025-12-04]
[CONTEXT:2025-12-03] **CHECKPOINT**: Completed DO-based realtime email updates feature. All 9 plan todos done. Implementation includes: separate realtime worker (workers/realtime/), service binding (REALTIME), WebSocket client hook, InquiryDetail wiring, webhook notification, CI pipeline integration, E2E tests, diagnostics health check, documentation. Ready for deployment and E2E validation.