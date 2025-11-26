# Database Integration - Task Breakdown and Action Plan

**Created:** 2025-11-24
**Status:** ACTIVE
**Branch:** dev (merging from db-migration)
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
- [x] Create local D1 database and add binding to wrangler.toml
- [x] Create local KV namespace and add binding to wrangler.toml
- [x] Create remote D1 database for production environment
- [x] Create remote KV namespace for production environment
- [x] Add D1_DATABASE_ID and KV_NAMESPACE_ID to GitHub secrets (dev/prod)
- [x] Update .github/workflows/deploy-dev.yml to include new secrets
- [x] Update .github/workflows/deploy-production.yml to include new secrets
- [x] Create scripts/db/ directory and migration tooling

### Phase 1: Pricing Data Migration (POC)
- [x] Create scripts/db/migrations/001_create_pricing_tables.sql
- [x] Define size_categories table schema with indexes
- [x] Define styles table schema with indexes
- [x] Define color_profiles table schema with indexes
- [x] Test migration locally with wrangler d1 execute
- [x] Create scripts/db/migrations/002_seed_pricing_data.sql
- [x] Parse data/pricing.json and generate INSERT statements
- [x] Execute seed migration and verify data
- [x] Create lib/db/d1.ts client wrapper module
- [x] Add TypeScript types for D1 bindings
- [x] Implement getSizeCategories(), getStyles(), getColorProfiles() functions
- [x] Update lib/pricing.ts with getPricingData() fallback logic
- [x] Add ENABLE_D1_PRICING feature flag support
- [x] Create types/cloudflare.d.ts for D1 type definitions
- [x] Update lib/pricing.test.ts with D1 mocking
- [x] Test fallback behavior when D1 unavailable
- [x] Run full test suite and verify all 283+ tests pass
- [x] Test /pricing page in local dev environment
- [x] Measure D1 query performance
- [x] Build production bundle and verify bundle size unchanged
- [x] Deploy POC to dev environment and validate

### Phase 2: R2 Metadata Indexing + KV Caching
- [ ] Create scripts/db/migrations/003_create_gallery_tables.sql
- [ ] Define gallery_images table schema with indexes
- [ ] Execute migration and verify schema
- [ ] Update lib/admin-actions.ts to write to D1 on R2 upload
- [ ] Add transaction rollback if D1 write fails
- [ ] Update lib/admin-actions.ts to remove from D1 on R2 delete
- [ ] Create lib/cache/kv.ts wrapper module
- [ ] Implement getCachedSignedUrl() with 1-hour TTL
- [ ] Implement setCachedSignedUrl() with graceful fallback
- [ ] Update lib/r2-server.ts to query D1 instead of R2 list
- [ ] Update components/Gallery.tsx to use D1-backed data
- [ ] Add KV check before generating signed URLs
- [ ] Implement cache invalidation on upload/delete
- [ ] Add "Clear All Cache" admin UI button
- [ ] Mock D1 and KV in Jest for upload/delete tests
- [ ] Test gallery rendering with D1 data
- [ ] Test KV cache hit/miss scenarios
- [ ] Measure R2 list operation reduction (expect 80%+)
- [ ] Validate no Lighthouse performance regression

### Phase 3: Admin UI for Editing
- [ ] Create app/api/admin/pricing/styles/route.ts with CRUD handlers
- [ ] Create app/api/admin/pricing/sizes/route.ts with CRUD handlers
- [ ] Create app/api/admin/pricing/colors/route.ts with CRUD handlers
- [ ] Add Zod validation schemas for pricing data
- [ ] Create lib/admin-actions-pricing.ts server actions
- [ ] Implement createStyle(), updateStyle(), deleteStyle()
- [ ] Implement createSize(), updateSize(), deleteSize()
- [ ] Implement createColor(), updateColor(), deleteColor()
- [ ] Create app/dashboard/pricing/styles/page.tsx UI
- [ ] Build styles table with inline edit
- [ ] Add "Add Style" modal form
- [ ] Add delete confirmation dialog
- [ ] Create app/dashboard/pricing/sizes/page.tsx UI
- [ ] Create app/dashboard/pricing/colors/page.tsx UI
- [ ] Create site_settings table for hero image selection
- [ ] Create app/dashboard/hero/page.tsx UI
- [ ] Query gallery_images WHERE category='hero'
- [ ] Add "Set as Active Hero" button
- [ ] Update home page to read hero from D1
- [ ] Add form validation for multipliers and price ranges
- [ ] Implement optimistic UI updates
- [ ] Add toast notifications for success/error
- [ ] Write Playwright tests for CRUD flows
- [ ] Test form validation with invalid inputs
- [ ] Test concurrent edit race conditions

### Phase 4: Post-Ship Cleanup & Monitoring
- [ ] Create lib/db/metrics.ts for query monitoring
- [ ] Track query execution times and failure rates
- [ ] Create docs/database-schema.md documentation
- [ ] Add ER diagram with mermaid
- [ ] Document migration and rollback procedures
- [ ] Create scripts/db/backup.ts for data export
- [ ] Document restore procedure
- [ ] (Optional) Remove data/pricing.json and fallback code
- [ ] Add schema_migrations tracking table
- [ ] Create scripts/db/rollback.ts for migration undo
- [ ] Test rollback on dev environment
- [ ] Add database indexes based on query patterns
- [ ] Profile slow queries in production

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
- ✅ Save complete plan to `memory-bank/plan-database-migration-2025-11-24.md`
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

