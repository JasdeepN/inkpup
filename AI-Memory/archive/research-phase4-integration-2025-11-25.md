# Research Brief: Phase 4 - Database & UI Integration

**Date:** 2025-11-25
**Status:** Research Complete
**Next:** Plan.prompt.md → Execute.prompt.md

---

## Problem Statement

The Admin UI for pricing and hero management has been created (Phase 3), but needs to be fully wired to the D1 database for production use. The following gaps exist:

1. Admin pricing pages show empty tables in local dev (D1 unavailable)
2. Hero selector requires `site_settings` table which doesn't exist
3. Diagnostics page shows JSON health, not actual D1 status
4. Homepage hero doesn't read from D1 site_settings

---

## Context

### Related Work
- Phase 3 completed: Admin UI pages created (`/dashboard/pricing/*`, `/dashboard/hero`)
- Migrations 001-003 applied to remote D1 (verified 2025-11-25)
- KV shim created for local dev in `lib/cache/kv.ts`
- Decision log: Server actions over API routes (2025-11-25)

### Current State

**D1 Database (Remote - Verified):**
```
Tables: size_categories, styles, color_profiles, gallery_images, schema_migrations
Seeded: 8 sizes, 16 styles, 5 color profiles
Missing: site_settings table
```

**D1 Binding Availability:**
| Environment | D1 Available | Reason |
|-------------|--------------|--------|
| Cloudflare Workers | ✅ Yes | getCloudflareContext().env.DB |
| Local `next dev` | ❌ No | No Workers runtime |
| Local `wrangler dev` | ✅ Yes | Runs in Workers |

**Admin Pages Status:**
| Page | D1 Function Used | Local Behavior | Prod Behavior |
|------|------------------|----------------|---------------|
| /dashboard/pricing/styles | getStyles() | Empty table | Works |
| /dashboard/pricing/sizes | getSizeCategories() | Empty table | Works |
| /dashboard/pricing/colors | getColorProfiles() | Empty table | Works |
| /dashboard/hero | getAllGalleryImages(), getSetting() | Empty/Error | Works* |

*Hero page will fail until site_settings table exists

### Constraints
- Cannot add D1 to local `next dev` (architectural limitation)
- Must maintain JSON fallback for public pricing page
- Production must use D1 for admin operations
- site_settings table needed before hero selector works

---

## Research Findings

### Approach Options

#### Option A: Minimal Integration (MVP) ⭐ Recommended
**Description:** Add missing table, update diagnostics, add local dev notices

**Tasks:**
1. Create `004_create_site_settings.sql` migration
2. Apply migration to remote D1
3. Update diagnostics to check actual D1 health
4. Add "D1 unavailable in local dev" notice to admin pages
5. Update hero-gallery.ts to read active_hero_id from D1

**Pros:**
- Fast to implement (1-2 hours)
- Unblocks production use
- Clear user messaging

**Cons:**
- Poor local dev experience (can't test admin CRUD)

**Effort:** Low (4-6 tasks)

#### Option B: Full Local Dev Support
**Description:** Create D1 shim for local dev with seeded data

**Tasks:**
1. All of Option A
2. Create D1 mock/shim (similar to KV shim)
3. Seed local shim with pricing.json data
4. Update getD1Binding() to return shim in dev

**Pros:**
- Full local testing capability
- Better developer experience

**Cons:**
- More complex implementation
- Mock may diverge from production behavior
- Extra maintenance burden

**Effort:** Medium (8-10 tasks)

#### Option C: Use Wrangler Dev for Admin Testing
**Description:** Document workflow for using `wrangler dev` when testing admin features

**Tasks:**
1. All of Option A
2. Create npm script for wrangler dev mode
3. Document admin testing workflow
4. Add .dev.vars configuration

**Pros:**
- Real D1 in local testing
- No mock maintenance

**Cons:**
- Different dev workflow for admin vs public pages
- Requires Cloudflare authentication
- Slower dev server startup

**Effort:** Low-Medium (5-7 tasks)

### Recommended Approach

**Option A (MVP) first**, then evaluate Option C for dev workflow.

Rationale:
- Unblocks production deployment quickly
- Clear messaging prevents user confusion
- Option C can be added incrementally without code changes
- Option B is overkill for a single-admin site

---

## Technical Considerations

### Dependencies
- None new (Zod already installed)

### Integration Points
1. `lib/db/d1.ts` - Add site_settings functions (already done in Phase 3)
2. `app/dashboard/diagnostics/page.tsx` - Update checkD1Health()
3. `app/dashboard/pricing/*/page.tsx` - Add local dev notice
4. `app/dashboard/hero/page.tsx` - Already queries D1
5. `lib/hero-gallery.ts` - Update to read active_hero_id

### Testing Strategy
- Unit tests: Mock D1 binding for server actions
- Integration: Deploy to dev environment and test admin pages
- E2E: Playwright test with admin authentication

### Deployment Impact
- Migration 004 must be applied before deploying hero changes
- No breaking changes to existing functionality

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| D1 unavailable in prod | High | Low | JSON fallback for public pages; error handling in admin |
| Admin confusion in local | Medium | High | Clear "D1 unavailable" notice with instructions |
| Missing site_settings breaks hero | High | High | Create migration 004 first |
| Migration failure | Medium | Low | Test on dev environment first; can rollback |

---

## Implementation Readiness

### Prerequisites
- [x] D1 database exists and accessible
- [x] Migrations 001-003 applied
- [x] Admin UI pages created
- [x] Server actions implemented
- [ ] Migration 004 (site_settings) created
- [ ] Migration 004 applied to remote

### Success Criteria
- [ ] Admin pricing pages work in Cloudflare Workers (production)
- [ ] Diagnostics shows actual D1 connection status
- [ ] Homepage reads active hero from D1 site_settings
- [ ] Local dev shows helpful "D1 unavailable" message
- [ ] All 4 migrations applied to remote D1

---

## Next Steps for Planning

1. **Create migration 004_create_site_settings.sql**
   - key (TEXT PRIMARY KEY)
   - value (TEXT)
   - updated_at (INTEGER)

2. **Apply migrations to remote D1**
   - Verify with wrangler d1 execute

3. **Update diagnostics page**
   - Actually call getD1Binding()
   - Query for table counts
   - Show D1 vs JSON source

4. **Add local dev notices**
   - Conditional banner in admin pages
   - Link to documentation

5. **Wire hero to homepage**
   - Update hero-gallery.ts to query site_settings
   - Fallback to first image if no setting

---

## References

- [wrangler.toml](/home/admin/projects/web/wrangler.toml) - D1 configuration
- [lib/db/d1.ts](/home/admin/projects/web/lib/db/d1.ts) - D1 client with CRUD functions
- [lib/pricing.ts](/home/admin/projects/web/lib/pricing.ts) - D1-first, JSON-fallback pattern
- [lib/cache/kv.ts](/home/admin/projects/web/lib/cache/kv.ts) - KV shim example
- [memory-bank/progress.md](/home/admin/projects/web/memory-bank/progress.md) - Phase tracking

---

*Research complete. Ready for Plan.prompt.md.*
