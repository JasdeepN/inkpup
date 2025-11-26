# Plan: Admin Dashboard Overhaul

**Date:** 2025-11-26  
**Research Brief:** [research-dashboard-overhaul-2025-11-26.md](./research-dashboard-overhaul-2025-11-26.md)  
**Status:** Planning

---

## Task Definition

Transform the admin dashboard from an infrastructure-focused DevOps view into a business-focused artist dashboard that answers "what should I do today?"

**Scope:**
- Remove irrelevant technical panels
- Add gallery health stats
- Add marketing prompts
- Streamline quick actions
- Move technical metrics to /diagnostics

**Out of Scope (Future Work):**
- Contact form storage in D1 (inquiry inbox)
- Instagram API integration
- Booking/calendar integration

---

## Current State

```
┌─────────────────────────────────────────────────────────────┐
│  WELCOME HERO                                               │
│  + JobSummary (upload queue)  ← REMOVE                      │
└─────────────────────────────────────────────────────────────┘
┌──────────┬──────────┬──────────┬──────────┐
│ Requests │ Visits   │ Bandwidth│ Cache    │  ← MOVE TO /diagnostics
└──────────┴──────────┴──────────┴──────────┘
┌─────────────────┬─────────────────┬─────────────────┐
│ Recent uploads  │ Worker queue    │ Quick links     │
│ ← REMOVE        │ ← REMOVE        │ ← SIMPLIFY      │
└─────────────────┴─────────────────┴─────────────────┘
```

## Target State

```
┌─────────────────────────────────────────────────────────────┐
│  WELCOME SECTION (simplified)                               │
│  "Welcome back" + Primary CTAs                              │
└─────────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────┬──────────────────┐
│ 🎨 Flash         │ 🖼️ Portfolio     │ 💰 Pricing       │  ← NEW: Gallery Stats
│ 12 available     │ 45 images        │ Last updated     │
└──────────────────┴──────────────────┴──────────────────┘
┌─────────────────────────────┬───────────────────────────────┐
│ 💡 MARKETING IDEA           │ 🔗 QUICK ACTIONS              │  ← NEW: Business Focus
│ Rotating tips panel         │ Streamlined links             │
└─────────────────────────────┴───────────────────────────────┘
```

---

## Breakdown of Steps

### Phase 1: Clean Up Dashboard (Remove Clutter)
Remove infrastructure-focused content that doesn't help the artist.

### Phase 2: Enhance Diagnostics Page
Move technical metrics to where they belong.

### Phase 3: Add Gallery Stats
Show business-relevant gallery information.

### Phase 4: Add Marketing Tips
Provide actionable growth prompts.

### Phase 5: Polish & Test
Ensure everything works and looks good.

---

## Detailed Actionable Steps

### Phase 1: Clean Up Dashboard

**Files:** `app/dashboard/page.tsx`

- [ ] **1.1** Remove `JobSummary` import and component from hero section
- [ ] **1.2** Remove `getUploadJobSummary` call from `Promise.all`
- [ ] **1.3** Remove "Recent uploads" panel (`<article>` with recent uploads list)
- [ ] **1.4** Remove "Worker queue" panel (`<article>` with queue metrics)
- [ ] **1.5** Remove Cloudflare stats section (4 StatCards) - will move to diagnostics
- [ ] **1.6** Remove unused imports (`JobSummary`, `getUploadJobSummary`, `GalleryItem`, etc.)

### Phase 2: Enhance Diagnostics Page

**Files:** `app/dashboard/diagnostics/page.tsx`

- [ ] **2.1** Add Cloudflare analytics section to diagnostics page
- [ ] **2.2** Import `getCloudflareAnalyticsSummary` and `StatCard` component
- [ ] **2.3** Add stats cards for Requests, Visits, Bandwidth, Cache hit rate
- [ ] **2.4** Group under "Traffic Analytics" heading

### Phase 3: Add Gallery Stats (Per-Category)

**Files:** `app/dashboard/page.tsx`, new helper function

- [ ] **3.1** Create `getGalleryStats()` function to count images by category
- [ ] **3.2** Return counts for: flash, portfolio, available
- [ ] **3.3** Create stats cards showing each category count
- [ ] **3.4** Add links to manage each category (→ `/gallery`)

### Phase 4: Final Cleanup & Test

- [ ] **6.1** Run build: `npm run build`
- [ ] **6.2** Run tests: `npm test -- --forceExit`
- [ ] **6.3** Manual test dashboard in browser
- [ ] **6.4** Verify diagnostics page shows moved analytics
- [ ] **6.5** Update any failing tests

---

## #todos Summary

```markdown
Phase 1: Clean Up
- [ ] #todo Remove JobSummary from dashboard hero
- [ ] #todo Remove recent uploads panel
- [ ] #todo Remove worker queue panel
- [ ] #todo Remove Cloudflare stats section
- [ ] #todo Remove quick links panel
- [ ] #todo Clean up unused imports

Phase 2: Enhance Diagnostics
- [ ] #todo Add Cloudflare analytics to diagnostics page
- [ ] #todo Style traffic analytics section

Phase 3: Gallery Stats (Per-Category)
- [ ] #todo Create getGalleryStats() helper (flash/portfolio/available counts)
- [ ] #todo Add 3 gallery stats cards to dashboard
- [ ] #todo Link stats to /gallery with category filter

Phase 4: Verify
- [ ] #todo Build passes
- [ ] #todo Tests pass
- [ ] #todo Manual verification
```

---

## Tools & Dependencies

| Step | Tools/Functions |
|------|-----------------|
| 1.x Remove panels | `replace_string_in_file` on dashboard page |
| 2.x Diagnostics | `replace_string_in_file`, import StatCard |
| 3.x Gallery stats | `listGalleryImages` from `lib/r2-server.ts` |
| 4.x Testing | `npm run build`, `npm test` |

---

## Success Criteria

- [ ] Dashboard loads in < 2 seconds
- [ ] No infrastructure metrics on main dashboard
- [ ] Gallery stats by category visible (flash, portfolio, available)
- [ ] Cloudflare analytics accessible via /diagnostics
- [ ] Build passes, all tests pass

---

## Estimated Effort

| Phase | Time |
|-------|------|
| Phase 1: Clean up | 30 min |
| Phase 2: Diagnostics | 30 min |
| Phase 3: Gallery stats | 30 min |
| Phase 4: Testing | 15 min |
| **Total** | **~1.75 hours** |

---

## Future Work (Out of Scope)

- **Promotions/Sales Scheduling** - Would need a full feature: create promotion, set dates, display on site
- **Contact Inbox** - Store form submissions in D1, show unread count
- **Instagram Integration** - OAuth, API integration

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Removing analytics loses visibility | Move to /diagnostics, not delete |
| Gallery stats slow page load | Already cached in R2 calls |
| Marketing tips feel stale | Use date-based rotation |

---

## Open Questions - RESOLVED

1. **Gallery stats granularity:** ✅ **Per-category breakdown** (flash/portfolio/available)
2. **Marketing tips:** ✅ **REMOVED** - Doesn't add value. Artist knows they need content. Sales scheduling would need a full promotions feature (future work).
3. **Quick actions styling:** ✅ **REMOVED** - Not needed
4. **Pricing stat:** ✅ **REMOVED** - Not needed

---

## Revised Target State (Simplified)

```
┌─────────────────────────────────────────────────────────────┐
│  WELCOME SECTION                                            │
│  "Welcome back" + Primary CTAs (Upload | Gallery)           │
└─────────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────┬──────────────────┐
│ 🎨 Flash         │ 🖼️ Portfolio     │ ✨ Available     │
│ 12 designs       │ 28 pieces        │ 5 bookable       │
│ → Manage         │ → View           │ → View           │
└──────────────────┴──────────────────┴──────────────────┘
```

That's it. Clean, simple, actionable. Technical metrics in /diagnostics.

| Phase | Time |
|-------|------|
| Phase 1: Clean up | 30 min |
| Phase 2: Diagnostics | 30 min |
| Phase 3: Gallery stats | 45 min |
| Phase 4: Marketing tips | 45 min |
| Phase 5: Quick actions | 15 min |
| Phase 6: Testing | 15 min |
| **Total** | **~3 hours** |

---

*Plan created: 2025-11-26*  
*Ready for review before implementation*
