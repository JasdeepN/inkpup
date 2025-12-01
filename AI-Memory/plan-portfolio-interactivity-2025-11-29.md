# Implementation Plan: Portfolio Interactivity Enhancement

**Date:** 2025-11-29  
**Research Brief:** `research-portfolio-interactivity-2025-11-29.md`  
**Status:** Planning Complete — Ready for Execution

---

## Task Definition

Transform the portfolio page from a basic grid layout into an engaging, interactive experience that:
- Catches visitors' attention with modern visual effects
- Encourages deeper exploration of the artwork
- Improves modal navigation (keyboard + touch)
- Maintains accessibility and performance standards

---

## Phase 1: Quick Wins (CSS-First Enhancements)

**Estimated Time:** 4-5 hours  
**Risk Level:** Low  
**Dependencies:** None

### 1.1 Fix RevealOnScroll in Portfolio Page
**File:** `app/portfolio/page.tsx`

- [ ] #todo Wrap intro section (`portfolio-gallery__intro`) with `RevealOnScroll` delay=0
- [ ] #todo Wrap `GalleryView` component with `RevealOnScroll` delay=100

**Tool:** Code editor (replace_string_in_file)

---

### 1.2 Enhanced Hover Overlay with Info Reveal
**Files:** `components/Gallery.tsx`, `app/styles/_gallery.scss`

- [ ] #todo Add `.gallery-card__overlay` div inside `.gallery-card__inner` (Gallery.tsx)
- [ ] #todo Move caption content into overlay for hover reveal
- [ ] #todo Add gradient background overlay CSS (bottom-to-top fade)
- [ ] #todo Add slide-up animation for caption text on hover
- [ ] #todo Add `@media (hover: hover)` guard for touch devices
- [ ] #todo Add `@media (prefers-reduced-motion: reduce)` fallback

**CSS Changes:**
```scss
.gallery-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.3s var(--animation-ease-smooth);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1rem;
  pointer-events: none;
}
```

**Tool:** Code editor, SCSS

---

### 1.3 Gradient Glow Border Animation
**File:** `app/styles/_gallery.scss`

- [ ] #todo Add `::before` pseudo-element for gradient border
- [ ] #todo Create `@keyframes gradient-shift` animation
- [ ] #todo Show gradient on hover with opacity transition
- [ ] #todo Use site accent colors (pink/blue gradient)

**CSS Changes:**
```scss
.gallery-card::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, 
    rgba(251, 113, 133, 0.5),
    rgba(96, 165, 250, 0.5),
    rgba(251, 113, 133, 0.5)
  );
  background-size: 200% 200%;
  border-radius: calc(1rem + 2px);
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease;
  animation: gradient-shift 3s ease infinite;
}
```

**Tool:** SCSS

---

### 1.4 Category Filter Count Badges
**Files:** `components/GalleryView.tsx`, `app/styles/_gallery.scss`

- [ ] #todo Track item counts per category in state
- [ ] #todo Display count badge "(12)" next to filter labels
- [ ] #todo Style badge with pill shape, muted color
- [ ] #todo Animate count change when switching categories

**Tool:** Code editor, SCSS

---

### 1.5 Filter Button Micro-interactions
**File:** `app/styles/_gallery.scss`

- [ ] #todo Add scale bounce on filter button click (`:active`)
- [ ] #todo Enhance active state with subtle glow
- [ ] #todo Add stagger animation for filter buttons on page load

**Tool:** SCSS

---

## Phase 2: Interactive Polish (JS Enhancements)

**Estimated Time:** 8-10 hours  
**Risk Level:** Medium  
**Dependencies:** Phase 1 complete

### 2.1 Keyboard Navigation in Modal
**File:** `components/GalleryView.tsx`

- [ ] #todo Add `useEffect` hook for keydown listener when modal open
- [ ] #todo Handle `ArrowRight` → next image
- [ ] #todo Handle `ArrowLeft` → previous image  
- [ ] #todo Handle `Escape` → close modal (already works via dialog)
- [ ] #todo Show nav hint UI (← →) in modal footer
- [ ] #todo Wrap navigation in View Transition for smooth morph

**Code Pattern:**
```tsx
useEffect(() => {
  if (!selected) return;
  const currentIndex = items.findIndex(item => item.id === selected.id);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' && currentIndex < items.length - 1) {
      handleSelect(items[currentIndex + 1], lastTriggerRef.current!);
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      handleSelect(items[currentIndex - 1], lastTriggerRef.current!);
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selected, items, handleSelect]);
```

**Tool:** Code editor

---

### 2.2 Mobile Swipe Gestures in Modal
**File:** `components/GalleryView.tsx`

- [ ] #todo Create `useSwipeGesture` hook for touch handling
- [ ] #todo Detect swipe left → next image
- [ ] #todo Detect swipe right → previous image
- [ ] #todo Add minimum swipe threshold (50px) to avoid accidental triggers
- [ ] #todo Respect reduced motion preference

**Hook Pattern:**
```tsx
function useSwipeGesture(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStart = useRef<number | null>(null);
  
  const handleTouchStart = (e: TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current) return;
    const delta = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) > 50) {
      delta > 0 ? onSwipeRight() : onSwipeLeft();
    }
    touchStart.current = null;
  };
  
  return { handleTouchStart, handleTouchEnd };
}
```

**Tool:** Code editor

---

### 2.3 Cursor Spotlight Effect
**Files:** `components/GalleryView.tsx`, `app/styles/_gallery.scss`

- [ ] #todo Create `useCursorPosition` hook in `lib/hooks/useCursorPosition.ts`
- [ ] #todo Track mouse position relative to gallery grid
- [ ] #todo Pass position as CSS custom properties (`--cursor-x`, `--cursor-y`)
- [ ] #todo Add `::after` pseudo-element with radial gradient spotlight
- [ ] #todo Disable effect when `prefers-reduced-motion: reduce`
- [ ] #todo Only apply on devices with hover capability

**CSS:**
```scss
.gallery-grid {
  --cursor-x: 50%;
  --cursor-y: 50%;
  position: relative;
}

@media (hover: hover) {
  .gallery-grid::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
      600px circle at var(--cursor-x) var(--cursor-y),
      rgba(251, 113, 133, 0.06),
      transparent 40%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .gallery-grid:hover::after {
    opacity: 1;
  }
}
```

**Tool:** Code editor, SCSS

---

### 2.4 Filter Transition Animations
**File:** `components/GalleryView.tsx`, `app/styles/_gallery.scss`

- [ ] #todo Add exit animation class when switching categories
- [ ] #todo Stagger entrance animation for new category items
- [ ] #todo Use `key` prop on Gallery to trigger re-mount animation
- [ ] #todo Consider using View Transitions API for category switch

**Tool:** Code editor, SCSS

---

## Phase 3: Advanced Features (Future)

**Estimated Time:** 12-16 hours  
**Risk Level:** Medium-High  
**Dependencies:** Phase 2 complete, user feedback

### 3.1 Masonry Layout (Deferred)
- [ ] #todo Research CSS Grid masonry support status
- [ ] #todo Implement CSS columns fallback
- [ ] #todo Handle image load layout shifts
- [ ] #todo Test with varied image aspect ratios

### 3.2 Infinite Scroll / Pagination (Deferred)
- [ ] #todo Implement intersection observer for load trigger
- [ ] #todo Add loading skeleton for incoming items
- [ ] #todo Consider pagination for large galleries

### 3.3 Quick Preview Tooltip (Deferred)
- [ ] #todo Create hover tooltip component
- [ ] #todo Show zoomed preview on hover (desktop only)
- [ ] #todo Position tooltip intelligently near cursor

---

## Files to Modify

| File | Phase | Changes |
|------|-------|---------|
| `app/portfolio/page.tsx` | 1 | Add RevealOnScroll wrappers |
| `components/Gallery.tsx` | 1 | Add overlay structure |
| `components/GalleryView.tsx` | 1, 2 | Count badges, keyboard nav, swipe, cursor |
| `app/styles/_gallery.scss` | 1, 2 | All CSS enhancements |
| `lib/hooks/useCursorPosition.ts` | 2 | New file: cursor tracking hook |
| `lib/hooks/useSwipeGesture.ts` | 2 | New file: swipe gesture hook |

---

## Files to Create

| File | Phase | Purpose |
|------|-------|---------|
| `lib/hooks/useCursorPosition.ts` | 2 | Track cursor position in container |
| `lib/hooks/useSwipeGesture.ts` | 2 | Handle touch swipe gestures |

---

## Testing Strategy

### Unit Tests
- [ ] #todo Test `useCursorPosition` hook returns percentages
- [ ] #todo Test `useSwipeGesture` fires callbacks correctly
- [ ] #todo Test keyboard navigation state changes

### Integration Tests (Playwright)
- [ ] #todo Screenshot comparison: hover overlay visible
- [ ] #todo Screenshot comparison: gradient glow border
- [ ] #todo Keyboard nav: arrow keys change modal image
- [ ] #todo Touch: swipe changes modal image

### Accessibility Tests
- [ ] #todo Axe-core audit on portfolio page
- [ ] #todo Screen reader testing for modal navigation
- [ ] #todo Reduced motion: verify animations disabled

### Performance Tests
- [ ] #todo Measure CLS with overlay animations
- [ ] #todo Profile with 50+ gallery items
- [ ] #todo Check for janky cursor tracking

---

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Visual engagement | Portfolio feels modern, eye-catching |
| Animation performance | 60fps, no jank |
| Accessibility | All content keyboard/screen reader accessible |
| Mobile UX | Swipe gestures work intuitively |
| Aesthetic consistency | Matches glass panel theme, pink accents |
| Bundle impact | <5KB additional JS |

---

## Execution Order

**Day 1: Phase 1.1-1.3**
1. Fix RevealOnScroll in portfolio page (15 min)
2. Add hover overlay structure to Gallery.tsx (1 hr)
3. Add overlay + glow CSS to _gallery.scss (1.5 hrs)
4. Test hover effects across browsers

**Day 2: Phase 1.4-1.5 + Phase 2.1**
1. Add category count badges (1 hr)
2. Add filter micro-interactions (30 min)
3. Implement keyboard navigation in modal (2 hrs)
4. Test keyboard nav with View Transitions

**Day 3: Phase 2.2-2.3**
1. Create useSwipeGesture hook (1 hr)
2. Integrate swipe in modal (1 hr)
3. Create useCursorPosition hook (1 hr)
4. Add cursor spotlight CSS (1 hr)
5. Test on mobile devices

**Day 4: Phase 2.4 + Testing**
1. Add filter transition animations (2 hrs)
2. Write unit tests for new hooks (1 hr)
3. Run Playwright visual regression (1 hr)
4. Accessibility audit and fixes (1 hr)

---

## Rollback Plan

If issues arise:
1. **CSS-only changes**: Revert SCSS file, no component changes needed
2. **Hook failures**: Feature flag to disable (or remove hook usage)
3. **Performance issues**: Disable cursor spotlight first (most expensive)

---

## References

- Research Brief: `memory-bank/research-portfolio-interactivity-2025-11-29.md`
- Existing Pattern: Scroll-Reveal Animations (`systemPatterns.md`)
- Existing Pattern: View Transitions API (`systemPatterns.md`)
- Existing Hook: `useReducedMotion` (`lib/animations/useReducedMotion.ts`)
