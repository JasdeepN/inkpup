# Implementation Plan: Phase 4 - Database & UI Integration

**Date:** 2025-11-25
**Research Brief:** `research-phase4-integration-2025-11-25.md`
**Status:** Planning Complete

---

## 1. Main Task

Wire the Admin UI (created in Phase 3) to the D1 database for production use, update diagnostics to show actual D1 health, and connect the hero selector to the homepage.

---

## 2. Major Components

| # | Component | Description | Effort |
|---|-----------|-------------|--------|
| 1 | site_settings Migration | Create table for runtime configuration | Low |
| 2 | Apply Migrations | Run wrangler to apply migration 004 | Low |
| 3 | Diagnostics Update | Real D1 health checks, not just JSON | Medium |
| 4 | Local Dev Notices | Clear messaging when D1 unavailable | Low |
| 5 | Hero Integration | Read active_hero_id from site_settings | Medium |
| 6 | Build & Verify | Test production build and deployment | Low |

---

## 3. Actionable Steps

### Step 1: Create site_settings Migration
**File:** `scripts/db/migrations/004_create_site_settings.sql`

- Create table with: key (TEXT PRIMARY KEY), value (TEXT NULLABLE), updated_at (INTEGER)
- Insert default active_hero_id value (null = use first image)
- Record in schema_migrations table

**Tool:** File creation

---

### Step 2: Apply Migration to Remote D1
**Command:** `wrangler d1 migrations apply inkpup-db-dev --env dev --remote`

- Verify table created with: `wrangler d1 execute ... --command "SELECT * FROM site_settings;"`
- Check schema_migrations shows version 4

**Tool:** Terminal (wrangler CLI)

---

### Step 3: Update Diagnostics D1 Health Check
**File:** `app/dashboard/diagnostics/page.tsx`

- Modify `checkD1Health()` to call `getD1Binding()`
- If binding available: query table counts (styles, sizes, colors, site_settings)
- If binding unavailable: show "D1 unavailable (local dev)" with degraded status
- Update details to show source: "D1" vs "JSON fallback"

**Tool:** Code editor

---

### Step 4: Add Local Dev Notice to Admin Pages
**Files:** 
- `app/dashboard/pricing/layout.tsx` - Add notice component
- Create `components/admin/D1UnavailableNotice.tsx` - Reusable banner

- Check if `getD1Binding()` returns undefined
- Show yellow/amber banner: "D1 database not available in local development. Data shown is from production."
- Link to docs or wrangler dev instructions

**Tool:** Code editor, component creation

---

### Step 5: Wire Hero Gallery to site_settings
**File:** `lib/hero-gallery.ts`

- Import `getD1Binding`, `getSetting` from `lib/db/d1`
- In `getHeroImages()`:
  - Try to read `active_hero_id` from site_settings
  - If set, prioritize that image (move to first position or filter)
  - If not set or D1 unavailable, use current behavior (first image)
- Keep R2 listing as-is; only hero selection changes

**Tool:** Code editor

---

### Step 6: Build and Verify
**Commands:**
```bash
npm run build
npm run start  # Local smoke test
# Deploy to dev environment and test admin pages
```

- Verify no TypeScript errors
- Check `/dashboard/diagnostics` shows correct D1 status
- Test `/dashboard/pricing/styles` (should work in production)
- Test `/dashboard/hero` (should show images and allow selection)

**Tool:** Terminal, browser testing

---

## 4. #todos

Based on the research and breakdown above:

- #todo Create `004_create_site_settings.sql` migration file
- #todo Apply migration 004 to remote D1 via wrangler
- #todo Update `checkD1Health()` in diagnostics to query actual D1
- #todo Create `D1UnavailableNotice.tsx` component for admin pages
- #todo Add D1 notice to pricing layout when binding unavailable
- #todo Update `hero-gallery.ts` to read `active_hero_id` from D1
- #todo Run production build and verify no errors
- #todo Test admin pages in deployed Cloudflare Workers

---

## 5. Tools & Dependencies

| Step | Tool/Function |
|------|---------------|
| Migration creation | `create_file` |
| Apply migration | `run_in_terminal` (wrangler d1) |
| Diagnostics update | `replace_string_in_file` |
| Notice component | `create_file` |
| Pricing layout update | `replace_string_in_file` |
| Hero gallery update | `replace_string_in_file` |
| Build verification | `run_in_terminal` (npm run build) |

---

## 6. Success Criteria

- [ ] site_settings table exists in remote D1
- [ ] Diagnostics shows actual D1 connection status
- [ ] Admin pricing pages show "D1 unavailable" notice in local dev
- [ ] Admin pricing pages show real data in production
- [ ] Hero selector can save active_hero_id to site_settings
- [ ] Homepage respects active_hero_id from site_settings
- [ ] Production build passes without errors

---

## 7. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Migration fails | Test on dev environment first; can manually apply SQL |
| D1 unavailable in prod | JSON fallback maintained for public pricing page |
| Hero breaks | Fallback to first image if no setting or D1 error |

---

## 8. Estimated Time

| Step | Time |
|------|------|
| Migration creation | 5 min |
| Apply migration | 5 min |
| Diagnostics update | 15 min |
| Local dev notices | 15 min |
| Hero integration | 20 min |
| Build & verify | 10 min |
| **Total** | **~70 min** |

---

## 9. Execution Order

```
1. Migration (004) → 2. Apply → 3. Diagnostics → 4. Notices → 5. Hero → 6. Build
     ↓                  ↓            ↓              ↓           ↓         ↓
  [file]            [wrangler]    [code]        [code]      [code]    [npm]
```

All steps are sequential; each depends on the previous completing successfully.

---

*Plan complete. Ready for Execute.prompt.md.*
