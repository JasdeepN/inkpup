# Progress (Updated: 2025-11-26)

## Done

### Session 2025-11-26
- Price Breakdown Preview feature (72 pricing-related tests)
  - lib/pricing-breakdown.ts with calculatePriceBreakdown and calculateContributions
  - PriceBreakdownPreview.tsx with collapsible panel, selectors, visual bars
  - Integrated into pricing layout with server-side data fetching
  - 30 unit tests + 21 component tests
- Hero Carousel Multi-Select feature
  - updateHeroCarouselAction saves ordered array of image keys to D1
  - getHeroImages filters by hero_carousel_ids setting
  - HeroClient UI with checkboxes, numbered order badges, reorder arrows
  - Backward compatible - null/empty means show all images
- Unified Glass Panel Admin Theme
  - admin-card now uses @include glass-panel(var(--glass-panel-bg), 4px)
  - Consistent table header styling via CSS rules
  - admin-nav uses matching glass styling
- Hero Admin Page changed from D1 to R2 for image listing (R2 is source of truth)
- Diagnostics Page improved layout (2x2 grid) and better KV binding detection
- Build passing, 459 tests passing (55 suites)

### Previous (2025-11-25)
- Fixed D1 database path mismatch (wrangler persist issue)
- Fixed React setState during render errors in all pricing forms
- Changed multiplier step from 0.1 to 0.01 for finer granularity
- Changed recommended_color_type from text input to dropdown from color_profiles
- Added server-side FK validation for recommended_color_type
- Created site_settings table for runtime configuration
- Admin pricing pages connected to D1

## Doing

(None - session complete)

## Next

- Commit and push to origin/dev
- Test hero carousel selection in browser
- Verify homepage reflects carousel selection
- Consider E2E tests for hero carousel and price breakdown features
