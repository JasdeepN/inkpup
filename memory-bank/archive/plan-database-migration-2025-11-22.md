# Database Integration - Task Breakdown and Action Plan

**Created:** 2025-11-22  
**Status:** PLANNING  
**Branch:** db-migration  
**Estimated Effort:** 4-6 person-days (POC: 1-2 days, Full: 3-4 additional days)

---

## 1. Define the Main Task

**Task:** Integrate Cloudflare D1 (SQLite) + KV to enable admin-editable pricing data and efficient R2 metadata caching

**User Problem Statement:**
- Repeated R2 listing calls are expensive and slow
- Pricing data (styles, sizes, colors) requires code deployment to update
- Hero image management is difficult without admin UI
- No centralized source of truth for gallery metadata

**Proposed Solution:**
- Cloudflare D1 for structured data (pricing, gallery metadata)
- Cloudflare KV for signed URL caching (1-hour TTL)
- Admin UI for CRUD operations on pricing and hero selection
- Incremental migration with JSON fallback for zero-downtime deployment

**Success Criteria:**
- ✅ Pricing data editable via admin UI without redeployment
- ✅ R2 list operations reduced by 80%+ via D1 indexing + KV caching
- ✅ Hero image selectable from admin dashboard
- ✅ Zero breaking changes to existing pricing/gallery components
- ✅ Performance maintained: Lighthouse ≥95, LCP <2.5s, CLS <0.1
- ✅ All existing tests pass (283+ tests)
- ✅ Production build successful with OpenNext

---

## 2. Break Down the Task

**Major Components or Phases:**

### Phase 0: Infrastructure Setup (Prerequisites)
- Configure D1 database bindings
- Configure KV namespace bindings
- Update GitHub Actions secrets
- Create migration tooling

### Phase 1: Pricing Data Migration (POC)
- Design D1 schema for pricing tables
- Create migration scripts
- Update lib/pricing.ts with D1 integration
- Add fallback logic for graceful degradation
- Test PricingEstimator component
- Validate performance

### Phase 2: R2 Metadata Indexing + KV Caching
- Create gallery_images table in D1
- Add R2 upload/delete hooks to write to D1
- Implement KV caching for signed URLs
- Update gallery components to read from D1+KV
- Add cache invalidation logic

### Phase 3: Admin UI for Editing
- Create CRUD endpoints for pricing data
- Build admin forms for styles/colors/sizes
- Add hero image selection UI
- Implement optimistic updates
- Add validation and error handling

### Phase 4: Post-Ship Cleanup & Monitoring
- Remove legacy JSON fallback code (optional)
- Add D1 query performance monitoring
- Document schema and migration procedures
- Add data backup/restore procedures

---

## 3. Outline Actionable Steps for Each Component

### Phase 0: Infrastructure Setup

**0.1 Configure D1 Database**
- Create local D1 database: `wrangler d1 create inkpup-db`
- Add D1 binding to `wrangler.toml` under `[[d1_databases]]`
- Configure environment-specific bindings (dev/production)
- Create remote D1 database: `wrangler d1 create inkpup-db --env production`

**0.2 Configure KV Namespace**
- Create local KV namespace: `wrangler kv:namespace create CACHE`
- Add KV binding to `wrangler.toml` under `[[kv_namespaces]]`
- Configure environment-specific bindings (dev/production)
- Create remote KV namespace: `wrangler kv:namespace create CACHE --env production`

**0.3 Update GitHub Actions Secrets**
- Add `D1_DATABASE_ID` to GitHub environment secrets (dev/production)
- Add `KV_NAMESPACE_ID` to GitHub environment secrets (dev/production)
- Update `.github/workflows/deploy-*.yml` to pass new secrets

**0.4 Create Migration Tooling**
- Create `scripts/db/` directory structure
- Add `scripts/db/migrate.ts` for running migrations
- Add `scripts/db/seed.ts` for initial data seeding
- Add `scripts/db/rollback.ts` for migration rollback

---

### Phase 1: Pricing Data Migration (POC)

**1.1 Design D1 Schema**
- Create `scripts/db/migrations/001_create_pricing_tables.sql`
- Define `size_categories` table (id, label, min_price, max_price, description, sort_order)
- Define `styles` table (id, label, multiplier, description, recommended_color_type, sort_order)
- Define `color_profiles` table (id, label, multiplier, description, sort_order)
- Add indexes on frequently queried columns

**1.2 Create Initial Migration**
- Write SQL CREATE TABLE statements
- Add migration metadata tracking table
- Test migration locally: `wrangler d1 execute inkpup-db --file=migrations/001_create_pricing_tables.sql`
- Verify schema: `wrangler d1 execute inkpup-db --command="SELECT * FROM sqlite_master WHERE type='table'"`

**1.3 Seed Pricing Data from JSON**
- Parse `data/pricing.json` structure
- Generate INSERT statements for size_categories (6 rows)
- Generate INSERT statements for styles (16 rows)
- Generate INSERT statements for color_profiles (4 rows)
- Create `scripts/db/migrations/002_seed_pricing_data.sql`
- Execute seed migration locally

**1.4 Create Database Client Module**
- Create `lib/db/d1.ts` for D1 client wrapper
- Add TypeScript types for pricing tables (match existing PricingDataShape)
- Add query functions: `getSizeCategories()`, `getStyles()`, `getColorProfiles()`
- Add error handling and logging
- Support both runtime binding and local D1 emulation

**1.5 Update Pricing Logic with Fallback**
- Update `lib/pricing.ts` to check for D1 binding availability
- Add `getPricingData()` function that tries D1 first, falls back to JSON
- Maintain backward compatibility with existing `estimatePriceRange()` signature
- Add environment variable `ENABLE_D1_PRICING` for feature flag
- Preserve existing tuple types and multiplier logic

**1.6 Add D1 Type Definitions**
- Create `types/cloudflare.d.ts` for D1Binding interface
- Add D1 bindings to `next-env.d.ts` for runtime access
- Update TypeScript config if needed for Cloudflare types
- Ensure server components can access D1 via `process.env`

**1.7 Test POC Implementation**
- Update `lib/pricing.test.ts` to test D1 integration
- Mock D1 binding in Jest environment
- Test fallback behavior when D1 unavailable
- Test all pricing calculation logic unchanged
- Run full test suite: `npm test -- --forceExit`
- Verify PricingEstimator component rendering

**1.8 Validate POC Performance**
- Run local dev server: `npm run dev`
- Test `/pricing` page load time
- Check D1 query performance in Wrangler logs
- Compare bundle size before/after (expect no change)
- Test production build: `npm run build`
- Deploy to dev environment and validate

---

### Phase 2: R2 Metadata Indexing + KV Caching

**2.1 Design Gallery Schema**
- Add to `scripts/db/migrations/003_create_gallery_tables.sql`
- Define `gallery_images` table:
  - id (TEXT PRIMARY KEY) - R2 object key
  - category (TEXT) - flash/portfolio/hero
  - alt_text (TEXT)
  - width (INTEGER)
  - height (INTEGER)
  - format (TEXT) - jpg/png/webp
  - size_bytes (INTEGER)
  - uploaded_at (TEXT ISO8601)
  - updated_at (TEXT ISO8601)
- Add indexes on category, uploaded_at
- Create migration and test locally

**2.2 Add R2 Upload Hooks**
- Update `lib/admin-actions.ts` upload functions
- After successful R2 PUT, write metadata to D1
- Extract EXIF width/height if available
- Store format and size from upload
- Add transaction rollback if D1 write fails
- Update upload tests to verify D1 insertion

**2.3 Add R2 Delete Hooks**
- Update `lib/admin-actions.ts` delete functions
- After successful R2 DELETE, remove from D1
- Add soft-delete option (mark deleted_at instead of removing)
- Update delete tests to verify D1 removal

**2.4 Implement KV URL Caching**
- Create `lib/cache/kv.ts` wrapper module
- Add `getCachedSignedUrl(key: string)` function
- Add `setCachedSignedUrl(key: string, url: string, ttl: number)` function
- Default TTL: 3600 seconds (1 hour)
- Handle KV unavailability gracefully (fall through to R2)

**2.5 Update Gallery Components**
- Update `lib/r2-server.ts` to query D1 for gallery list
- Replace R2 list operations with D1 SELECT queries
- Add KV check before generating signed URLs
- Update `components/Gallery.tsx` to use D1-backed data
- Update `components/GalleryView.tsx` similarly
- Preserve existing Gallery component API (no breaking changes)

**2.6 Add Cache Invalidation**
- On image upload: invalidate KV cache for that key
- On image delete: invalidate KV cache for that key
- On category change: invalidate all KV cache for category
- Add admin UI button to "Clear All Cache" (dev/testing)

**2.7 Test R2 Integration**
- Mock D1 and KV in Jest environment
- Test upload flow writes to D1
- Test delete flow removes from D1
- Test gallery rendering uses D1 data
- Test KV cache hit/miss scenarios
- Test fallback when D1/KV unavailable
- Run full test suite

**2.8 Performance Validation**
- Measure gallery page load time before/after
- Count R2 list operations (expect 80%+ reduction)
- Measure KV cache hit rate
- Test with 50+ images in gallery
- Verify no Lighthouse regression

---

### Phase 3: Admin UI for Editing

**3.1 Create Pricing CRUD Endpoints**
- Create `app/api/admin/pricing/styles/route.ts`
- Add GET handler: list all styles from D1
- Add POST handler: create new style
- Add PUT handler: update existing style
- Add DELETE handler: remove style
- Add validation (Zod schema)
- Repeat for `sizes/route.ts` and `colors/route.ts`

**3.2 Create Server Actions for Pricing**
- Add `lib/admin-actions-pricing.ts` module
- Add `createStyle(data)`, `updateStyle(id, data)`, `deleteStyle(id)`
- Add `createSize(data)`, `updateSize(id, data)`, `deleteSize(id)`
- Add `createColor(data)`, `updateColor(id, data)`, `deleteColor(id)`
- Add input validation and error handling
- Add optimistic update support

**3.3 Build Styles Management UI**
- Create `app/dashboard/pricing/styles/page.tsx`
- Display table of current styles from D1
- Add "Add Style" button → form modal
- Add inline edit for each row
- Add delete confirmation dialog
- Show multiplier, description, recommended_color_type
- Add sort order drag-and-drop (optional)

**3.4 Build Sizes Management UI**
- Create `app/dashboard/pricing/sizes/page.tsx`
- Display table of size categories
- Add CRUD forms for min/max prices
- Show price ranges with currency formatting
- Add description field for customer guidance

**3.5 Build Colors Management UI**
- Create `app/dashboard/pricing/colors/page.tsx`
- Display table of color profiles
- Add CRUD forms for multipliers
- Show example pricing calculations
- Add reorder functionality

**3.6 Create Hero Image Selector**
- Create `app/dashboard/hero/page.tsx`
- Query `gallery_images` WHERE category='hero'
- Display grid of available hero images
- Add "Set as Active Hero" button
- Store selection in `site_settings` table (new)
- Update home page to read hero from D1
- Add fallback to existing hero-gallery.ts

**3.7 Add Validation & Error Handling**
- Validate multiplier ranges (0.8 - 2.0)
- Validate price ranges (min < max)
- Prevent duplicate IDs
- Show toast notifications for success/error
- Add loading states during mutations
- Implement optimistic UI updates

**3.8 Test Admin UI**
- Write Playwright tests for CRUD flows
- Test form validation (invalid inputs)
- Test optimistic updates
- Test error handling (network failures)
- Test concurrent edits (race conditions)
- Verify pricing estimator reflects changes immediately

---

### Phase 4: Post-Ship Cleanup & Monitoring

**4.1 Add D1 Query Monitoring**
- Create `lib/db/metrics.ts` for query logging
- Track query execution times
- Track query failure rates
- Send metrics to Cloudflare Analytics (optional)
- Add admin dashboard widget for DB health

**4.2 Document Schema & Migrations**
- Create `docs/database-schema.md`
- Document all tables, columns, indexes
- Add ER diagram (mermaid)
- Document migration procedures
- Add rollback procedures
- Document backup/restore process

**4.3 Add Data Backup Procedures**
- Create `scripts/db/backup.ts`
- Export D1 data to JSON files
- Store backups in R2 or GitHub
- Add cron job for daily backups (optional)
- Document restore procedure

**4.4 Remove Legacy Fallback Code (Optional)**
- Remove JSON file reading from `lib/pricing.ts`
- Remove `data/pricing.json` (archive to `archive/`)
- Update tests to remove fallback scenarios
- Update documentation to reflect D1-only mode

**4.5 Add Migration Rollback Support**
- Track applied migrations in `schema_migrations` table
- Add `scripts/db/rollback.ts` to undo migrations
- Test rollback procedures on dev environment
- Document rollback steps in runbook

**4.6 Performance Optimization**
- Add database indexes based on query patterns
- Optimize N+1 queries (batch reads)
- Add query result caching (short-lived)
- Profile slow queries in production
- Consider D1 read replicas if needed

---

## 4. Assign #todos

### Phase 0: Infrastructure Setup
- #todo Create local D1 database and add binding to wrangler.toml
- #todo Create local KV namespace and add binding to wrangler.toml
- #todo Create remote D1 database for production environment
- #todo Create remote KV namespace for production environment
- #todo Add D1_DATABASE_ID and KV_NAMESPACE_ID to GitHub secrets (dev/prod)
- #todo Update .github/workflows/deploy-dev.yml to include new secrets
- #todo Update .github/workflows/deploy-production.yml to include new secrets
- #todo Create scripts/db/ directory and migration tooling

### Phase 1: Pricing Data Migration (POC)
- #todo Create scripts/db/migrations/001_create_pricing_tables.sql
- #todo Define size_categories table schema with indexes
- #todo Define styles table schema with indexes
- #todo Define color_profiles table schema with indexes
- #todo Test migration locally with wrangler d1 execute
- #todo Create scripts/db/migrations/002_seed_pricing_data.sql
- #todo Parse data/pricing.json and generate INSERT statements
- #todo Execute seed migration and verify data
- #todo Create lib/db/d1.ts client wrapper module
- #todo Add TypeScript types for D1 bindings
- #todo Implement getSizeCategories(), getStyles(), getColorProfiles() functions
- #todo Update lib/pricing.ts with getPricingData() fallback logic
- #todo Add ENABLE_D1_PRICING feature flag support
- #todo Create types/cloudflare.d.ts for D1 type definitions
- #todo Update lib/pricing.test.ts with D1 mocking
- #todo Test fallback behavior when D1 unavailable
- #todo Run full test suite and verify all 283+ tests pass
- #todo Test /pricing page in local dev environment
- #todo Measure D1 query performance
- #todo Build production bundle and verify bundle size unchanged
- #todo Deploy POC to dev environment and validate

### Phase 2: R2 Metadata Indexing + KV Caching
- #todo Create scripts/db/migrations/003_create_gallery_tables.sql
- #todo Define gallery_images table schema with indexes
- #todo Execute migration and verify schema
- #todo Update lib/admin-actions.ts to write to D1 on R2 upload
- #todo Add transaction rollback if D1 write fails
- #todo Update lib/admin-actions.ts to remove from D1 on R2 delete
- #todo Create lib/cache/kv.ts wrapper module
- #todo Implement getCachedSignedUrl() with 1-hour TTL
- #todo Implement setCachedSignedUrl() with graceful fallback
- #todo Update lib/r2-server.ts to query D1 instead of R2 list
- #todo Update components/Gallery.tsx to use D1-backed data
- #todo Add KV check before generating signed URLs
- #todo Implement cache invalidation on upload/delete
- #todo Add "Clear All Cache" admin UI button
- #todo Mock D1 and KV in Jest for upload/delete tests
- #todo Test gallery rendering with D1 data
- #todo Test KV cache hit/miss scenarios
- #todo Measure R2 list operation reduction (expect 80%+)
- #todo Validate no Lighthouse performance regression

### Phase 3: Admin UI for Editing
- #todo Create app/api/admin/pricing/styles/route.ts with CRUD handlers
- #todo Create app/api/admin/pricing/sizes/route.ts with CRUD handlers
- #todo Create app/api/admin/pricing/colors/route.ts with CRUD handlers
- #todo Add Zod validation schemas for pricing data
- #todo Create lib/admin-actions-pricing.ts server actions
- #todo Implement createStyle(), updateStyle(), deleteStyle()
- #todo Implement createSize(), updateSize(), deleteSize()
- #todo Implement createColor(), updateColor(), deleteColor()
- #todo Create app/dashboard/pricing/styles/page.tsx UI
- #todo Build styles table with inline edit
- #todo Add "Add Style" modal form
- #todo Add delete confirmation dialog
- #todo Create app/dashboard/pricing/sizes/page.tsx UI
- #todo Create app/dashboard/pricing/colors/page.tsx UI
- #todo Create site_settings table for hero image selection
- #todo Create app/dashboard/hero/page.tsx UI
- #todo Query gallery_images WHERE category='hero'
- #todo Add "Set as Active Hero" button
- #todo Update home page to read hero from D1
- #todo Add form validation for multipliers and price ranges
- #todo Implement optimistic UI updates
- #todo Add toast notifications for success/error
- #todo Write Playwright tests for CRUD flows
- #todo Test form validation with invalid inputs
- #todo Test concurrent edit race conditions

### Phase 4: Post-Ship Cleanup & Monitoring
- #todo Create lib/db/metrics.ts for query monitoring
- #todo Track query execution times and failure rates
- #todo Create docs/database-schema.md documentation
- #todo Add ER diagram with mermaid
- #todo Document migration and rollback procedures
- #todo Create scripts/db/backup.ts for data export
- #todo Document restore procedure
- #todo (Optional) Remove data/pricing.json and fallback code
- #todo Add schema_migrations tracking table
- #todo Create scripts/db/rollback.ts for migration undo
- #todo Test rollback on dev environment
- #todo Add database indexes based on query patterns
- #todo Profile slow queries in production

---

## 5. Utilize Tools

### Development Tools
- **Wrangler CLI**: D1/KV creation, migrations, local testing
  - `wrangler d1 create <name>`, `wrangler d1 execute`, `wrangler kv:namespace create`
- **VS Code SQLite Extension**: Schema inspection and query testing
- **D1 Console**: Web-based query interface in Cloudflare dashboard

### Database Tools
- **D1 Migrations**: SQL files in `scripts/db/migrations/`
- **Migration Runner**: Custom TypeScript script using D1 API
- **Seed Scripts**: TypeScript to parse JSON → SQL INSERT

### Testing Tools
- **Jest**: Unit tests with D1/KV mocking
  - Mock D1 binding: `globalThis.D1 = mockD1()`
  - Mock KV binding: `globalThis.KV = mockKV()`
- **Playwright**: E2E tests for admin UI CRUD flows
- **Lighthouse**: Performance validation (≥95 score)

### Code Quality Tools
- **TypeScript**: Type safety for D1 queries
- **ESLint**: Linting for new database code
- **Prettier**: Code formatting
- **Zod**: Runtime validation for admin inputs

### Deployment Tools
- **GitHub Actions**: Automated migrations on deploy
- **Wrangler**: D1/KV environment variable injection
- **OpenNext**: Next.js → Cloudflare Workers bundling

### Monitoring Tools
- **Cloudflare Analytics**: D1 query performance
- **Wrangler Tail**: Real-time log streaming
- **Custom Metrics**: lib/db/metrics.ts for query tracking

---

## 6. Save to Memory Management

**Use #MemoryManagement to save all task data:**

### Initial Plan Documentation
- ✅ Save complete plan to `memory-bank/plan-database-migration-2025-11-22.md`
- Use `#MemoryManagement updateProgress` to track POC vs Full integration decision
- Use `#MemoryManagement logDecision` for D1 vs other database choice

### Phase Completion Tracking
- After Phase 0: Log infrastructure setup completion with binding IDs
- After Phase 1: Log POC validation results (performance, test pass rate)
- After Phase 2: Log R2 operation reduction metrics
- After Phase 3: Log admin UI completion and user feedback
- After Phase 4: Log cleanup completion and monitoring setup

### Active Context Updates
- Use `#MemoryManagement updateContext` when starting each phase
- Document current focus: "Phase 1 POC - Pricing Data Migration"
- Update with blockers or decision points

### System Patterns Documentation
- Use `#MemoryManagement updateSystemPatterns` for:
  - D1 client wrapper pattern (lib/db/d1.ts)
  - KV caching pattern (lib/cache/kv.ts)
  - Fallback strategy pattern (D1 → JSON)
  - Admin CRUD pattern (server actions + optimistic UI)

### Decision Logging
- Log choice of D1 over Postgres/MySQL
- Log choice of KV for URL caching over D1 alone
- Log POC approach vs big-bang migration
- Log schema design choices (normalization level, indexes)
- Log admin UI framework choices

**Memory Management Actions:**
- `#MemoryManagement updateProgress` → Mark POC complete, track metrics
- `#MemoryManagement logDecision` → Record all architectural choices
- `#MemoryManagement updateContext` → Set phase focus and blockers
- `#MemoryManagement updateSystemPatterns` → Document reusable patterns
- `#MemoryManagement updateProductContext` → Update tech stack (add D1/KV)

**Do NOT modify Plan.prompt.md** - it is a template for creating plans, not for storing them.

---

## 7. Review and Adjust

**Review Checkpoints:**

### After Phase 0 (Infrastructure)
- ✅ Verify D1 database created in both dev and production
- ✅ Verify KV namespace created in both environments
- ✅ Confirm GitHub secrets configured
- ✅ Test local migration tooling works
- **Decision Point**: Proceed to POC or block on infra issues?

### After Phase 1 (POC)
- ✅ Verify pricing data in D1 matches pricing.json
- ✅ Confirm PricingEstimator component still works
- ✅ Measure query performance (expect <50ms for pricing data)
- ✅ Validate all 283+ tests pass
- ✅ Check production build successful
- **Decision Point**: Proceed to full integration or iterate on POC?

### After Phase 2 (R2 Integration)
- ✅ Verify R2 uploads write to D1
- ✅ Measure R2 list operation reduction (target 80%+)
- ✅ Test KV cache hit rate (target 70%+ after warmup)
- ✅ Validate gallery components work with D1 data
- ✅ Check Lighthouse score maintained (≥95)
- **Decision Point**: Proceed to admin UI or optimize caching?

### After Phase 3 (Admin UI)
- ✅ Test all CRUD operations work
- ✅ Verify pricing estimator reflects changes immediately
- ✅ Test concurrent edits don't corrupt data
- ✅ Validate hero image selection works
- ✅ Measure admin UI response times (<200ms)
- **Decision Point**: Ship to production or add more features?

### After Phase 4 (Cleanup)
- ✅ Verify monitoring dashboards functional
- ✅ Test backup/restore procedures
- ✅ Confirm documentation complete
- ✅ Validate migration rollback works
- **Decision Point**: Remove legacy fallback code?

**Review Checklist:**
- Verify all tasks saved to #MemoryManagement
- Confirm #todos tracked in progress system
- Ensure active context reflects current phase
- Document any blockers or decisions
- Update effort estimates based on actual time

**Adjustment Triggers:**
- D1 query performance >100ms → Add indexes or caching
- Test failures → Roll back and fix before proceeding
- Bundle size increase >10KB → Investigate lazy loading
- Lighthouse score drop >5 points → Profile and optimize
- User feedback on admin UI → Iterate on UX

---

## 8. Risk Mitigation & Rollback

### Risks and Mitigations

**Risk 1: D1 Unavailable in Production**
- **Mitigation**: Maintain JSON fallback for pricing data
- **Detection**: Monitor D1 binding availability in middleware
- **Rollback**: Feature flag `ENABLE_D1_PRICING=false` → use JSON

**Risk 2: Migration Data Loss**
- **Mitigation**: Backup data/pricing.json before migration
- **Detection**: Compare D1 row counts with JSON array lengths
- **Rollback**: Restore from backup, re-run seed script

**Risk 3: Performance Regression**
- **Mitigation**: Measure baseline before migration, add indexes
- **Detection**: Lighthouse CI checks, Cloudflare Analytics
- **Rollback**: Disable D1 queries, revert to R2 list operations

**Risk 4: Admin UI Bugs Corrupt Data**
- **Mitigation**: Input validation, transaction rollbacks, audit logs
- **Detection**: Monitor D1 write failures, test CRUD thoroughly
- **Rollback**: Restore from daily backup, fix bug, redeploy

**Risk 5: KV Cache Stale Data**
- **Mitigation**: 1-hour TTL, cache invalidation on upload/delete
- **Detection**: User reports wrong images, manual cache inspection
- **Rollback**: Clear all KV cache, increase invalidation coverage

### Rollback Procedures

**Phase 1 Rollback (POC)**
1. Set `ENABLE_D1_PRICING=false` in environment variables
2. Redeploy (falls back to JSON automatically)
3. No data loss - JSON files unchanged

**Phase 2 Rollback (R2 Integration)**
1. Comment out D1 writes in lib/admin-actions.ts
2. Restore R2 list operations in lib/r2-server.ts
3. Clear KV cache: `wrangler kv:key delete --all`
4. Redeploy

**Phase 3 Rollback (Admin UI)**
1. Remove admin routes: app/dashboard/pricing/*
2. Restore read-only pricing (no impact on frontend)
3. Redeploy without admin features

**Phase 4 Rollback (Cleanup)**
1. Restore JSON fallback code if removed
2. Restore data/pricing.json from archive
3. Re-enable legacy code paths

---

## 9. Success Criteria by Phase

### Phase 0 Success Criteria
- ✅ `wrangler d1 list` shows inkpup-db in dev and production
- ✅ `wrangler kv:namespace list` shows CACHE namespace in both envs
- ✅ GitHub Actions logs show D1_DATABASE_ID and KV_NAMESPACE_ID set
- ✅ `scripts/db/migrate.ts` runs without errors locally

### Phase 1 Success Criteria
- ✅ D1 contains 6 size categories, 16 styles, 4 color profiles
- ✅ `lib/pricing.ts` queries D1 successfully
- ✅ `/pricing` page renders with D1 data
- ✅ All 283+ tests pass with D1 mocking
- ✅ Production build completes successfully
- ✅ D1 query time <50ms (measured via Wrangler logs)

### Phase 2 Success Criteria
- ✅ R2 upload writes to gallery_images table
- ✅ R2 list operations reduced by ≥80% (baseline vs after)
- ✅ KV cache hit rate ≥70% after warmup
- ✅ Gallery page load time unchanged or improved
- ✅ Lighthouse Performance score ≥95
- ✅ All gallery tests pass with D1/KV mocking

### Phase 3 Success Criteria
- ✅ Admin can create/edit/delete styles via UI
- ✅ Admin can create/edit/delete sizes via UI
- ✅ Admin can create/edit/delete color profiles via UI
- ✅ Admin can select hero image from gallery
- ✅ Pricing estimator reflects changes within 5 seconds
- ✅ Form validation prevents invalid data (multiplier <0.5 rejected)
- ✅ Playwright tests cover all CRUD flows
- ✅ Admin UI response time <200ms

### Phase 4 Success Criteria
- ✅ Database schema documented in docs/database-schema.md
- ✅ Backup script exports D1 to JSON successfully
- ✅ Rollback script can undo last migration
- ✅ Monitoring dashboard shows D1 query metrics
- ✅ Daily backups running (if implemented)
- ✅ Team trained on migration procedures

---

## 10. Estimated Effort & Timeline

### Phase 0: Infrastructure Setup
- **Effort**: 2-3 hours
- **Tasks**: 8 todos
- **Dependencies**: Cloudflare account access, GitHub secrets access
- **Parallel Work**: D1 and KV can be set up simultaneously

### Phase 1: Pricing Data Migration (POC)
- **Effort**: 8-12 hours (1-2 days)
- **Tasks**: 20 todos
- **Dependencies**: Phase 0 complete
- **Validation**: Full test suite, dev deployment
- **Checkpoint**: Decision to proceed to full integration

### Phase 2: R2 Metadata Indexing + KV Caching
- **Effort**: 12-16 hours (1.5-2 days)
- **Tasks**: 18 todos
- **Dependencies**: Phase 1 complete
- **Validation**: Performance metrics, cache hit rate

### Phase 3: Admin UI for Editing
- **Effort**: 16-20 hours (2-2.5 days)
- **Tasks**: 24 todos
- **Dependencies**: Phase 2 complete
- **Validation**: Playwright E2E tests, manual QA

### Phase 4: Post-Ship Cleanup & Monitoring
- **Effort**: 4-6 hours
- **Tasks**: 12 todos
- **Dependencies**: Phase 3 deployed to production
- **Validation**: Documentation review, backup test

### Total Effort Estimates
- **POC Only (Phase 0 + 1)**: 10-15 hours (~1-2 days)
- **Full Integration (Phase 0-3)**: 38-51 hours (~4-6 days)
- **Complete with Cleanup (Phase 0-4)**: 42-57 hours (~5-7 days)

### Timeline with Dependencies
```
Week 1:
  Mon: Phase 0 (Infrastructure) ✅
  Tue-Wed: Phase 1 (POC) → CHECKPOINT
  Thu-Fri: Phase 2 (R2 Integration) if approved

Week 2:
  Mon-Wed: Phase 3 (Admin UI)
  Thu: Testing & QA
  Fri: Production deployment

Week 3:
  Mon: Phase 4 (Cleanup & Monitoring)
```

---

## 11. Next Steps & Decision Points

**Immediate Next Action:**
User must decide: POC or Full Integration?

### Option A: POC First (Recommended)
**Scope**: Phase 0 + Phase 1 only  
**Effort**: 1-2 days  
**Deliverable**: Pricing data in D1, PricingEstimator reads from DB  
**Value**: Validates D1 integration, minimal risk  
**Decision Point**: After POC success, evaluate Phases 2-3

### Option B: Full Integration
**Scope**: Phases 0-3  
**Effort**: 4-6 days  
**Deliverable**: Complete admin-editable system with R2 caching  
**Value**: Full feature set, production-ready  
**Risk**: Larger scope, more integration points

### Option C: Defer Database
**Action**: Close db-migration branch, return to dev-test  
**Rationale**: Pricing data changes infrequently, R2 costs manageable  
**Future**: Revisit when pricing updates become weekly

**User Question:**
> Which do you prefer next: a POC migration (D1 schema + PricingEstimator), or the full integration (DB, KV caching, R2 indexing, admin UI)?

**Context for Decision:**
- Current pricing.json has 26 total items (6 sizes + 16 styles + 4 colors)
- Pricing rarely changes (last update: 2025-11-22 for styles array)
- R2 list calls happen on every gallery page load (current cost: ~$0.01/1000 requests)
- Admin editing would enable A/B testing pricing multipliers
- Hero image changes happen ~monthly currently

---

**Plan Status:** AWAITING USER DECISION  
**Created:** 2025-11-22  
**Last Updated:** 2025-11-22  
**Author:** Memory-Deep-Thinking-Mode Agent  
**Branch:** db-migration

