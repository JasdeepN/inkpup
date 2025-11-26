# Implementation Plan: Merge Gallery and Uploads Admin Pages

**Date:** 2025-11-26
**Research Brief:** `memory-bank/research-gallery-uploads-merge-2025-11-26.md`
**Status:** Planning Complete
**Branch:** dev

---

## 1. Main Task

Consolidate `/gallery` and `/uploads` admin pages into a single `/gallery` page with a collapsible upload panel. This eliminates navigation friction and provides a unified workflow for managing gallery images.

**Problem Statement:**
Users currently navigate between two pages to upload and manage images. Merging them into one page with a collapsible upload section streamlines the workflow.

---

## 2. Success Criteria

- [ ] Single `/gallery` page handles browse + upload
- [ ] Collapsible upload panel expands/collapses smoothly
- [ ] Category selection syncs between tabs and upload form
- [ ] JobSummary visible as compact status badge in header
- [ ] Mobile-responsive (stacks vertically)
- [ ] `/uploads` redirects to `/gallery`
- [ ] AdminNav updated (Uploads link removed)
- [ ] All tests pass
- [ ] Build passes

---

## 3. Major Components

| # | Component | Description | Effort |
|---|-----------|-------------|--------|
| 1 | GalleryUploadPanel | New client component - collapsible upload section | Medium |
| 2 | Gallery Page Update | Integrate upload panel, fetch jobSummary | Low |
| 3 | AdminNav Update | Remove Uploads link | Trivial |
| 4 | Uploads Redirect | Redirect /uploads → /gallery | Trivial |
| 5 | Cleanup | Archive /uploads folder | Trivial |
| 6 | Tests | Update gallery tests, verify upload panel | Low |

---

## 4. Actionable Steps

### Phase 1: Create GalleryUploadPanel Component

#### Step 1.1: Create Component File
**File:** `components/admin/GalleryUploadPanel.tsx`

```tsx
'use client';
// Props: category, jobSummary, canMutate
// State: isExpanded (default false)
// Content:
//   - Header: "Upload to [Category]" + toggle button
//   - Body (when expanded): UploadForm + JobSummary details
```

**Features:**
- Collapsible panel with smooth animation
- Category passed as prop, pre-selects in UploadForm
- JobSummary details shown when expanded
- Compact job count badge in header

**Tool:** create_file

---

#### Step 1.2: Style the Panel
**File:** `app/styles/_admin.scss`

Add styles for:
- `.gallery-upload-panel` container
- `.gallery-upload-panel__header` with expand/collapse toggle
- `.gallery-upload-panel__content` with collapse animation
- Status badge styling

**Tool:** replace_string_in_file

---

### Phase 2: Update Gallery Page

#### Step 2.1: Add jobSummary Fetch
**File:** `app/gallery/page.tsx`

Add import and fetch:
```tsx
import { getUploadJobSummary } from '../../lib/r2-server';
// ...
const jobSummary = await getUploadJobSummary();
```

**Tool:** replace_string_in_file

---

#### Step 2.2: Add Upload Panel to Page
**File:** `app/gallery/page.tsx`

Insert GalleryUploadPanel between category nav and gallery grid:
```tsx
<GalleryUploadPanel 
  category={category}
  jobSummary={jobSummary}
  canMutate={canMutate}
/>
```

**Tool:** replace_string_in_file

---

#### Step 2.3: Add Job Count Badge to Header
**File:** `app/gallery/page.tsx`

Add pending job count indicator next to page title:
```tsx
<h1>Gallery management {pendingJobs > 0 && <span className="badge">{pendingJobs}</span>}</h1>
```

**Tool:** replace_string_in_file

---

### Phase 3: Update Navigation

#### Step 3.1: Remove Uploads Link from AdminNav
**File:** `components/admin/AdminNav.tsx`

Remove:
```tsx
<Link href="/uploads" className="nav-link">
  Uploads
</Link>
```

**Tool:** replace_string_in_file

---

### Phase 4: Handle /uploads Redirect

#### Step 4.1: Create Redirect
**File:** `app/uploads/page.tsx`

Replace content with redirect:
```tsx
import { redirect } from 'next/navigation';

export default function UploadsPage() {
  redirect('/gallery');
}
```

Or use `next.config.js` redirects.

**Tool:** replace_string_in_file

---

### Phase 5: Testing

#### Step 5.1: Update Gallery Page Tests
**File:** `app/gallery/__tests__/page.test.tsx`

Add tests for:
- Upload panel renders when expanded
- Collapse/expand toggle works
- Category passed correctly to upload form
- JobSummary displays in panel

**Tool:** replace_string_in_file

---

#### Step 5.2: Create GalleryUploadPanel Tests
**File:** `components/admin/GalleryUploadPanel.test.tsx`

Test:
- Renders collapsed by default
- Expands on toggle click
- Shows job count badge
- Passes category to UploadForm

**Tool:** create_file

---

### Phase 6: Cleanup

#### Step 6.1: Archive Uploads Layout
**File:** `app/uploads/layout.tsx`

Delete or archive to `archive/removed/`

**Tool:** run_in_terminal (rm or mv)

---

#### Step 6.2: Run Build & Tests
**Commands:**
```bash
npm run build
npm test -- --testPathIgnorePatterns="e2e|playwright" --forceExit
```

**Tool:** run_in_terminal

---

## 5. #todos

### Phase 1: Component
- [ ] #todo Create `components/admin/GalleryUploadPanel.tsx` with collapsible state
- [ ] #todo Add collapse/expand animation styles to `_admin.scss`

### Phase 2: Integration
- [ ] #todo Update `app/gallery/page.tsx` to fetch jobSummary
- [ ] #todo Add GalleryUploadPanel to gallery page
- [ ] #todo Add job count badge to page header

### Phase 3: Navigation
- [ ] #todo Remove Uploads link from AdminNav

### Phase 4: Redirect
- [ ] #todo Replace `/uploads` page with redirect to `/gallery`
- [ ] #todo Delete or archive `/uploads/layout.tsx`

### Phase 5: Testing
- [ ] #todo Update gallery page tests for upload panel
- [ ] #todo Create GalleryUploadPanel.test.tsx

### Phase 6: Verification
- [ ] #todo Run build and verify no errors
- [ ] #todo Run tests and verify all pass
- [ ] #todo Manual test: expand panel, upload image, see it in gallery

---

## 6. Tools & Dependencies

| Step | Tool/Function |
|------|---------------|
| Create component | `create_file` |
| Update page | `replace_string_in_file` |
| Update styles | `replace_string_in_file` |
| Update nav | `replace_string_in_file` |
| Create redirect | `replace_string_in_file` |
| Create tests | `create_file` |
| Run build/tests | `run_in_terminal` |
| Archive files | `run_in_terminal` |

**Existing Dependencies (reused):**
- `UploadForm` component
- `JobSummary` component
- `getUploadJobSummary()` function
- `hasR2Credentials()` function

---

## 7. Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| UploadForm expects different props | Low | Medium | Check UploadForm interface, pass required props |
| Mobile layout issues | Low | Medium | Use existing collapse pattern, test on mobile viewport |
| Test failures | Medium | Low | Update imports and assertions, run incrementally |
| Users bookmark /uploads | Low | Low | Redirect handles this seamlessly |

---

## 8. Estimated Time

| Phase | Steps | Time |
|-------|-------|------|
| Phase 1: Component | 1.1, 1.2 | 30 min |
| Phase 2: Integration | 2.1, 2.2, 2.3 | 20 min |
| Phase 3: Navigation | 3.1 | 5 min |
| Phase 4: Redirect | 4.1 | 5 min |
| Phase 5: Testing | 5.1, 5.2 | 30 min |
| Phase 6: Verification | 6.1, 6.2 | 15 min |
| **Total** | | **~1.5-2 hours** |

---

## 9. Execution Order

```
Phase 1 ──────────────────────────────────────────────────────────
   │
   ├─ 1.1 Create GalleryUploadPanel.tsx
   │
   └─ 1.2 Add panel styles
           │
Phase 2 ──┼──────────────────────────────────────────────────────
           │
           ├─ 2.1 Fetch jobSummary in gallery page
           │
           ├─ 2.2 Add upload panel to page
           │
           └─ 2.3 Add job count badge
                   │
Phase 3 ───────────┼─────────────────────────────────────────────
                   │
                   └─ 3.1 Update AdminNav
                           │
Phase 4 ───────────────────┼─────────────────────────────────────
                           │
                           └─ 4.1 Redirect /uploads
                                   │
Phase 5 ───────────────────────────┼─────────────────────────────
                                   │
                                   ├─ 5.1 Update gallery tests
                                   │
                                   └─ 5.2 Create panel tests
                                           │
Phase 6 ───────────────────────────────────┼─────────────────────
                                           │
                                           ├─ 6.1 Archive /uploads
                                           │
                                           └─ 6.2 Build & test verification
```

---

## 10. File Summary

**New Files:**
- `components/admin/GalleryUploadPanel.tsx` - Collapsible upload panel
- `components/admin/GalleryUploadPanel.test.tsx` - Panel tests

**Modified Files:**
- `app/gallery/page.tsx` - Add upload panel integration
- `app/styles/_admin.scss` - Add panel styles
- `components/admin/AdminNav.tsx` - Remove Uploads link
- `app/uploads/page.tsx` - Replace with redirect
- `app/gallery/__tests__/page.test.tsx` - Add panel tests

**Archived Files:**
- `app/uploads/layout.tsx` → `archive/removed/uploads.layout.2025-11-26.tsx`

---

## 11. Rollback Plan

If issues arise:
1. **Component fails**: Keep /uploads page active, don't remove link
2. **Test failures**: Fix tests before merging, don't skip
3. **Build breaks**: Check imports, revert if needed

---

*Plan complete. Ready for Execute.prompt.md.*
