# Research Brief: Merge Gallery and Uploads Admin Pages

## Problem Statement
The admin interface has two separate pages (/gallery and /uploads) that handle related functionality:
- **Gallery**: Browse images by category, delete, add to hero
- **Uploads**: Upload new images, view job queue status

This separation creates unnecessary navigation friction. Users upload, then navigate to gallery to see results. A unified page would streamline the workflow.

## Context
- **Related Work:** Hero page consolidation, pricing layout with preview panel
- **Current State:** 
  - `/gallery` - Read/delete operations, category-based browsing
  - `/uploads` - Create operation, job queue monitoring
  - Both have identical layout.tsx (auth logic duplicated)
- **Constraints:** Must maintain mobile responsiveness, preserve existing component tests

## Research Findings

### Current Page Analysis

**Gallery Page (/gallery):**
- Category navigation tabs (healed, available, fresh, flash, portfolio, hero)
- Image grid with metadata (size, date, R2 key)
- Actions: View, Delete, Add to Hero
- ~130 lines, server component

**Uploads Page (/uploads):**
- Hero section with intro copy
- JobSummary card (queued, scheduled, dead-lettered counts)
- UploadForm component (category selector, file input, alt/caption)
- Workflow tips sidebar
- ~65 lines, server component

**Shared Layout (identical in both):**
- Admin auth verification
- AdminNav component
- Same structure (~25 lines each, exact duplicates)

### Approach Options

#### Option A: Gallery + Sidebar Upload Panel
- **Description:** Add fixed right sidebar with upload form and job status
- **Pros:** Everything visible at once, familiar sidebar pattern
- **Cons:** Cramped on mobile, reduces gallery grid width, always visible even when not needed
- **Effort:** Medium

#### Option B: Gallery + Modal Upload
- **Description:** Add "Upload" button that opens modal with form
- **Pros:** Clean gallery view when not uploading
- **Cons:** Can't see gallery while uploading, context switch
- **Effort:** Low

#### Option C: Gallery with Tabbed Sections
- **Description:** Tabs for "Browse", "Upload", "Queue"
- **Pros:** Clear separation, familiar tab pattern
- **Cons:** Still feels like multiple pages, extra clicks
- **Effort:** Medium

#### Option D: Gallery + Collapsible Upload Section (Recommended)
- **Description:** Expandable upload panel at top of gallery, collapses when done
- **Pros:** 
  - Single page, contextual workflow
  - Upload collapses to save space
  - Category pre-selected from current tab
  - Job status always visible as badge
  - Mobile-friendly (stacks vertically)
- **Cons:** Slightly more complex state management
- **Effort:** Medium

### Recommended Approach: Option D

**Rationale:**
1. Best user workflow: See gallery → decide to upload → expand form → upload → collapse → see new image
2. Category context preserved (uploading to currently-viewed category)
3. Job status as compact badge doesn't clutter UI
4. Collapsible pattern used elsewhere (price breakdown preview panel)
5. Mobile-first: vertical stacking works naturally

### Technical Considerations

**New Component: GalleryUploadPanel.tsx**
```tsx
'use client';
// Collapsible panel containing:
// - Compact header: "Upload to [Category]" + job count badge + expand/collapse toggle
// - Expandable content: UploadForm + JobSummary details
// - Props: category, jobSummary, canMutate
```

**Page Structure:**
```
/gallery
├── Header: "Gallery Management" + [Queue: N] badge + [Upload ▼] button
├── Category Nav: Healed | Available | Fresh | Flash | Portfolio | Hero
├── Upload Panel (collapsible, client component)
│   ├── UploadForm (reused, category pre-filled)
│   └── JobSummary details (when expanded)
└── Gallery Grid (existing)
```

**Dependencies:**
- Reuse existing: UploadForm, JobSummary components
- New: GalleryUploadPanel wrapper component
- Modify: gallery/page.tsx, AdminNav

**Integration Points:**
- `getUploadJobSummary()` - Already exists, fetch in gallery page
- `hasR2Credentials()` - Already used in gallery page
- Category state - Pass current category to upload form

**Testing Strategy:**
- Update gallery page tests to include upload section
- Keep UploadForm component tests unchanged
- Add test for expand/collapse behavior
- E2E: upload → verify image appears in gallery

**Deployment Impact:**
- Redirect /uploads → /gallery (preserve bookmarks)
- Update AdminNav links
- No database changes

### Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Mobile layout breaks | Medium | Low | Use collapsible panel, test on mobile viewport |
| Upload form state lost on collapse | Medium | Low | Keep form mounted when collapsed, just hidden |
| Breaking existing tests | Medium | Medium | Update test imports/paths, run full suite |
| Users confused by missing /uploads | Low | Medium | Add redirect, update any documentation |

## Implementation Readiness

### Prerequisites
- [x] Current page structure analyzed
- [x] Component dependencies identified  
- [x] Design approach selected
- [x] Mobile considerations addressed

### Success Criteria
- [ ] Single /gallery page handles browse + upload
- [ ] Category selection syncs between tabs and upload form
- [ ] JobSummary visible as compact status indicator
- [ ] Collapsible upload panel works on mobile
- [ ] All existing tests pass (updated as needed)
- [ ] Build passes
- [ ] /uploads redirects to /gallery

### Next Steps for Planning
1. Create GalleryUploadPanel.tsx client component
2. Update gallery/page.tsx to fetch jobSummary and include panel
3. Update AdminNav to remove Uploads link
4. Add redirect from /uploads to /gallery
5. Update/create tests
6. Archive /uploads folder

## References
- Current gallery: `app/gallery/page.tsx`
- Current uploads: `app/uploads/page.tsx`
- UploadForm: `components/admin/UploadForm.tsx`
- JobSummary: `components/admin/JobSummary.tsx`
- Similar pattern: PriceBreakdownPreview (collapsible panel)

---
*Research complete. Ready for Plan.prompt.md.*
