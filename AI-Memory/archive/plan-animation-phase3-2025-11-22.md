# Task Breakdown and Action Plan: Animation Phase 3 - View Transitions API

**Date:** 2025-11-22  
**Status:** Planning Complete - Awaiting Phase 1 & 2 Completion  
**Priority:** Medium-Low (Cutting-Edge Enhancement)  
**Estimated Effort:** 2-3 days  

---

## 1. Main Task

**Task:** Implement Phase 3 View Transitions API for native page navigation morphing, modal animations, and image expansion transitions while maintaining progressive enhancement with graceful fallbacks for the 14% of browsers without support.

**Success Criteria:**
- ✅ View Transitions helper utilities created and tested
- ✅ Page navigation transitions working (flash ↔ custom ↔ portfolio)
- ✅ Gallery modal open/close morphing implemented
- ✅ Image thumbnail to full-size expansion smooth
- ✅ Feature detection with graceful fallback
- ✅ Browser support: Works in Chrome 111+, Edge 111+, Safari 18+
- ✅ Fallback: Instant transitions for unsupported browsers
- ✅ Bundle size increase ≤3KB (gzipped)
- ✅ 238 tests + Phase 2 tests remain passing
- ✅ Build successful with no performance degradation
- ✅ Lighthouse score ≥95 maintained

---

## 2. Major Components

### Component A: View Transitions Foundation
Feature detection, polyfill evaluation, and base utilities

### Component B: Page Navigation Transitions
Route-level morphing between pages

### Component C: Gallery Modal Transitions
Smooth open/close with element morphing

### Component D: Image Expansion Transitions
Thumbnail to full-size with shared element animation

### Component E: Tab/State Transitions
Internal page state changes with smooth morphing

### Component F: Documentation & Testing
Browser testing, fallback verification, and performance validation

---

## 3. Actionable Steps for Each Component

### Component A: View Transitions Foundation

**A1. Feature detection utility**
- Create `lib/animations/viewTransitions.ts`
- Check for `document.startViewTransition` support
- Return boolean feature flag
- Cache result to avoid repeated checks

**A2. Transition wrapper helper**
- Create `startViewTransition` wrapper function
- Accept callback and optional config
- Call native API if supported
- Execute callback immediately if not supported
- Return promise for both cases

**A3. CSS pseudo-element setup**
- Update `app/styles/_animations.scss`
- Add styles for `::view-transition` pseudo-elements
- Configure `::view-transition-old()`
- Configure `::view-transition-new()`
- Add custom animations for groups

**A4. View transition naming utility**
- Create helper to set `view-transition-name` dynamically
- Support scoped naming (modal-image-1, card-2, etc.)
- Generate unique names per component instance
- Cleanup function to remove names

**A5. Evaluate polyfill need**
- Research view-transitions-polyfill library
- Decision: Include or skip based on 86% support
- Document decision in decisionLog.md
- If included: Add to package.json, configure

---

### Component B: Page Navigation Transitions

**B1. Next.js App Router integration**
- Research App Router transition patterns
- Hook into route change events
- Wrap navigation in startViewTransition
- Handle back/forward navigation
- Test with prefetching enabled

**B2. Create navigation transition hook**
- Create `lib/animations/usePageTransition.ts`
- Detect route changes
- Trigger view transition on navigation
- Handle loading states
- Support custom transition configs per route

**B3. Add page-level view transition names**
- Update page layouts with view-transition-name
- Name pattern: `page-[route-name]`
- Apply to main content container
- Exclude header/footer from transition
- Test cross-fade vs slide animations

**B4. Custom transition styles per route**
- Create route-specific transition animations
- Flash page: slide-left/right
- Portfolio: scale + fade
- Custom Design: fade + slide-up
- About/Contact: cross-fade
- Define in `_animations.scss`

**B5. Handle edge cases**
- External links (no transition)
- Hash navigation (smooth scroll, no transition)
- 404 pages (fallback animation)
- Error states (graceful degradation)

---

### Component C: Gallery Modal Transitions

**C1. Modal wrapper with View Transitions**
- Update gallery modal component
- Add view-transition-name to modal container
- Match name with triggering thumbnail
- Handle open animation with startViewTransition
- Handle close animation with same approach

**C2. Shared element setup**
- Add view-transition-name to thumbnails
- Add matching name to modal image
- Use dynamic naming: `gallery-img-${id}`
- Remove name when modal closes
- Test with multiple gallery items

**C3. Custom modal animations**
- Define `::view-transition-group(gallery-img-*)` styles
- Smooth scale from thumbnail to full-size
- Fade in backdrop during transition
- Maintain aspect ratio during morph
- Add ease-out timing

**C4. Backdrop transition**
- Separate view-transition-name for backdrop
- Fade in/out independent of image
- Coordinate timing with image morph
- Test with different background colors
- Support light/dark theme

**C5. Cleanup and edge cases**
- Remove transition names after close
- Handle rapid open/close clicks
- Handle keyboard Escape during transition
- Handle click outside during transition
- Test with reduced-motion

---

### Component D: Image Expansion Transitions

**D1. Portfolio page integration**
- Add view-transition-name to portfolio thumbnails
- Navigate to detail page with transition
- Match name between thumbnail and hero image
- Smooth morph from grid to full-page
- Maintain scroll position on back navigation

**D2. Gallery grid to detail**
- Similar approach to portfolio
- Support multiple gallery categories
- Handle lazy-loaded images
- Preload target image before transition
- Show loading state if image not ready

**D3. Shared element constraints**
- Ensure matching aspect ratios
- Handle different image sizes gracefully
- Maintain image quality during transition
- Avoid layout shift (CLS)
- Test with portrait and landscape images

**D4. Animation timing**
- Configure duration: 300-400ms
- Use ease-out easing for natural feel
- Coordinate with page content fade-in
- Delay content until transition completes
- Test perceived performance

---

### Component E: Tab/State Transitions

**E1. Admin dashboard tab switching**
- Add view-transition-name to tab panels
- Wrap tab change in startViewTransition
- Smooth cross-fade between panels
- Maintain panel height (no CLS)
- Test with different content sizes

**E2. Pricing estimator state changes**
- Apply transitions to estimate updates
- Morph between price ranges
- Smooth number changes (coordinate with Phase 2 counters)
- Highlight changed values
- Respect reduced-motion

**E3. Theme toggle enhancement**
- Coordinate with Phase 1 theme toggle
- Add view transition to theme switch
- Morph glass panel backgrounds
- Smooth color transitions
- Fallback to Phase 1 animation if unsupported

**E4. Filter/sort animations**
- Gallery category filter transitions
- Portfolio filter transitions
- Smooth reordering of items
- Maintain item identity across transitions
- Use shared element morphing

---

### Component F: Documentation & Testing

**F1. Browser compatibility testing**
- Test in Chrome 111+ (supported)
- Test in Edge 111+ (supported)
- Test in Safari 18+ (supported)
- Test in Firefox (unsupported - verify fallback)
- Test in older browsers (verify fallback)

**F2. Fallback verification**
- Disable View Transitions API in DevTools
- Verify instant transitions work
- Verify no console errors
- Verify feature detection works
- Document fallback behavior

**F3. Performance testing**
- Profile transition frame rate
- Measure transition duration accuracy
- Check memory usage during transitions
- Test with slow 3G throttling
- Verify no layout thrashing

**F4. Accessibility testing**
- Test with screen readers
- Verify keyboard navigation works
- Test with reduced-motion
- Ensure focus management during transitions
- Verify ARIA live regions announce changes

**F5. Unit tests**
- Test feature detection utility
- Test startViewTransition wrapper
- Test transition name generation
- Mock document.startViewTransition
- Test fallback code paths

**F6. Integration tests**
- Test page navigation transitions
- Test modal open/close transitions
- Test image expansion transitions
- Test tab switching transitions
- Mock route changes in tests

**F7. Update documentation**
- Update `systemPatterns.md` with View Transitions patterns
- Document feature detection approach
- Document fallback strategy
- Add usage examples for each transition type
- Document browser support matrix
- Add troubleshooting guide

---

## 4. Assigned #todos

### Setup & Foundation
- #todo Review Phase 1 & 2 completion status
- #todo Create feature branch: `git checkout -b feature/animation-phase3-view-transitions`
- #todo Research current Next.js 15 + View Transitions integration

### Component A: Foundation
- #todo Create `lib/animations/viewTransitions.ts` with feature detection
- #todo Create startViewTransition wrapper function
- #todo Add `::view-transition` pseudo-element styles to `_animations.scss`
- #todo Create view-transition-name helper utility
- #todo Research and decide on polyfill inclusion
- #todo Document polyfill decision in `decisionLog.md`

### Component B: Page Navigation
- #todo Research Next.js App Router transition hooks
- #todo Create `lib/animations/usePageTransition.ts` hook
- #todo Add view-transition-name to page layouts
- #todo Create route-specific transition styles
- #todo Handle edge cases (external links, 404, errors)
- #todo Test navigation with prefetching
- #todo Test back/forward browser navigation

### Component C: Gallery Modal
- #todo Update gallery modal with View Transitions wrapper
- #todo Add dynamic view-transition-name to thumbnails
- #todo Add matching name to modal image
- #todo Create custom modal animation styles
- #todo Implement backdrop transition
- #todo Handle rapid open/close clicks
- #todo Test keyboard navigation during transitions

### Component D: Image Expansion
- #todo Add view-transition-name to portfolio thumbnails
- #todo Implement thumbnail to detail page transition
- #todo Add gallery grid to detail transitions
- #todo Handle lazy-loaded images
- #todo Test with various aspect ratios
- #todo Configure animation timing (300-400ms)
- #todo Test perceived performance

### Component E: Tab/State Transitions
- #todo Add view transitions to admin tab switching
- #todo Add transitions to pricing estimator updates
- #todo Enhance theme toggle with view transitions
- #todo Add transitions to gallery/portfolio filters
- #todo Test with different content sizes
- #todo Coordinate with Phase 2 counter animations

### Component F: Documentation & Testing
- #todo Test in Chrome 111+, Edge 111+, Safari 18+
- #todo Test fallback in Firefox and older browsers
- #todo Verify feature detection and graceful degradation
- #todo Profile transition performance
- #todo Test with reduced-motion preference
- #todo Test accessibility with screen readers
- #todo Write unit tests for utilities
- #todo Write integration tests for transitions
- #todo Update `systemPatterns.md` with patterns
- #todo Update `progress.md` with completion status
- #todo Update `decisionLog.md` with decisions
- #todo Run full test suite: `npm test -- --forceExit`
- #todo Run production build: `npm run build`
- #todo Verify bundle size ≤3KB increase
- #todo Commit changes with conventional commit message
- #todo Create pull request for review

---

## 5. Tools & Functions

### Development Tools
- **Code Editor:** VS Code with TypeScript/React IntelliSense
- **Build Tool:** Next.js build system
- **Testing:** Jest + React Testing Library + Playwright
- **Performance:** Chrome DevTools Performance panel
- **Compatibility:** BrowserStack for cross-browser testing

### Memory Management Tools
- `updateProgress` - Track completion of each component
- `logDecision` - Document View Transitions design choices
- `updateSystemPatterns` - Add View Transitions patterns
- `updateContext` - Update active focus

### File Modification Tools
- `create_file` - Create new utility and component files
- `replace_string_in_file` - Edit existing components
- `multi_replace_string_in_file` - Batch edits across files
- `read_file` - Review current implementations

### Validation Tools
- `run_in_terminal` - Execute build/test commands
- `get_errors` - Check for TypeScript/ESLint issues
- `grep_search` - Find view transition usage

---

## 6. Memory Management Integration

**updateContext:**
```
Current focus: Implementing Phase 3 View Transitions API
Active files: lib/animations/viewTransitions.ts, app/**/page.tsx, components/Gallery.tsx
Status: Phase 1 & 2 complete, Phase 3 in progress
Browser support: 86% (progressive enhancement for 14% fallback)
```

**updateProgress:**
- After each component completion, update progress.md
- Mark todos complete in progress tracking
- Note browser compatibility results
- Document fallback testing outcomes

**logDecision:**
- Document polyfill inclusion decision
- Record transition duration choices
- Note naming convention for view-transition-name
- Document fallback strategy

**updateSystemPatterns:**
- Add "View Transitions API" section
- Document feature detection pattern
- Document progressive enhancement approach
- Include browser support matrix
- Add troubleshooting guide

---

## 7. Review Checklist

### Pre-Implementation
- [x] Research brief reviewed
- [x] Plan.prompt.md workflow followed
- [x] Phase 1 & 2 completion verified
- [x] All todos identified and tracked
- [x] Memory bank updated with planning context

### During Implementation
- [ ] Feature detection working correctly
- [ ] Fallback tested in unsupported browsers
- [ ] View transition names unique and scoped
- [ ] Performance monitoring active

### Post-Implementation
- [ ] All tests passing (238 + Phase 2 + Phase 3 tests)
- [ ] Production build successful
- [ ] Bundle size ≤3KB increase verified
- [ ] Lighthouse score ≥95 maintained
- [ ] Browser compatibility verified
- [ ] Fallback behavior documented
- [ ] Documentation updated

---

## 8. Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| 14% browser support gap | Progressive enhancement, instant fallback, feature detection |
| Transition jank/stutter | Use GPU-accelerated properties only, profile performance, limit transition complexity |
| Naming conflicts | Scoped naming convention, dynamic name generation, cleanup after transition |
| Next.js routing conflicts | Research App Router patterns, test with prefetching, handle edge cases |
| CLS during transitions | Reserve space, use transform not layout, test with Layout Shift regions |
| Memory leaks | Cleanup transition names, remove event listeners, profile memory |
| Fallback UX degradation | Ensure instant transitions feel intentional, test extensively |

---

## 9. Performance Budget

**Acceptable Limits:**
- JavaScript bundle increase: ≤3KB (gzipped)
- Transition duration: 300-400ms max
- Frame rate: Maintain 60fps during transitions
- Lighthouse Performance: ≥95
- CLS: <0.1
- Memory: No leaks, proper cleanup

**Monitoring:**
- Check bundle size: `npm run build` and compare to Phase 2
- Profile transitions in Chrome DevTools
- Test on low-end mobile devices
- Monitor memory usage during repeated transitions

---

## 10. Implementation Order (Priority)

1. **Component A** (Foundation) - Feature detection and base utilities
2. **Component C** (Gallery Modal) - High visibility, contained scope
3. **Component D** (Image Expansion) - Similar to modal, builds on pattern
4. **Component B** (Page Navigation) - More complex, requires routing integration
5. **Component E** (Tab/State) - Polish, lower priority
6. **Component F** (Documentation) - Continuous throughout

---

## 11. Technical Considerations

### Browser Support Matrix
| Browser | Version | Support | Fallback |
|---------|---------|---------|----------|
| Chrome | 111+ | ✅ Native | N/A |
| Edge | 111+ | ✅ Native | N/A |
| Safari | 18+ | ✅ Native | N/A |
| Firefox | All | ❌ Unsupported | Instant transition |
| Safari | <18 | ❌ Unsupported | Instant transition |
| Chrome | <111 | ❌ Unsupported | Instant transition |

### View Transitions API Pseudo-elements
```scss
::view-transition
::view-transition-group(name)
::view-transition-image-pair(name)
::view-transition-old(name)
::view-transition-new(name)
```

### TypeScript Integration
- Extend Document interface for startViewTransition
- Type definitions for transition callbacks
- Config interface for transition options
- Return types for wrapper functions

### Next.js App Router Considerations
- Server Components vs Client Components
- Route prefetching impact
- Suspense boundary interactions
- Loading states coordination

### Accessibility
- Respect prefers-reduced-motion (disable transitions)
- Maintain focus during transitions
- Screen reader announcements
- Keyboard navigation unaffected

---

## 12. Success Metrics

**Quantitative:**
- ✅ Bundle size increase ≤3KB
- ✅ Transition duration 300-400ms
- ✅ 60fps maintained
- ✅ Lighthouse ≥95
- ✅ 86% browsers supported
- ✅ 100% browsers functional (with fallback)
- ✅ All tests passing

**Qualitative:**
- ✅ Page navigation feels smooth and connected
- ✅ Modal transitions feel natural and polished
- ✅ Image expansion maintains context
- ✅ Fallback transitions feel intentional
- ✅ Transitions enhance rather than distract
- ✅ Accessibility maintained

---

## 13. Dependencies & Prerequisites

**Required from Phase 1:**
- ✅ Animation variables system
- ✅ Reduced-motion support

**Required from Phase 2:**
- ✅ useReducedMotion hook

**New Dependencies:**
- Optional: view-transitions-polyfill (decision pending)

**Development Dependencies:**
- @types/dom-view-transitions (TypeScript definitions)

---

## 14. Research & Resources

**Official Documentation:**
- [MDN: View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- [Chrome DevRel: Smooth transitions](https://developer.chrome.com/docs/web-platform/view-transitions/)

**Next.js Integration:**
- Research current Next.js 15 + View Transitions patterns
- Check for official Next.js examples
- Review community implementations

**Polyfill Evaluation:**
- [view-transitions-polyfill](https://github.com/WICG/view-transitions/tree/main/polyfill)
- Size: ~10KB (significant, evaluate carefully)
- Decision: Document pros/cons before including

---

*Plan created: 2025-11-22*  
*Depends on: Phase 1 & 2 completion*  
*Ready for: Execute.prompt.md workflow*  
*Total todos: 56 tasks*  
*Estimated completion: 2-3 days*  
*Risk level: Medium*
