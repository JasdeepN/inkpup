# Plan: Visitor UI → Backend Wiring

**Date:** 2025-11-26  
**Research Brief:** [research-visitor-ui-wiring-2025-11-26.md](./research-visitor-ui-wiring-2025-11-26.md)  
**Status:** Ready for Execution  
**Priority:** HIGH - Critical gap

---

## Task Definition

Wire the visitor-facing pages to use live backend data instead of static JSON files:

1. **Flash Page** → R2 gallery images
2. **Pricing Page** → D1 pricing data

**Goal:** Admin uploads/edits should immediately reflect on public pages.

---

## Breakdown of Steps

### Phase 1: Wire Flash Page to R2

Convert `/flash/page.tsx` from static JSON to live R2 data.

### Phase 2: Wire Pricing Page to D1

Pass D1 pricing data from server to client PricingEstimator component.

### Phase 3: Test & Verify

Ensure uploads appear and edits reflect.

---

## Detailed Actionable Steps

### Phase 1: Wire Flash Page to R2

**File:** `app/flash/page.tsx`

- [ ] **1.1** Remove static `import gallery from '../../data/gallery'`
- [ ] **1.2** Add `import { listGalleryImages } from '../../lib/r2-server'`
- [ ] **1.3** Convert to async server component
- [ ] **1.4** Fetch flash + available categories in parallel:
  ```typescript
  const [flashResult, availableResult] = await Promise.all([
    listGalleryImages('flash'),
    listGalleryImages('available'),
  ]);
  ```
- [ ] **1.5** Combine results and handle `.asPromise()` pattern
- [ ] **1.6** Update component to use fetched data
- [ ] **1.7** Add fallback UI for R2 failures

### Phase 2: Wire Pricing Page to D1

**Files:** `app/pricing/page.tsx`, `components/PricingEstimator.tsx`

- [ ] **2.1** Import `getPricingData` in pricing page
- [ ] **2.2** Convert pricing page to async server component
- [ ] **2.3** Fetch pricing data: `const pricingData = await getPricingData()`
- [ ] **2.4** Update `PricingEstimator` to accept `initialData` prop
- [ ] **2.5** Replace static `pricing` import with prop usage
- [ ] **2.6** Pass fetched data from page to component
- [ ] **2.7** Keep JSON fallback (already in `getPricingData()`)

### Phase 3: Test & Verify

- [ ] **3.1** Run build: `npm run build`
- [ ] **3.2** Run tests: `npm test -- --forceExit`
- [ ] **3.3** Manual test: verify flash page shows R2 images
- [ ] **3.4** Manual test: verify pricing reflects D1 data

---

## #todos Summary

```markdown
Phase 1: Flash Page
- [ ] #todo Remove static gallery import from flash page
- [ ] #todo Add R2 listGalleryImages import
- [ ] #todo Fetch flash + available categories from R2
- [ ] #todo Update flash page to use fetched data

Phase 2: Pricing Page
- [ ] #todo Add getPricingData to pricing page
- [ ] #todo Update PricingEstimator to accept initialData prop
- [ ] #todo Pass D1 pricing data from page to estimator

Phase 3: Verify
- [ ] #todo Build passes
- [ ] #todo Tests pass
```

---

## Tools & Dependencies

| Step | Tools/Functions |
|------|-----------------|
| 1.x Flash wiring | `listGalleryImages()` from `lib/r2-server.ts` |
| 2.x Pricing wiring | `getPricingData()` from `lib/pricing.ts` |
| 3.x Testing | `npm run build`, `npm test` |

**Existing functions to use:**
- `listGalleryImages(category)` - Returns `{ items, isFallback, fallbackReason }`
- `getPricingData()` - Returns `PricingDataShape` from D1 with JSON fallback

---

## Success Criteria

- [ ] Flash page shows images from R2 (not static JSON)
- [ ] Pricing estimator uses D1 data (with JSON fallback)
- [ ] Build passes
- [ ] All tests pass
- [ ] No regressions

---

## Files to Modify

| File | Change |
|------|--------|
| `app/flash/page.tsx` | Convert to async, fetch from R2 |
| `app/pricing/page.tsx` | Fetch from D1, pass to component |
| `components/PricingEstimator.tsx` | Accept `initialData` prop |

---

## Estimated Effort

| Phase | Time |
|-------|------|
| Phase 1: Flash page | 30 min |
| Phase 2: Pricing page | 20 min |
| Phase 3: Testing | 15 min |
| **Total** | **~1 hour** |

---

*Plan created: 2025-11-26*  
*Ready for execution*
