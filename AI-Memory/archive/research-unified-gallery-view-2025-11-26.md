# Research Brief: Unified Gallery Management View

**Date:** 2025-11-26  
**Status:** Brainstorm/Outline Only  
**Related:** Gallery/Uploads merge completed same day

---

## Problem Statement

Currently, the gallery management page shows **one category at a time**. Users must:
1. Click a category tab (Healed, Available, Flash, Art, Hero)
2. Wait for page refresh
3. View images in that category
4. Repeat to see other categories

**Pain Point:** Cannot see all gallery images at once without navigating between tabs. This creates friction when:
- Checking what content exists across categories
- Comparing image counts
- Moving images between categories (future feature)
- Getting a holistic view of gallery inventory

---

## Current State

```
┌─────────────────────────────────────────────────┐
│ Gallery Management                              │
├─────────────────────────────────────────────────┤
│ [Healed] [Available] [Flash] [Art] [Hero]       │  ← Tab navigation
├─────────────────────────────────────────────────┤
│ ┌─ Upload to Healed ─────────────────────[▼]─┐  │  ← Collapsible panel
│ └────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│ Healed gallery                                  │
│ [img] [img] [img] [img] [img] [img]             │  ← Only ONE category
│ [img] [img] [img] [img] [img] [img]             │
└─────────────────────────────────────────────────┘
```

**Technical:** `listGalleryImages(category)` fetches single category via URL param.

---

## Approach Options

### Option A: Add "All" Tab to Existing View

**Description:** Keep current tab structure, add "All" as first/default tab showing grouped sections.

```
[All] [Healed] [Available] [Flash] [Art] [Hero]
      ↑ existing tabs still work
```

**Pros:**
- Minimal code change
- Familiar UX preserved
- Optional focused view still available

**Cons:**
- "All" view still needs new component
- Two mental models (tabs vs sections)
- Doesn't fully solve the navigation friction

**Effort:** Medium

---

### Option B: Unified Grid with Filter Chips

**Description:** Single flat grid showing ALL images with category badges. Filter chips toggle visibility.

```
Filter: [🔘 All] [✓ Healed] [✓ Available] [Flash] [Art] [Hero]

┌──────┬──────┬──────┬──────┬──────┬──────┐
│ img  │ img  │ img  │ img  │ img  │ img  │
│ 🏷️H  │ 🏷️A  │ 🏷️H  │ 🏷️F  │ 🏷️A  │ 🏷️H  │
└──────┴──────┴──────┴──────┴──────┴──────┘
```

**Pros:**
- Maximum flexibility
- Modern filter UX
- Easy multi-category selection

**Cons:**
- Loses visual category grouping
- Could feel overwhelming with many images
- Category context less clear

**Effort:** Medium-High

---

### Option C: Accordion Sections per Category ⭐ RECOMMENDED

**Description:** All categories visible on one page as collapsible sections. Each section shows images + upload panel.

```
┌─────────────────────────────────────────────────────────┐
│ 📁 Healed (12 images)                              [▼]  │
├─────────────────────────────────────────────────────────┤
│ [img] [img] [img] [img] [img] [img]                     │
│ [img] [img] [img] [img] [img] [img]                     │
│ ┌─ Upload to Healed ───────────────────────────[▼]─┐    │
│ └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📁 Available (8 images)                            [▶]  │ ← collapsed
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📁 Flash (3 images)                                [▶]  │ ← collapsed
└─────────────────────────────────────────────────────────┘
```

**Pros:**
- Clear visual organization by category
- See all category counts at a glance
- Reuses existing collapsible panel pattern
- Progressive disclosure (expand what you need)
- Each section has contextual upload
- Mobile-friendly vertical layout

**Cons:**
- More vertical scrolling
- Sections might feel disconnected
- Loading all categories upfront (mitigated by lazy loading)

**Effort:** Medium

---

### Option D: Dashboard Lanes (Horizontal Scroll)

**Description:** Category "lanes" that scroll horizontally, dashboard-style.

```
Healed ────────────────────────────────── [See all →]
[img] [img] [img] [img] [img] →→→

Available ─────────────────────────────── [See all →]
[img] [img] [img] [img] →→→
```

**Pros:**
- Compact, visual overview
- Dashboard aesthetic
- Quick scanning

**Cons:**
- Limited image visibility per category
- Horizontal scrolling can be awkward
- Complex implementation
- Not great for bulk operations

**Effort:** High

---

## Recommended Approach: Option C (Accordion Sections)

### Rationale

1. **Consistent Pattern** — We just implemented collapsible panels for the upload feature. Users already understand expand/collapse.

2. **Clear Organization** — Categories remain visually distinct with clear boundaries.

3. **At-a-Glance Counts** — Collapsed headers show `📁 Healed (12 images)` — instant inventory view.

4. **Contextual Uploads** — Each section can have its own upload panel, maintaining category context.

5. **Performance** — Lazy load images when section expands (only fetch what's viewed).

6. **Mobile UX** — Vertical accordion is the most mobile-friendly pattern.

---

## Technical Considerations

### Data Fetching Strategy

**Option 1: Fetch All Upfront**
```typescript
const allGalleries = await Promise.all(
  GALLERY_CATEGORIES.map(cat => listGalleryImages(cat).asPromise())
);
```
- Simple implementation
- Initial load slower with many images
- Good for small galleries

**Option 2: Lazy Load on Expand**
```typescript
// Server component fetches counts only
// Client component fetches images when section expands
const [images, setImages] = useState<Record<string, GalleryItem[]>>({});
const loadCategory = async (cat: string) => {
  if (!images[cat]) {
    const data = await fetch(`/api/gallery?category=${cat}`);
    setImages(prev => ({ ...prev, [cat]: data.items }));
  }
};
```
- Better initial performance
- Requires API endpoint or server action
- More complex state management

**Recommendation:** Start with Option 1 (fetch all) — galleries are typically small. Optimize later if needed.

### Component Structure

```
app/gallery/page.tsx (server)
├── GallerySectionList.tsx (client) — manages expand/collapse state
│   ├── GallerySection.tsx (per category)
│   │   ├── Section header (count, expand toggle)
│   │   ├── Image grid
│   │   └── GalleryUploadPanel.tsx (existing)
│   └── ... repeat for each category
```

### State Management

- **Expanded sections:** `useState<Set<string>>` — which categories are expanded
- **Default state:** First category expanded, others collapsed? Or all collapsed?
- **URL persistence:** `?expanded=healed,available` for shareable state?

### Styling

Reuse existing:
- `.gallery-upload-panel` styles for section containers
- `.admin-gallery__grid` for image grids
- `.admin-card` for glass-panel look

New styles needed:
- `.gallery-section` wrapper
- `.gallery-section__header` with count badge
- Transition animations for expand/collapse

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Performance with 100+ images | Medium | Medium | Lazy load, virtualization if needed |
| Loss of focused single-category view | Low | Low | Keep URL param support `?category=healed` for direct links |
| Confusing Hero section (special purpose) | Low | Medium | Visual distinction, keep at bottom or highlight |
| Upload to wrong category | Low | Low | Category clearly labeled in each section |

---

## Open Questions

1. **Default expanded state?**
   - All collapsed (compact overview)?
   - First category expanded?
   - Remember user preference (localStorage)?

2. **Keep tab navigation as alternative?**
   - Add toggle: "Grid view" vs "Section view"?
   - Or fully replace tabs?

3. **Global upload vs per-section?**
   - Current: Upload panel per section
   - Alternative: Single global upload with category dropdown
   - Or both?

4. **Hero category special treatment?**
   - Hero is used for homepage carousel
   - Should it have visual distinction?
   - Show at top or bottom?

5. **Bulk operations?**
   - Future: Select multiple images across categories
   - Move between categories
   - Bulk delete

---

## Success Criteria

- [ ] All categories visible on one page
- [ ] Can see image counts per category without expanding
- [ ] Can upload to any category without page navigation
- [ ] Performance acceptable (<3s initial load)
- [ ] Mobile-responsive layout
- [ ] Maintains current functionality (delete, view, add-to-hero)

---

## Next Steps (if approved)

1. Create implementation plan (Plan.prompt.md)
2. Build `GallerySection` component
3. Update `app/gallery/page.tsx` to fetch all categories
4. Add expand/collapse state management
5. Style accordion sections
6. Test performance with real data
7. Consider lazy loading optimization

---

## References

- Current gallery page: `app/gallery/page.tsx`
- Upload panel pattern: `components/admin/GalleryUploadPanel.tsx`
- Collapsible styles: `.gallery-upload-panel` in `_admin.scss`
- Gallery types: `lib/gallery-types.ts` (GALLERY_CATEGORIES)

---

*This is a brainstorm/outline only. No implementation without approval.*
