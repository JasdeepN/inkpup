# Plan: Gallery UI Polish

**Date:** 2025-11-26  
**Status:** ✅ COMPLETE  
**Related:** `plan-gallery-uploads-merge-2025-11-26.md`

---

## Task Definition

Fix three UI issues in the Gallery admin accordion view:

1. **Visible line when accordion expanded** - Remove or add gap between header line and upload panel
2. **Accordion toggle animation not working** - Currently using conditional render, need CSS animation
3. **Image click opens new tab** - Should open a modal/lightbox instead

---

## Breakdown

### Issue 1: Accordion Border Line
**Problem:** `.gallery-section__content` has `border-top: 1px solid rgba(255, 255, 255, 0.1)` which creates a visible separator line.

**Solution Options:**
- A) Remove border-top entirely
- B) Add margin-top to first child (upload panel) to create visual gap
- C) Change border to transparent when expanded

**Decision:** Option A - Remove border-top, let natural spacing handle separation

### Issue 2: Accordion Animation
**Problem:** Using `{isExpanded && <content>}` which removes DOM elements, preventing CSS animation.

**Solution:** Keep content in DOM, use CSS height/opacity animation with `max-height` or `grid-template-rows` trick.

**Implementation:**
- Always render content div
- Use `aria-hidden` for accessibility
- Animate with CSS `max-height: 0` → `max-height: 1000px` (or grid-rows trick)

### Issue 3: Image Modal
**Problem:** Images use `<a href={src} target="_blank">` opening in new tab.

**Solution:** Create a simple image modal component that opens on click.

**Implementation:**
- Create `ImageModal.tsx` component with backdrop + large image
- Add state to GallerySection for selected image
- Close on backdrop click, escape key, or X button

---

## #todos

- [ ] #todo Remove border-top from `.gallery-section__content`
- [ ] #todo Add slight margin/gap above upload panel inside content
- [ ] #todo Refactor GallerySection to always render content (hidden when collapsed)
- [ ] #todo Add CSS animation for accordion expand/collapse
- [ ] #todo Create `ImageModal.tsx` component
- [ ] #todo Update GallerySection to use modal instead of new tab link
- [ ] #todo Test accordion animation and modal functionality
- [ ] #todo Run build and tests

---

## Tools

- SCSS editing for styles
- React component creation for modal
- Jest for testing

---

## Success Criteria

- [ ] No visible line between accordion header and content
- [ ] Smooth expand/collapse animation on accordion toggle
- [ ] Clicking image opens modal with larger view
- [ ] Modal closes on backdrop click or escape key
- [ ] Build passes
- [ ] Tests pass

---

## Notes

The animation approach using `max-height` can be jumpy if the value is too high vs actual content height. Alternative is using CSS Grid with `grid-template-rows: 0fr` → `1fr` which is smoother but requires wrapper div.
