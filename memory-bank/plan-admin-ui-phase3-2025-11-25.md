# Task Breakdown and Action Plan — Admin UI (Phase 3)

**Created:** 2025-11-25  
**Status:** PLANNING  
**Branch:** dev  
**Related Research:** `memory-bank/research-admin-ui-phase3-2025-11-25.md`

---

## 1. Define the Main Task

**Task:** Build the authenticated Admin UI to manage pricing data (styles, sizes, color profiles) and select hero image, wired to Cloudflare D1/KV, following existing server actions patterns.

**Success Criteria:**
- Admin can create/edit/delete styles, sizes, colors without redeployments.
- Admin can select active hero image; homepage reflects change after revalidation.
- Input validation prevents invalid states; errors are clear.
- All operations enforce admin auth and host restrictions.
- Tests added: unit (schemas/actions), E2E (CRUD flows).

---

## 2. Break Down the Task

- D1 write functions for pricing data and settings
- Validation schemas with Zod
- Server actions for CRUD operations
- Admin navigation and pricing layout
- UI pages: styles, sizes, colors
- Hero selector page and settings storage
- Tests (unit + Playwright)
- Documentation and rollout notes

---

## 3. Outline Actionable Steps for Each Component

### Step 1: D1 Write Functions
- Add create/update/delete functions for styles, sizes, colors.
- Add get/set functions for site_settings (active_hero_id).
- Handle errors and return consistent messages.

### Step 2: Validation Schemas (Zod)
- Define `styleSchema`, `sizeCategorySchema`, `colorProfileSchema` with constraints.
- Export inferred types for TypeScript usage.

### Step 3: Server Actions (Pricing)
- Create `lib/admin-actions-pricing.ts` with CRUD actions.
- Verify auth, parse FormData, validate via Zod, call D1.
- Revalidate relevant paths after mutations.

### Step 4: Admin Navigation & Pricing Layout
- Add Pricing and Hero links to `AdminNav`.
- Create `app/dashboard/pricing/layout.tsx` sub-nav.

### Step 5: Styles Management Page
- `app/dashboard/pricing/styles/page.tsx`:
  - List styles from D1.
  - Add form to create style.
  - Edit inline; delete with confirmation.
  - Show validation feedback.

### Step 6: Sizes Management Page
- `app/dashboard/pricing/sizes/page.tsx` similar to styles.
- Include price range helpers and hints.

### Step 7: Colors Management Page
- `app/dashboard/pricing/colors/page.tsx` similar pattern.
- Include multiplier preview impact.

### Step 8: Site Settings Migration
- Create migration `004_create_site_settings.sql` for key/value settings.
- Initialize `active_hero_id` to NULL.

### Step 9: Hero Selector Page
- `app/dashboard/hero/page.tsx`:
  - Grid of hero images from D1.
  - Select active hero → writes to site_settings.
  - Show current selection.

### Step 10: Tests & Validation
- Unit: Zod schemas; D1 functions (mock DB).
- Server actions: happy path, invalid inputs, unauthorized.
- Playwright: CRUD flows for styles/sizes/colors; hero select.

### Step 11: Docs & Rollout
- Update README (Admin UI usage).
- Add migration run notes for wrangler dev/prod.
- Monitor initial usage in diagnostics.

---

## 4. Assign #todos

- #todo Create D1 write functions for styles (create/update/delete)
- #todo Create D1 write functions for sizes (create/update/delete)
- #todo Create D1 write functions for colors (create/update/delete)
- #todo Implement site_settings get/set functions in D1 client
- #todo Write Zod schemas for styles/sizes/colors
- #todo Create server actions module for pricing CRUD
- #todo Update AdminNav with Pricing and Hero links
- #todo Create pricing layout with sub-navigation
- #todo Build styles management page
- #todo Build sizes management page
- #todo Build colors management page
- #todo Write migration 004_create_site_settings.sql
- #todo Build hero selector page
- #todo Update hero-gallery.ts to read active hero from site_settings
- #todo Add unit tests (schemas, D1 functions, actions)
- #todo Add Playwright tests for CRUD & hero selection
- #todo Update README and rollout notes

---

## 5. Utilize Tools

- Development: VS Code, Next.js server actions patterns
- Database: Wrangler (D1/KV), SQL migrations
- Validation: Zod schemas
- Testing: Jest (unit), Playwright (E2E)
- Memory: Save plans/progress in `memory-bank/`

---

## 6. Save to Memory Management

- Plan saved here: `memory-bank/plan-admin-ui-phase3-2025-11-25.md`
- Update progress at milestones (Phase 3 steps).
- Log decisions: server actions over API routes; site_settings table for hero.
- Update active context to Phase 3 planning/execution.

---

## 7. Review and Adjust

**Checklist:**
- [x] Tasks saved to memory-bank
- [x] #todos enumerated
- [x] Tools listed
- [x] Success criteria defined
- [x] Risks considered (see research brief)

Adjust plan based on stakeholder feedback or discovery during implementation.
