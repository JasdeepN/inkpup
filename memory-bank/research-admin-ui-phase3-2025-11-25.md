# Research Brief: Admin UI for Pricing & Hero Management (Phase 3)

**Created:** 2025-11-25
**Status:** RESEARCH COMPLETE - Ready for Planning
**Related Plan:** `plan-database-migration-2025-11-24.md`
**Phase:** 3 - Admin UI for Editing

---

## Problem Statement

With D1 database integration complete (Phase 0-2), we need admin interfaces to:
1. **CRUD pricing data** - Manage styles, sizes, and color profiles without code deployment
2. **Select hero images** - Choose active hero from gallery_images table
3. **Maintain data integrity** - Validate inputs, prevent invalid states

---

## Context

### Related Work
- Phase 0-1 completed: D1 schema, migrations, pricing fallback logic
- Phase 2 in progress: gallery_images table exists with R2 sync hooks
- Existing admin patterns in `lib/admin-actions.ts`, `components/admin/`

### Current State
- **D1 Read Functions Exist:** `getSizeCategories()`, `getStyles()`, `getColorProfiles()`, `getGalleryImages()`
- **D1 Write Functions Missing:** No create/update/delete for pricing tables
- **Admin Auth:** Session-based via `verifySessionToken()`, host verification via `isAdminHost()`
- **Form Pattern:** `useActionState` hook with server actions returning `{error?, success?}`

### Constraints
- Must work with D1 binding (Cloudflare Workers)
- Must fall back gracefully when D1 unavailable (local dev without wrangler)
- No breaking changes to existing pricing components
- Protected under admin auth (dashboard layout enforces)

---

## Research Findings

### Approach Options

#### 1. Server Actions Only (Recommended) ✅
- **Description:** Create `lib/admin-actions-pricing.ts` with CRUD server actions
- **Pros:** 
  - Matches existing patterns (loginAction, uploadGalleryAction)
  - Simpler than API routes
  - Progressive enhancement
  - Automatic form handling with `useActionState`
- **Cons:** 
  - Harder to test in isolation
  - Less RESTful
- **Effort:** 2-3 hours

#### 2. API Routes + Server Actions
- **Description:** Create REST endpoints in `app/api/admin/pricing/`
- **Pros:** 
  - RESTful, testable
  - Can call from anywhere
- **Cons:** 
  - More code, duplicate validation
  - Extra HTTP overhead
- **Effort:** 4-5 hours

### Recommended Approach: Server Actions Only

Server actions align with existing patterns and reduce complexity. API routes add unnecessary overhead for admin-only CRUD operations.

---

### Technical Considerations

#### 1. D1 Write Functions Needed (`lib/db/d1.ts`)

```typescript
// Styles
export async function createStyle(db: D1Database, data: StyleInput): Promise<void>
export async function updateStyle(db: D1Database, id: string, data: Partial<StyleInput>): Promise<void>
export async function deleteStyle(db: D1Database, id: string): Promise<void>

// Size Categories
export async function createSizeCategory(db: D1Database, data: SizeCategoryInput): Promise<void>
export async function updateSizeCategory(db: D1Database, id: string, data: Partial<SizeCategoryInput>): Promise<void>
export async function deleteSizeCategory(db: D1Database, id: string): Promise<void>

// Color Profiles
export async function createColorProfile(db: D1Database, data: ColorProfileInput): Promise<void>
export async function updateColorProfile(db: D1Database, id: string, data: Partial<ColorProfileInput>): Promise<void>
export async function deleteColorProfile(db: D1Database, id: string): Promise<void>

// Site Settings
export async function getSetting(db: D1Database, key: string): Promise<string | null>
export async function setSetting(db: D1Database, key: string, value: string): Promise<void>
```

#### 2. Zod Validation Schemas (`lib/schemas/pricing.ts`)

```typescript
import { z } from 'zod';

const slugRegex = /^[a-z0-9-]+$/;

export const styleSchema = z.object({
  id: z.string().min(1).max(50).regex(slugRegex, 'ID must be lowercase alphanumeric with hyphens'),
  label: z.string().min(1).max(100),
  multiplier: z.number().min(0.1).max(5.0),
  description: z.string().max(500).nullable().optional(),
  recommended_color_type: z.string().max(50).nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
});

export const sizeCategorySchema = z.object({
  id: z.string().min(1).max(50).regex(slugRegex),
  label: z.string().min(1).max(100),
  min_price: z.number().int().min(0).max(50000),
  max_price: z.number().int().min(0).max(100000),
  description: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
}).refine(data => data.min_price <= data.max_price, {
  message: 'min_price must be ≤ max_price',
  path: ['max_price'],
});

export const colorProfileSchema = z.object({
  id: z.string().min(1).max(50).regex(slugRegex),
  label: z.string().min(1).max(100),
  multiplier: z.number().min(0.5).max(3.0),
  description: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
});

export type StyleInput = z.infer<typeof styleSchema>;
export type SizeCategoryInput = z.infer<typeof sizeCategorySchema>;
export type ColorProfileInput = z.infer<typeof colorProfileSchema>;
```

#### 3. Server Actions (`lib/admin-actions-pricing.ts`)

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getD1Binding } from './db/d1';
import { verifySessionToken, getSessionCookieOptions, isAdminEnabled } from './admin-auth';
import { styleSchema, sizeCategorySchema, colorProfileSchema } from './schemas/pricing';

export type PricingActionState = { error?: string; success?: string } | null;

async function ensureAuth(): Promise<boolean> {
  if (!isAdminEnabled()) return false;
  const cookieStore = await cookies();
  const { name } = getSessionCookieOptions();
  const token = cookieStore.get(name)?.value ?? null;
  return verifySessionToken(token);
}

export async function createStyleAction(prevState: PricingActionState, formData: FormData): Promise<PricingActionState> {
  if (!await ensureAuth()) return { error: 'Unauthorized' };
  
  const db = getD1Binding();
  if (!db) return { error: 'Database not available' };
  
  // Parse and validate
  const raw = Object.fromEntries(formData.entries());
  const parsed = styleSchema.safeParse({
    ...raw,
    multiplier: parseFloat(raw.multiplier as string),
    sort_order: parseInt(raw.sort_order as string) || 0,
  });
  
  if (!parsed.success) {
    return { error: parsed.error.errors.map(e => e.message).join(', ') };
  }
  
  try {
    await createStyle(db, parsed.data);
    revalidatePath('/dashboard/pricing/styles');
    revalidatePath('/pricing');
    return { success: 'Style created successfully' };
  } catch (e) {
    return { error: 'Failed to create style' };
  }
}

// Similar actions for update, delete, sizes, colors...
```

#### 4. Page Structure

```
app/dashboard/pricing/
├── layout.tsx          # Sub-navigation for pricing section
├── page.tsx            # Redirect to /styles or overview
├── styles/
│   └── page.tsx        # Styles CRUD table
├── sizes/
│   └── page.tsx        # Sizes CRUD table
└── colors/
    └── page.tsx        # Colors CRUD table

app/dashboard/hero/
└── page.tsx            # Hero image selector grid
```

#### 5. Admin Navigation Update

Add to `components/admin/AdminNav.tsx`:
```tsx
<Link href="/dashboard/pricing" className="nav-link">Pricing</Link>
<Link href="/dashboard/hero" className="nav-link">Hero</Link>
```

#### 6. Database Migration for site_settings

```sql
-- Migration: 004_create_site_settings.sql
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT,
  updated_at INTEGER NOT NULL
);

-- Initialize with null active hero (will use first hero image as fallback)
INSERT INTO site_settings (key, value, updated_at) 
VALUES ('active_hero_id', NULL, strftime('%s', 'now') * 1000);

-- Record migration
INSERT INTO schema_migrations (version, name) VALUES (4, '004_create_site_settings');
```

---

### Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| D1 binding unavailable locally | High | Medium | Clear error message, fallback to read-only |
| Concurrent edit race condition | Medium | Low | Check `updated_at` before update (optimistic lock) |
| Invalid multiplier breaks pricing | High | Low | Strict Zod validation (0.1-5.0 range) |
| Duplicate IDs cause DB conflict | High | Low | Check existence before insert, handle conflict |
| Accidental delete of used data | Medium | Low | Soft confirmation dialog, audit log |

---

## Implementation Readiness

### Prerequisites
- [x] D1 schema exists for pricing tables
- [x] gallery_images table exists for hero selection
- [x] Admin auth pattern established
- [x] Existing form patterns to follow
- [ ] D1 write functions (to be created)
- [ ] Zod schemas (to be created)
- [ ] site_settings migration (to be created)

### Success Criteria
- [ ] Admin can create/edit/delete styles without code deployment
- [ ] Admin can create/edit/delete size categories
- [ ] Admin can create/edit/delete color profiles
- [ ] Admin can select active hero image from grid
- [ ] Pricing estimator reflects changes immediately (after revalidation)
- [ ] All operations protected by admin auth
- [ ] Input validation prevents invalid data
- [ ] Tests cover happy path and error cases

---

## Next Steps for Planning

1. **Create D1 write functions** in `lib/db/d1.ts`
2. **Create Zod schemas** in `lib/schemas/pricing.ts`
3. **Create server actions** in `lib/admin-actions-pricing.ts`
4. **Update AdminNav** with Pricing and Hero links
5. **Create pricing layout** with sub-navigation
6. **Build Styles page** with table and forms
7. **Build Sizes page** with table and forms
8. **Build Colors page** with table and forms
9. **Create site_settings migration**
10. **Build Hero selector page**
11. **Update hero-gallery.ts** to read from D1 site_settings
12. **Write tests** for new functionality

### Estimated Effort
- D1 Write Functions: 1-2 hours
- Zod Schemas: 30 minutes
- Server Actions: 2-3 hours
- Admin UI (4 pages): 4-6 hours
- Testing: 2-3 hours
- **Total: 1.5-2 days**

---

## References

- Existing patterns: `lib/admin-actions.ts`, `components/admin/LoginForm.tsx`
- D1 Documentation: https://developers.cloudflare.com/d1/
- Zod Documentation: https://zod.dev/
- Next.js Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- Migration plan: `memory-bank/plan-database-migration-2025-11-24.md`

---

*Research complete. Ready to transition to Plan.prompt.md for implementation breakdown.*
