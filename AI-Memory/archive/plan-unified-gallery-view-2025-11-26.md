# Implementation Plan: Unified Gallery View

**Date:** 2025-11-26  
**Research Brief:** `memory-bank/research-unified-gallery-view-2025-11-26.md`  
**Status:** Planning Complete  
**Branch:** dev

---

## 1. Main Task

Convert the gallery management page from a tabbed single-category view to a unified accordion-style view showing all categories on one page. Users will see all gallery sections at once, with collapsible panels per category containing images and upload functionality.

**Current State:**
- Tab navigation between categories (requires page refresh)
- Single category visible at a time
- Upload panel targets current category

**Target State:**
- All categories visible as collapsible sections
- Image counts visible in section headers
- Each section has its own upload panel
- No page refresh needed to see different categories

---

## 2. Success Criteria

- [ ] All 5 categories visible on one page (Healed, Available, Flash, Art, Hero)
- [ ] Section headers show image count: `📁 Healed (12 images)`
- [ ] Sections expand/collapse independently
- [ ] Each section contains image grid + upload panel
- [ ] First section expanded by default, others collapsed
- [ ] Performance: Initial load < 3s
- [ ] Mobile responsive
- [ ] All existing functionality preserved (delete, view, add-to-hero)
- [ ] Build passes, tests pass

---

## 3. Major Components

| # | Component | Description | Effort |
|---|-----------|-------------|--------|
| 1 | GallerySection | New client component - collapsible category section | Medium |
| 2 | GallerySectionList | Client wrapper managing expand/collapse state | Low |
| 3 | Gallery Page Refactor | Fetch all categories, render section list | Medium |
| 4 | Remove Tab Navigation | Replace tabs with accordion sections | Low |
| 5 | Styles | Section accordion styles | Low |
| 6 | Tests | Update existing, add new component tests | Low |

**Estimated Total:** ~2-3 hours

---

## 4. Actionable Steps

### Phase 1: Create GallerySection Component

#### Step 1.1: Create Component File
**File:** `components/admin/GallerySection.tsx`

```tsx
// Client component
// Props: category, images, jobSummary, canMutate, isExpanded, onToggle
// Content:
//   - Collapsible header with category name + image count
//   - Image grid (existing pattern)
//   - GalleryUploadPanel (existing component)
```

**Features:**
- Receives category data as props
- Header shows: `📁 {CategoryLabel} ({count} images) [▼/▶]`
- Body contains image grid + upload panel
- Calls `onToggle(category)` when header clicked

**Tool:** `create_file`

---

#### Step 1.2: Create GallerySectionList Wrapper
**File:** `components/admin/GallerySectionList.tsx`

```tsx
// Client component - manages expand/collapse state
// Props: categories (data for all categories), jobSummary, canMutate
// State: expandedSections: Set<string>
// Default: first category expanded
```

**Features:**
- Manages which sections are expanded
- Passes `isExpanded` and `onToggle` to each GallerySection
- Renders all categories in order

**Tool:** `create_file`

---

### Phase 2: Update Gallery Page

#### Step 2.1: Fetch All Categories
**File:** `app/gallery/page.tsx`

Replace single category fetch with parallel fetch:
```tsx
const allGalleries = await Promise.all(
  GALLERY_CATEGORIES.map(async (cat) => ({
    category: cat,
    images: await listGalleryImages(cat).asPromise(),
  }))
);
```

**Tool:** `replace_string_in_file`

---

#### Step 2.2: Remove Tab Navigation
**File:** `app/gallery/page.tsx`

Remove:
- `searchParams` category extraction
- Category tab navigation `<nav>` block
- Single category image grid

Replace with:
```tsx
<GallerySectionList
  categories={allGalleries}
  jobSummary={jobSummary}
  canMutate={canMutate}
/>
```

**Tool:** `replace_string_in_file`

---

#### Step 2.3: Update Page Header
**File:** `app/gallery/page.tsx`

Keep:
- Page title with job count badge
- Overall pending jobs indicator

Remove:
- Category-specific title ("Healed gallery")

**Tool:** `replace_string_in_file`

---

### Phase 3: Add Styles

#### Step 3.1: Add Section Styles
**File:** `app/styles/_admin.scss`

```scss
.gallery-section {
  // Collapsible section container
}

.gallery-section__header {
  // Clickable header with category + count
  // Expand/collapse toggle icon
}

.gallery-section__content {
  // Image grid + upload panel
}

.gallery-section__count {
  // Badge showing image count
}
```

**Tool:** `replace_string_in_file`

---

### Phase 4: Cleanup & Refactor

#### Step 4.1: Remove Standalone Upload Panel Import
**File:** `app/gallery/page.tsx`

The GalleryUploadPanel is now embedded in each GallerySection, so:
- Remove top-level `<GalleryUploadPanel>` from page
- Each section handles its own upload

**Tool:** `replace_string_in_file`

---

#### Step 4.2: Update DeleteButton/AddToHeroButton
**File:** `app/gallery/DeleteButton.tsx`, `app/gallery/AddToHeroButton.tsx`

Verify these work with the new structure:
- They already receive `category` as prop
- Should work without changes

**Tool:** Review only (likely no changes needed)

---

### Phase 5: Testing

#### Step 5.1: Update Gallery Page Tests
**File:** `app/gallery/__tests__/page.test.tsx`

Update mocks and tests for:
- Multiple category fetches
- GallerySectionList rendering
- Remove tab navigation tests

**Tool:** `replace_string_in_file`

---

#### Step 5.2: Create GallerySection Tests
**File:** `components/admin/GallerySection.test.tsx`

Test:
- Renders header with category name and count
- Expand/collapse toggle works
- Image grid renders when expanded
- Upload panel renders when expanded

**Tool:** `create_file`

---

#### Step 5.3: Create GallerySectionList Tests
**File:** `components/admin/GallerySectionList.test.tsx`

Test:
- Renders all categories
- First section expanded by default
- Toggle expands/collapses sections
- Multiple sections can be expanded

**Tool:** `create_file`

---

### Phase 6: Verification

#### Step 6.1: Build Check
```bash
npm run build
```

**Tool:** `run_in_terminal`

---

#### Step 6.2: Test Suite
```bash
npm test -- --testPathIgnorePatterns="e2e|playwright" --forceExit
```

**Tool:** `run_in_terminal`

---

#### Step 6.3: Manual Testing
- [ ] All categories visible on page load
- [ ] Section headers show correct counts
- [ ] Expand/collapse works smoothly
- [ ] Upload to each category works
- [ ] Delete from each category works
- [ ] Add-to-hero works (non-hero sections)
- [ ] Mobile layout works

**Tool:** Manual browser testing

---

## 5. #todos

### Phase 1: Components
- [ ] #todo Create `components/admin/GallerySection.tsx` - collapsible category section
- [ ] #todo Create `components/admin/GallerySectionList.tsx` - state management wrapper

### Phase 2: Page Refactor
- [ ] #todo Update `app/gallery/page.tsx` - fetch all categories in parallel
- [ ] #todo Remove tab navigation from gallery page
- [ ] #todo Integrate GallerySectionList into page

### Phase 3: Styles
- [ ] #todo Add `.gallery-section` styles to `_admin.scss`

### Phase 4: Cleanup
- [ ] #todo Remove standalone GalleryUploadPanel from page (now in sections)
- [ ] #todo Verify DeleteButton/AddToHeroButton compatibility

### Phase 5: Testing
- [ ] #todo Update `app/gallery/__tests__/page.test.tsx` for new structure
- [ ] #todo Create `GallerySection.test.tsx`
- [ ] #todo Create `GallerySectionList.test.tsx`

### Phase 6: Verification
- [ ] #todo Run build and verify no errors
- [ ] #todo Run test suite
- [ ] #todo Manual testing checklist

---

## 6. Execution Order

```
Phase 1 (Components)
    ↓
Phase 2 (Page Refactor) 
    ↓
Phase 3 (Styles)
    ↓
Phase 4 (Cleanup)
    ↓
Phase 5 (Testing)
    ↓
Phase 6 (Verification)
```

**Dependencies:**
- Phase 2 depends on Phase 1 (needs components to exist)
- Phase 3-4 can run in parallel after Phase 2
- Phase 5-6 run after all code changes

---

## 7. Tools & Dependencies

| Step | Tool/Function |
|------|---------------|
| Create components | `create_file` |
| Update page | `replace_string_in_file` |
| Update styles | `replace_string_in_file` |
| Update tests | `replace_string_in_file`, `create_file` |
| Build check | `run_in_terminal` |
| Test suite | `run_in_terminal` |

**Existing Dependencies (reuse):**
- `GalleryUploadPanel` - embed in each section
- `DeleteButton` - use as-is
- `AddToHeroButton` - use as-is
- `listGalleryImages()` - call for each category
- `getUploadJobSummary()` - single call, share across sections
- `GALLERY_CATEGORIES` - iterate for section order

---

## 8. File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `components/admin/GallerySection.tsx` | **New** | Collapsible category section |
| `components/admin/GallerySectionList.tsx` | **New** | State management wrapper |
| `app/gallery/page.tsx` | **Modify** | Fetch all, render section list |
| `app/styles/_admin.scss` | **Modify** | Add section styles |
| `app/gallery/__tests__/page.test.tsx` | **Modify** | Update for new structure |
| `components/admin/GallerySection.test.tsx` | **New** | Component tests |
| `components/admin/GallerySectionList.test.tsx` | **New** | Component tests |

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Performance with many images | Fetch in parallel, images already lazy-load via next/image |
| Breaking existing delete/hero buttons | They receive category as prop, should work unchanged |
| Upload to wrong category | Each section clearly labeled, upload panel shows category |
| Losing URL deep links | Can add `?expanded=healed,flash` support later if needed |

---

## 10. Open Decisions (for implementation)

1. **Default expanded:** First category (Healed) — can adjust based on feedback
2. **Multiple expand:** Allow multiple sections open simultaneously
3. **Animation:** Simple CSS transition for expand/collapse
4. **Hero section:** Keep at end of list, no special treatment for now

---

## References

- Research Brief: `memory-bank/research-unified-gallery-view-2025-11-26.md`
- Existing upload panel: `components/admin/GalleryUploadPanel.tsx`
- Gallery page: `app/gallery/page.tsx`
- Admin styles: `app/styles/_admin.scss`

---

*Plan complete. Ready for execution phase.*
