# SCSS File Split Plan
**Created:** 2025-11-22  
**Status:** PENDING APPROVAL  
**Priority:** HIGH

## 1. Problem Statement

**Current State:**
- `app/globals.scss` is 2,441 lines - unmanageable monolith
- All styles (variables, components, pages, animations) in one file
- Difficult to navigate, maintain, and collaborate on
- Recent animation additions (by agent) made it worse

**Goal:**
Split into discrete, manageable SCSS partials without breaking anything.

---

## 2. Proposed File Structure

```
app/
  styles/
    _variables.scss       # CSS custom properties (:root, .dark)
    _animations.scss      # @keyframes, motion utilities
    _base.scss            # Base utilities (container, sr-only, etc.)
    _buttons.scss         # All .btn variants
    _forms.scss           # Form input styles
    _layout.scss          # Header, nav, mobile menu
    _hero.scss            # Hero section components
    _gallery.scss         # Gallery grid and cards
    _flash.scss           # Flash page styles
    _custom.scss          # Custom design page styles
    _pricing.scss         # Pricing page styles
    _admin.scss           # Admin portal styles
  globals.scss           # Main entry (imports Tailwind + partials)
```

---

## 3. Migration Strategy

### Phase 1: Setup (Safe, No Risk)
1. Create `app/styles/` directory
2. Keep original `globals.scss` as backup (`globals.scss.backup`)
3. Set up git tracking for each step

### Phase 2: Extract Variables (Lowest Risk)
**File:** `_variables.scss`
**Lines:** ~1-56 (CSS custom properties)
**Dependencies:** None
**Test:** Build should pass, visual check theme switching

### Phase 3: Extract Animations (Low Risk)
**File:** `_animations.scss`
**Lines:** Keyframes (~2131-2206) + new animation additions
**Dependencies:** Uses variables
**Test:** Build passes, mobile menu animates

### Phase 4: Extract Base Utilities (Low Risk)
**File:** `_base.scss`
**Lines:** .container, .sr-only, .skip-link, .text-accent
**Dependencies:** Variables
**Test:** Build passes, layout intact

### Phase 5: Extract Buttons (Medium Risk)
**File:** `_buttons.scss`
**Lines:** All .btn and .btn-- variants (~66-205)
**Dependencies:** Variables, animations
**Test:** All CTAs work, hover effects intact

### Phase 6: Extract Forms (Medium Risk)
**File:** `_forms.scss`
**Lines:** Input/textarea/select styles (~208-240)
**Dependencies:** Variables
**Test:** Contact form inputs work, focus states intact

### Phase 7: Extract Layout (Medium Risk)
**File:** `_layout.scss`
**Lines:** Header, nav, mobile menu (~345-558)
**Dependencies:** Variables, buttons, animations
**Test:** Navigation works, mobile menu slides in

### Phase 8: Extract Page Styles (Higher Risk)
**Files:** `_hero.scss`, `_gallery.scss`, `_flash.scss`, `_custom.scss`, `_pricing.scss`, `_admin.scss`
**Dependencies:** All above
**Test:** Each page renders correctly, no missing styles

---

## 4. Import Order (Critical)

Final `globals.scss` structure:
```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

// Must be imported in this order (dependencies matter!)
@import './styles/variables';
@import './styles/animations';
@import './styles/base';
@import './styles/buttons';
@import './styles/forms';
@import './styles/layout';
@import './styles/hero';
@import './styles/gallery';
@import './styles/flash';
@import './styles/custom';
@import './styles/pricing';
@import './styles/admin';
```

**Why this order:**
- Variables first (everything depends on them)
- Animations second (used by components)
- Base utilities third (foundation)
- Components fourth (buttons, forms, layout)
- Page-specific styles last (depend on components)

---

## 5. Testing Checklist (After Each Phase)

- [ ] `npm run build` passes without errors
- [ ] `npm run dev` starts successfully
- [ ] Visual check: Homepage renders correctly
- [ ] Theme toggle works (light/dark mode)
- [ ] Mobile menu opens with animation
- [ ] Buttons have hover effects
- [ ] Forms have focus states
- [ ] Gallery items display properly
- [ ] Flash page styles intact
- [ ] Custom design page styles intact
- [ ] Pricing page styles intact
- [ ] Admin portal (if accessible) works

---

## 6. Rollback Strategy

**If anything breaks:**
1. `git checkout -- app/globals.scss app/styles/` (revert)
2. `npm run build` to verify restoration
3. Review what went wrong in the failed partial
4. Fix issue in isolation
5. Retry extraction

**Git workflow:**
```bash
git add app/styles/_variables.scss app/globals.scss
git commit -m "refactor: extract variables to _variables.scss"
# Test
# If broken: git reset --hard HEAD^
```

---

## 7. Success Criteria

- [x] All 2,441 lines migrated to discrete partials
- [x] Build passes
- [x] All pages render identically
- [x] No CSS specificity issues
- [x] Dark mode works
- [x] Animations intact
- [x] File sizes reasonable (<300 lines per partial)

---

## 8. Actionable Steps (Todos)

- [ ] **Step 1:** Create `app/styles/` directory
- [ ] **Step 2:** Backup `app/globals.scss` to `app/globals.scss.backup`
- [ ] **Step 3:** Extract `_variables.scss` (lines 5-56)
- [ ] **Step 4:** Update `globals.scss` to import `_variables.scss`
- [ ] **Step 5:** Test build and theme toggle
- [ ] **Step 6:** Commit if successful
- [ ] **Step 7:** Extract `_animations.scss` (keyframes)
- [ ] **Step 8:** Update imports, test, commit
- [ ] **Step 9:** Extract `_base.scss`
- [ ] **Step 10:** Extract `_buttons.scss`
- [ ] **Step 11:** Extract `_forms.scss`
- [ ] **Step 12:** Extract `_layout.scss`
- [ ] **Step 13:** Extract `_hero.scss`
- [ ] **Step 14:** Extract `_gallery.scss`
- [ ] **Step 15:** Extract `_flash.scss`
- [ ] **Step 16:** Extract `_custom.scss`
- [ ] **Step 17:** Extract `_pricing.scss`
- [ ] **Step 18:** Extract `_admin.scss`
- [ ] **Step 19:** Final visual QA on all pages
- [ ] **Step 20:** Remove `globals.scss.backup` once confirmed stable

---

## 9. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| CSS specificity changes | Medium | High | Test after each extraction, use git commits |
| @extend dependencies break | Low | High | Keep partials that use @extend together |
| Import order issues | Medium | High | Follow strict order, test after each import |
| Dark mode breaks | Low | Medium | Extract .dark overrides with variables |
| Build fails | Low | High | Git rollback strategy |

---

## 10. Tools Required

- **Git:** Version control for each step
- **Next.js build:** Test compilation
- **Browser DevTools:** Visual QA
- **Terminal:** File operations

---

## 11. Estimated Time

- Setup: 5 min
- Variables extraction: 10 min
- Animations extraction: 15 min
- Base utilities: 10 min
- Buttons: 15 min
- Forms: 10 min
- Layout: 20 min
- Page styles (6 files): 60 min
- Testing & QA: 30 min

**Total:** ~3 hours

---

## 12. Approval Required

**User must approve before implementation begins.**

Once approved, will proceed with Phase 1 (setup) and provide status updates after each phase.
