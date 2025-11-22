# Task Breakdown and Action Plan: Animation Phase 2 - Intersection Observer Scroll Effects

**Date:** 2025-11-22  
**Status:** Planning Complete - Awaiting Phase 1 Completion  
**Priority:** Medium (Progressive Enhancement)  
**Estimated Effort:** 1-2 days  

---

## 1. Main Task

**Task:** Implement Phase 2 Intersection Observer-based scroll-triggered animations to enhance user engagement with progressive reveal effects, parallax backgrounds, and viewport-aware stagger animations while maintaining 60fps performance and <2KB bundle increase.

**Success Criteria:**
- ✅ Custom React hook `useScrollReveal` created and tested
- ✅ Hero section parallax implemented with performance monitoring
- ✅ Section fade-in animations triggered on scroll
- ✅ Admin dashboard counter animations on viewport entry
- ✅ Gallery card stagger based on scroll position
- ✅ All animations respect `prefers-reduced-motion`
- ✅ Bundle size increase ≤2KB (gzipped)
- ✅ 238 tests remain passing + new hook tests added
- ✅ Build successful with no performance degradation
- ✅ Lighthouse score ≥95 maintained

---

## 2. Major Components

### Component A: Utilities & Hooks Foundation
Create reusable TypeScript utilities for scroll animations

### Component B: Hero Parallax Effect
Implement background parallax with performance optimization

### Component C: Section Reveal Animations
Progressive fade-in for page sections on scroll

### Component D: Admin Dashboard Counters
Animated number counters triggered on viewport entry

### Component E: Gallery Scroll Stagger
Viewport-aware card reveal with stagger timing

### Component F: Documentation & Testing
Unit tests, visual regression, and performance validation

---

## 3. Actionable Steps for Each Component

### Component A: Utilities & Hooks Foundation

**A1. Create useScrollReveal hook**
- Create `lib/animations/useScrollReveal.ts`
- Implement Intersection Observer with configurable threshold
- Add cleanup on unmount
- TypeScript types for options (threshold, rootMargin, triggerOnce)
- Return isVisible state and ref callback

**A2. Create useReducedMotion hook**
- Create `lib/animations/useReducedMotion.ts`
- Detect `prefers-reduced-motion` media query
- Return boolean state
- Update on media query change

**A3. Create animation constants**
- Create `lib/animations/constants.ts`
- Export threshold values (0.1, 0.25, 0.5, 0.75)
- Export rootMargin presets
- Export stagger timing constants

**A4. Create utility types**
- Create `lib/animations/types.ts`
- Define ScrollRevealOptions interface
- Define IntersectionObserverConfig type
- Export AnimationState enum

---

### Component B: Hero Parallax Effect

**B1. Add parallax CSS variables**
- Update `app/styles/_variables.scss`
- Add `--parallax-speed-slow: 0.5`
- Add `--parallax-speed-medium: 0.3`
- Add `--parallax-speed-fast: 0.15`

**B2. Create parallax transform helper**
- Create `lib/animations/parallax.ts`
- Calculate transform based on scroll position
- Throttle calculation to 60fps
- Return transform CSS string

**B3. Update Hero component**
- Update `components/Hero.tsx` or relevant hero file
- Add scroll listener with throttling
- Apply transform to background layer
- Use `will-change: transform` for performance
- Disable on reduced-motion preference

**B4. Test parallax performance**
- Profile with Chrome DevTools
- Verify 60fps maintained
- Check memory usage doesn't grow
- Test on mobile devices

---

### Component C: Section Reveal Animations

**C1. Create reveal CSS classes**
- Update `app/styles/_animations.scss`
- Add `.reveal-hidden` class (opacity: 0, translateY: 30px)
- Add `.reveal-visible` class (opacity: 1, translateY: 0)
- Use CSS transitions with custom timing
- Respect reduced-motion

**C2. Create RevealOnScroll wrapper component**
- Create `components/animations/RevealOnScroll.tsx`
- Use `useScrollReveal` hook
- Apply reveal classes based on visibility
- Accept threshold and delay props
- TypeScript props interface

**C3. Apply to page sections**
- Wrap About page sections in RevealOnScroll
- Wrap Contact page form in RevealOnScroll
- Wrap Flash page cards in RevealOnScroll
- Wrap Custom Design steps in RevealOnScroll
- Test stagger delays (100ms, 200ms, 300ms)

**C4. Add stagger utility**
- Create `lib/animations/stagger.ts`
- Calculate delay based on index
- Support custom base delay and increment
- Export stagger calculator function

---

### Component D: Admin Dashboard Counters

**D1. Create useCountUp hook**
- Create `lib/animations/useCountUp.ts`
- Animate number from 0 to target value
- Use requestAnimationFrame for smooth animation
- Accept duration and easing function
- Trigger on scroll reveal

**D2. Create CounterStat component**
- Create `components/admin/CounterStat.tsx`
- Combine useScrollReveal + useCountUp
- Format numbers with commas/decimals
- Support prefix/suffix (%, K, M)
- Accessible label for screen readers

**D3. Update admin dashboard**
- Update `app/dashboard/page.tsx` (or admin dashboard)
- Replace static stat numbers with CounterStat
- Apply to pageviews, requests, bandwidth stats
- Test animation timing (1.5s duration)
- Verify numbers are readable during animation

**D4. Add loading skeleton integration**
- Ensure counters work with existing skeleton loaders
- Smooth transition from skeleton to counter
- Maintain layout stability (no CLS)

---

### Component E: Gallery Scroll Stagger

**E1. Enhance gallery card reveal**
- Update `components/Gallery.tsx`
- Add useScrollReveal to each card
- Calculate stagger delay based on index
- Use threshold: 0.1 for early trigger
- Maintain existing hover animations

**E2. Create stagger animation classes**
- Update `app/styles/_gallery.scss`
- Add `.gallery-card--hidden` class
- Add `.gallery-card--visible` class with delay variables
- Use CSS custom properties for dynamic delays
- Coordinate with existing fadeIn animation

**E3. Add progressive loading**
- Load cards in batches as user scrolls
- Prevent all cards animating at once
- Use triggerOnce: true to avoid re-animation
- Test with 20+ gallery items

**E4. Performance optimization**
- Use `content-visibility: auto` on cards
- Add `will-change: transform, opacity` during animation
- Remove will-change after animation completes
- Profile with many gallery items (50+)

---

### Component F: Documentation & Testing

**F1. Unit tests for hooks**
- Create `lib/animations/useScrollReveal.test.ts`
- Mock IntersectionObserver
- Test threshold configurations
- Test cleanup on unmount
- Test triggerOnce behavior

**F2. Unit tests for utilities**
- Create `lib/animations/useCountUp.test.ts`
- Test number formatting
- Test animation duration
- Test easing functions
- Create `lib/animations/stagger.test.ts`

**F3. Component integration tests**
- Test RevealOnScroll with React Testing Library
- Test CounterStat rendering and animation
- Mock intersection observer in tests
- Verify reduced-motion behavior

**F4. Visual regression testing**
- Test parallax at different scroll positions
- Test section reveals on all pages
- Test counter animations on dashboard
- Test gallery stagger with multiple items
- Verify light/dark theme compatibility

**F5. Performance validation**
- Run Lighthouse with scroll animations active
- Profile frame rate during parallax
- Check bundle size increase
- Verify no memory leaks
- Test on mobile devices (iOS/Android)

**F6. Update documentation**
- Update `systemPatterns.md` with scroll animation patterns
- Document useScrollReveal hook API
- Document useCountUp hook API
- Add usage examples for each component
- Document performance considerations

---

## 4. Assigned #todos

### Setup & Foundation
- #todo Review Phase 1 completion status
- #todo Create feature branch: `git checkout -b feature/animation-phase2-scroll-effects`
- #todo Create `lib/animations/` directory structure

### Component A: Utilities & Hooks
- #todo Create `lib/animations/useScrollReveal.ts` with Intersection Observer
- #todo Create `lib/animations/useReducedMotion.ts` with media query detection
- #todo Create `lib/animations/constants.ts` with threshold and timing values
- #todo Create `lib/animations/types.ts` with TypeScript interfaces
- #todo Write unit tests for useScrollReveal hook
- #todo Write unit tests for useReducedMotion hook

### Component B: Hero Parallax
- #todo Add parallax CSS variables to `_variables.scss`
- #todo Create `lib/animations/parallax.ts` helper function
- #todo Update Hero component with scroll listener
- #todo Apply parallax transform to background layer
- #todo Add `will-change` hints for performance
- #todo Test parallax on desktop and mobile
- #todo Profile frame rate with Chrome DevTools

### Component C: Section Reveals
- #todo Add `.reveal-hidden` and `.reveal-visible` classes to `_animations.scss`
- #todo Create `components/animations/RevealOnScroll.tsx` wrapper
- #todo Apply RevealOnScroll to About page sections
- #todo Apply RevealOnScroll to Contact page form
- #todo Apply RevealOnScroll to Flash page cards
- #todo Apply RevealOnScroll to Custom Design steps
- #todo Create `lib/animations/stagger.ts` utility
- #todo Test stagger delays across pages

### Component D: Admin Counters
- #todo Create `lib/animations/useCountUp.ts` hook
- #todo Create `components/admin/CounterStat.tsx` component
- #todo Update admin dashboard with CounterStat components
- #todo Test counter animation timing and formatting
- #todo Integrate with existing skeleton loaders
- #todo Verify accessibility with screen readers
- #todo Write unit tests for useCountUp hook

### Component E: Gallery Stagger
- #todo Update `components/Gallery.tsx` with scroll reveal
- #todo Add stagger animation classes to `_gallery.scss`
- #todo Implement progressive loading for large galleries
- #todo Add `content-visibility: auto` optimization
- #todo Test with 50+ gallery items
- #todo Profile performance with many items

### Component F: Documentation & Testing
- #todo Write unit tests for all animation hooks
- #todo Write integration tests for components
- #todo Perform visual regression testing
- #todo Run Lighthouse performance audit
- #todo Verify bundle size ≤2KB increase
- #todo Test reduced-motion behavior
- #todo Update `systemPatterns.md` with new patterns
- #todo Update `progress.md` with completion status
- #todo Update `decisionLog.md` with implementation decisions
- #todo Run full test suite: `npm test -- --forceExit`
- #todo Run production build: `npm run build`
- #todo Commit changes with conventional commit message
- #todo Create pull request for review

---

## 5. Tools & Functions

### Development Tools
- **Code Editor:** VS Code with TypeScript/React IntelliSense
- **Build Tool:** Next.js build system
- **Testing:** Jest + React Testing Library
- **Performance:** Chrome DevTools Performance panel
- **Accessibility:** Chrome DevTools Lighthouse + Screen reader testing

### Memory Management Tools
- `updateProgress` - Track completion of each component
- `logDecision` - Document hook design choices
- `updateSystemPatterns` - Add scroll animation patterns
- `updateContext` - Update active focus

### File Modification Tools
- `create_file` - Create new hook and component files
- `replace_string_in_file` - Edit existing components
- `multi_replace_string_in_file` - Batch edits across files
- `read_file` - Review current implementations

### Validation Tools
- `run_in_terminal` - Execute build/test commands
- `get_errors` - Check for TypeScript/ESLint issues
- `grep_search` - Find scroll animation usage

---

## 6. Memory Management Integration

**updateContext:**
```
Current focus: Implementing Phase 2 Intersection Observer scroll effects
Active files: lib/animations/*, components/animations/*, components/Gallery.tsx, app/dashboard/page.tsx
Status: Phase 1 complete, Phase 2 in progress
Dependencies: useScrollReveal, useReducedMotion, useCountUp hooks
```

**updateProgress:**
- After each component completion, update progress.md
- Mark todos complete in progress tracking
- Note performance metrics and bundle size

**logDecision:**
- Document Intersection Observer threshold choices
- Record parallax speed values selected
- Note stagger timing decisions
- Document reduced-motion handling approach

**updateSystemPatterns:**
- Add "Scroll-Triggered Animations" section
- Document useScrollReveal hook API
- Document useCountUp hook API
- Include performance optimization patterns

---

## 7. Review Checklist

### Pre-Implementation
- [x] Research brief reviewed
- [x] Plan.prompt.md workflow followed
- [x] Phase 1 completion verified
- [x] All todos identified and tracked
- [x] Memory bank updated with planning context

### During Implementation
- [ ] Each hook tested independently
- [ ] Intersection Observer polyfill not needed (97% support)
- [ ] Reduced-motion behavior verified
- [ ] Performance monitoring active (60fps target)

### Post-Implementation
- [ ] All tests passing (238 + new hook tests)
- [ ] Production build successful
- [ ] Bundle size ≤2KB increase verified
- [ ] Lighthouse score ≥95 maintained
- [ ] Visual regression testing complete
- [ ] Documentation updated

---

## 8. Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| Performance degradation from scroll listeners | Use passive scroll listeners, throttle to 60fps, use Intersection Observer (no scroll listener needed for reveals) |
| Memory leaks from observers | Cleanup observers on component unmount, disconnect in useEffect cleanup |
| Parallax jank on mobile | Test on real devices, reduce parallax speed, disable on low-end devices |
| Too many observers active | Use single observer instance shared across components, lazy load observers |
| CLS from reveal animations | Reserve space with min-height, use transform not layout properties |
| Bundle size exceeds 2KB | Tree-shake unused utilities, code-split animation hooks, avoid dependencies |

---

## 9. Performance Budget

**Acceptable Limits:**
- JavaScript bundle increase: ≤2KB (gzipped)
- Frame rate: Maintain 60fps during scroll
- Lighthouse Performance: ≥95
- CLS: <0.1
- Memory: No leaks, observers cleaned up
- Test suite: All passing + new hook tests

**Monitoring:**
- Check bundle size: `npm run build` and compare to Phase 1
- Profile scroll performance in Chrome DevTools
- Monitor observer count in production
- Test on low-end mobile devices

---

## 10. Implementation Order (Priority)

1. **Component A** (Utilities) - Foundation for all scroll effects
2. **Component C** (Section Reveals) - High visibility, straightforward
3. **Component E** (Gallery Stagger) - Enhances existing gallery
4. **Component B** (Parallax) - More complex, test performance carefully
5. **Component D** (Counters) - Admin-only, lower user impact
6. **Component F** (Documentation) - Continuous throughout

---

## 11. Technical Considerations

### Browser Support
- Intersection Observer: 97% support (no polyfill needed)
- Will use feature detection for safety
- Graceful degradation: animations run immediately if observer unavailable

### TypeScript Integration
- Strong typing for all hooks
- Proper generic types for useScrollReveal
- Interface for observer options
- Enum for animation states

### React Best Practices
- Custom hooks follow React conventions
- Proper dependency arrays in useEffect
- Cleanup functions for observers
- Memoization where appropriate

### Accessibility
- Respect prefers-reduced-motion in all animations
- Ensure content visible without JavaScript
- Screen reader announcements for counters
- Keyboard navigation unaffected

---

## 12. Success Metrics

**Quantitative:**
- ✅ Bundle size increase ≤2KB
- ✅ 60fps maintained during scroll
- ✅ Lighthouse ≥95
- ✅ All tests passing
- ✅ No memory leaks
- ✅ CLS <0.1

**Qualitative:**
- ✅ Scroll animations feel smooth and natural
- ✅ Parallax provides depth without distraction
- ✅ Section reveals guide user attention
- ✅ Counters feel celebratory and engaging
- ✅ Gallery stagger feels progressive and polished
- ✅ Accessibility maintained across all features

---

## 13. Dependencies & Prerequisites

**Required from Phase 1:**
- ✅ Animation variables system in `_variables.scss`
- ✅ Reduced-motion support in `_animations.scss`
- ✅ Performance baseline established

**New Dependencies:**
- None (using native Intersection Observer API)

**Development Dependencies:**
- @testing-library/react-hooks (for hook testing)
- @testing-library/user-event (for interaction tests)

---

*Plan created: 2025-11-22*  
*Depends on: Phase 1 completion*  
*Ready for: Execute.prompt.md workflow*  
*Total todos: 47 tasks*  
*Estimated completion: 1-2 days*  
*Risk level: Low*
