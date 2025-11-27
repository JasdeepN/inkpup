# Research Brief: Visitor UI → Backend Wiring

**Date:** 2025-11-26  
**Status:** Complete  
**Priority:** HIGH - Critical gap affecting visitor experience

---

## Problem Statement

We've built extensive backend infrastructure (D1 database, R2 storage, inquiry inbox, email templates) but the **visitor-facing pages aren't connected** to it. Specifically:

- **Flash designs uploaded via admin don't appear on the public /flash page**
- **Pricing changes in D1 don't reflect on public /pricing page**

The artist can upload content and edit pricing, but visitors never see the changes.

---

## Current State Analysis

### ✅ Fully Connected to Backend:

| Page | Data Source | Status |
|------|-------------|--------|
| Homepage Hero | R2 + D1 (hero_carousel_ids) | ✅ Working |
| Portfolio (/portfolio) | `listGalleryImages('healed')` from R2 | ✅ Working |
| Contact Form | D1 inquiries + Resend email | ✅ Working |
| Admin Dashboard | D1 + R2 | ✅ Working |
| Admin Gallery | R2 via `listGalleryImages()` | ✅ Working |

### 🔴 NOT Connected - Using Static Data:

| Page | Current Source | Should Use | Impact |
|------|----------------|-----------|--------|
| **Flash (/flash)** | `data/gallery.json` (4 items) | R2 `listGalleryImages('flash', 'available')` | 🔴 CRITICAL: Uploads invisible |
| **Pricing (/pricing)** | `data/pricing.json` | D1 `getPricingData()` | ⚠️ HIGH: Edits ignored |

---

## Research Findings

### Gap 1: Flash Page

**Current Implementation (app/flash/page.tsx):**
```typescript
import gallery from '../../data/gallery';  // ← STATIC JSON!
const flashDesigns = gallery.filter(item => 
  item.category === 'flash' || item.category === 'available'
);
```

**Problem:**
- `data/gallery.json` only has 4 placeholder items
- R2 has the real images uploaded via admin
- Any new flash uploads are invisible to visitors

**Fix Required:**
- Convert to async server component
- Use `listGalleryImages('flash')` and `listGalleryImages('available')`
- Combine results for display

### Gap 2: Pricing Estimator

**Current Implementation:**
- `lib/pricing.ts` has `getPricingData()` async function that queries D1
- BUT `PricingEstimator.tsx` (client component) uses sync `pricing` import
- Client can't call async server functions directly

**Problem:**
- Admin edits pricing in D1 (sizes, styles, colors)
- Public pricing page shows outdated JSON defaults

**Fix Required:**
- Create server wrapper that calls `getPricingData()`
- Pass data as props to client `PricingEstimator`
- Or: Create `/api/pricing` endpoint for client fetch

---

## Recommended Approach

### Priority 1: Fix Flash Page (30 min)

**Approach: Server Component Conversion**

1. Convert `/flash/page.tsx` to async server component
2. Fetch from R2:
   ```typescript
   const [flashResult, availableResult] = await Promise.all([
     listGalleryImages('flash'),
     listGalleryImages('available'),
   ]);
   const allDesigns = [...flashResult.items, ...availableResult.items];
   ```
3. Keep existing UI, just change data source
4. Remove `import gallery from '../../data/gallery'`

**Pros:**
- Minimal code change
- Uses existing R2 infrastructure
- SSR = good SEO

**Cons:**
- None significant

### Priority 2: Fix Pricing Page (20 min)

**Approach: Server-to-Client Data Passing**

1. Create `PricingEstimatorWrapper` server component:
   ```typescript
   import { getPricingData } from '@/lib/pricing';
   import PricingEstimatorClient from './PricingEstimatorClient';
   
   export default async function PricingEstimatorWrapper() {
     const pricingData = await getPricingData();
     return <PricingEstimatorClient initialData={pricingData} />;
   }
   ```
2. Update `PricingEstimator` to accept `initialData` prop
3. Use prop instead of static import

**Pros:**
- SSR with live D1 data
- Client interactivity preserved
- Type-safe

**Cons:**
- Slight refactor needed

---

## Technical Considerations

### Dependencies
- `lib/r2-server.ts` - `listGalleryImages()` already works
- `lib/pricing.ts` - `getPricingData()` already works
- No new libraries needed

### Integration Points
- `/flash/page.tsx` → R2 via `listGalleryImages()`
- `/pricing/page.tsx` → D1 via `getPricingData()`

### Testing Strategy
1. Upload a flash design via admin
2. Verify it appears on public /flash page
3. Edit pricing in admin
4. Verify changes on public /pricing page

### Edge Cases
- R2 connection fails → show fallback message
- D1 unavailable → use JSON fallback (already implemented in `getPricingData()`)
- Empty flash category → "No designs available" message (already in page)

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| R2 outage hides flash designs | High | Low | Show "check back later" message |
| D1 pricing fetch fails | Medium | Low | Fall back to JSON (already coded) |
| Type mismatches | Low | Medium | Use existing GalleryItem types |

---

## Implementation Readiness

### Prerequisites
- [x] R2 `listGalleryImages()` function works
- [x] D1 `getPricingData()` function works
- [x] Flash page UI structure exists
- [x] Pricing estimator UI structure exists

### Success Criteria
- [ ] Flash designs uploaded via admin appear on /flash page
- [ ] Pricing changes in admin reflect on /pricing page
- [ ] No regression in existing functionality
- [ ] Build passes, tests pass

### Estimated Effort

| Task | Time |
|------|------|
| Flash page R2 wiring | 30 min |
| Pricing page D1 wiring | 20 min |
| Testing & verification | 15 min |
| **Total** | **~1 hour** |

---

## Files to Modify

| File | Change |
|------|--------|
| `app/flash/page.tsx` | Convert to server component, use R2 |
| `components/PricingEstimator.tsx` | Accept `initialData` prop |
| `app/pricing/page.tsx` | Pass D1 data to estimator |

---

## Next Steps for Planning

1. Convert flash page to fetch from R2
2. Wire pricing page to use D1 data
3. Test upload → display flow
4. Verify pricing edit → display flow

---

*Research complete: 2025-11-26*  
*Ready for Plan phase*
