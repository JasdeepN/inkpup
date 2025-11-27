# Plan: Admin Dashboard Overhaul

**Date:** 2025-11-26  
**Research Brief:** [research-dashboard-overhaul-2025-11-26.md](./research-dashboard-overhaul-2025-11-26.md)  
**Status:** Ready for Execution  
**Updated:** 2025-11-26 (added Inquiry Inbox integration)

---

## Task Definition

Transform the admin dashboard from an infrastructure-focused DevOps view into a business-focused artist dashboard that answers "what should I do today?"

**Scope:**
- Remove irrelevant technical panels (JobSummary, queue metrics, recent uploads)
- Add gallery health stats (flash/portfolio/available counts)
- Add inquiry inbox stats (unread count, recent inquiries)
- Streamline quick actions with new pages
- Move technical metrics to /diagnostics

**Out of Scope (Future Work):**
- Instagram API integration
- Booking/calendar integration
- Promotions/banner system

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
│ ← REMOVE        │ ← REMOVE        │ ← UPDATE        │
└─────────────────┴─────────────────┴─────────────────┘
```

## Target State

```
┌─────────────────────────────────────────────────────────────┐
│  WELCOME SECTION                                            │
│  "Welcome back" + Primary CTAs (Upload | Gallery | Inbox)   │
└─────────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────┬──────────────────┐
│ 📬 Inquiries     │ 🎨 Flash         │ 🖼️ Portfolio     │
│ 3 unread         │ 12 designs       │ 28 pieces        │
│ → View Inbox     │ → Manage         │ → View           │
└──────────────────┴──────────────────┴──────────────────┘
┌──────────────────┬──────────────────┬──────────────────┐
│ ✨ Available     │ 📝 Templates     │ ⚙️ Diagnostics   │
│ 5 bookable       │ 4 templates      │ System health    │
│ → View           │ → Edit           │ → View           │
└──────────────────┴──────────────────┴──────────────────┘
```

---

## Breakdown of Steps

### Phase 1: Clean Up Dashboard (Remove Clutter)
Remove infrastructure-focused content that doesn't help the artist.

### Phase 2: Enhance Diagnostics Page
Move Cloudflare analytics to /diagnostics where they belong.

### Phase 3: Add Business Stats
Show gallery counts and inquiry inbox stats.

### Phase 4: Polish & Test
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
- [ ] **1.6** Remove unused imports (`JobSummary`, `getUploadJobSummary`, `GalleryItem`, `StatCard`, etc.)
- [ ] **1.7** Remove helper functions (`buildStats`, `computeDelta`, `sumField`, formatters)
- [ ] **1.8** Update hero actions: Upload | Gallery | Inbox

### Phase 2: Enhance Diagnostics Page

**Files:** `app/dashboard/diagnostics/page.tsx`

- [ ] **2.1** Add Cloudflare analytics section to diagnostics page
- [ ] **2.2** Import `getCloudflareAnalyticsSummary` and `StatCard` component
- [ ] **2.3** Add stats cards for Requests, Visits, Bandwidth, Cache hit rate
- [ ] **2.4** Move formatting helpers to diagnostics or shared util
- [ ] **2.5** Group under "Traffic Analytics" heading

### Phase 3: Add Business Stats Cards

**Files:** `app/dashboard/page.tsx`, `lib/db/inquiries.ts`

- [ ] **3.1** Create `getGalleryStats()` function to count images by category
  - Count flash, portfolio, available separately
  - Use `listGalleryImages` for each category
- [ ] **3.2** Create `getInquiryStats()` function
  - Unread count from `getUnreadCount()` in `lib/db/inquiries.ts`
  - Total pending inquiries
- [ ] **3.3** Create new `DashboardStatCard` component (simpler than StatCard)
  - Icon, title, value, link
- [ ] **3.4** Add 6 stat cards in 2 rows:
  - Row 1: Inquiries (unread) | Flash (count) | Portfolio (count)
  - Row 2: Available (count) | Templates (count) | Diagnostics (link)
- [ ] **3.5** Each card links to its management page

### Phase 4: Verify & Test

- [ ] **4.1** Run build: `npm run build`
- [ ] **4.2** Run tests: `npm test -- --forceExit`
- [ ] **4.3** Manual test dashboard in browser
- [ ] **4.4** Verify diagnostics page shows Cloudflare analytics
- [ ] **4.5** Update any failing tests

---

## #todos Summary

```markdown
Phase 1: Clean Up
- [ ] #todo Remove JobSummary from dashboard hero
- [ ] #todo Remove recent uploads panel  
- [ ] #todo Remove worker queue panel
- [ ] #todo Remove Cloudflare stats section
- [ ] #todo Remove all unused imports and helpers
- [ ] #todo Update hero CTAs (Upload | Gallery | Inbox)

Phase 2: Enhance Diagnostics
- [ ] #todo Move Cloudflare analytics to diagnostics page
- [ ] #todo Move formatting helpers to diagnostics
- [ ] #todo Style traffic analytics section

Phase 3: Business Stats
- [ ] #todo Create getGalleryStats() helper (flash/portfolio/available)
- [ ] #todo Create getInquiryStats() helper (unread/pending)
- [ ] #todo Create DashboardStatCard component
- [ ] #todo Add 6 stat cards in 2x3 grid
- [ ] #todo Link cards to management pages

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
| 2.x Diagnostics | `replace_string_in_file`, move StatCard logic |
| 3.x Gallery stats | `listGalleryImages` from `lib/r2-server.ts` |
| 3.x Inquiry stats | `getUnreadCount` from `lib/db/inquiries.ts` |
| 4.x Testing | `npm run build`, `npm test` |

**New Dependencies (already exist):**
- `lib/db/inquiries.ts` - `getUnreadCount()` function
- `lib/admin-actions-inquiries.ts` - `getUnreadCountAction()` server action
- `lib/db/email-templates.ts` - `getAllTemplates()` for template count

---

## Success Criteria

- [ ] Dashboard loads in < 2 seconds
- [ ] No infrastructure metrics on main dashboard
- [ ] Inquiry unread count visible with badge
- [ ] Gallery stats by category visible (flash, portfolio, available)
- [ ] Template count visible
- [ ] Cloudflare analytics accessible via /diagnostics
- [ ] Build passes, all tests pass

---

## Estimated Effort

| Phase | Time |
|-------|------|
| Phase 1: Clean up | 30 min |
| Phase 2: Diagnostics | 30 min |
| Phase 3: Business stats | 45 min |
| Phase 4: Testing | 15 min |
| **Total** | **~2 hours** |

---

## New Pages Added (Context)

These pages were added in the Inquiry Inbox feature and should be linked from dashboard:

| Page | Purpose | Link Text |
|------|---------|-----------|
| `/dashboard/inquiries` | View/manage contact form submissions | "View Inbox" |
| `/dashboard/templates` | Manage email reply templates | "Edit Templates" |
| `/dashboard/templates/new` | Create new template | (from templates page) |
| `/dashboard/templates/[id]` | Edit existing template | (from templates page) |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Removing analytics loses visibility | Move to /diagnostics, not delete |
| Gallery stats slow page load | Already cached in R2 calls |
| Inquiry count requires D1 | Already have getUnreadCount(), fail gracefully |

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/dashboard/page.tsx` | Remove clutter, add stat cards |
| `app/dashboard/diagnostics/page.tsx` | Add Cloudflare analytics section |
| `components/admin/DashboardStatCard.tsx` | NEW: Simple stat card component |
| `lib/dashboard-stats.ts` | NEW: Gallery/inquiry stat helpers |

---

*Plan created: 2025-11-26*  
*Updated: 2025-11-26 - Added Inquiry Inbox integration*  
*Ready for execution*
