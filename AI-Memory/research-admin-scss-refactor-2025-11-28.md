# Research Brief: Admin SCSS Refactoring

**Created:** 2025-11-28  
**Status:** Ready for planning  
**Priority:** High (technical debt)

---

## Problem Statement

The `_admin.scss` file has grown to **3,307 lines** without proper modularization, causing:
- Massive code duplication
- Difficulty maintaining consistent styles
- Duplicate keyframe animations
- Not leveraging existing mixins and variables
- Risk of visual inconsistencies

---

## Context

- **File:** `app/styles/_admin.scss`
- **Current Size:** 3,307 lines
- **Existing Infrastructure:**
  - `_components.scss` - Has `glass-panel` mixin (NOT being used in admin)
  - `_variables.scss` - Has animation timing, glass vars, colors
  - `_buttons.scss` - Has `.btn` base and variants
  - `_animations.scss` - Has fadeIn, scaleIn, shimmer (being RE-DEFINED in admin)
  - `_forms.scss` - Has basic form transitions

---

## Research Findings

### 1. Duplicate Keyframe Animations

| Animation | Location 1 | Location 2 | Already in _animations.scss? |
|-----------|------------|------------|------------------------------|
| `fadeIn` | Line 1315 | Line 2468 | ✅ Yes (line 27) |
| `scaleIn` | Line 1360 | Line 2484 | ✅ Yes (line 35) |
| `admin-stat-skeleton` | Line 553 | — | ✅ Yes (line 5) |
| `shimmer` | Line 2072 | Line 3251 (`skeleton-shimmer`) | Partial |

**Impact:** 4 redundant keyframe definitions

### 2. Repeated Style Patterns

| Pattern | Occurrences | Should Be |
|---------|-------------|-----------|
| `background: rgba(255, 255, 255, 0.06)` | 20+ | `--admin-surface-dark` |
| `border: 1px solid rgba(255, 255, 255, 0.12)` | 15+ | `--admin-border-subtle` |
| `border-radius: 0.5rem` | 25+ | `--radius-sm` |
| `border-radius: 0.75rem` | 10+ | `--radius-md` |
| `padding: 0.625rem 0.875rem` | 5+ | `@mixin admin-input-padding` |
| Dark input styling block | 3 places | `@mixin dark-input` |

### 3. Unused Existing Infrastructure

| Available | Used in _admin.scss? |
|-----------|---------------------|
| `@include glass-panel` mixin | ❌ No - `.admin-card` re-implements |
| `--animation-duration-*` vars | Partially |
| `--glass-panel-bg` var | ❌ No |
| `.btn--*` button variants | Partially |

### 4. Logical Sections in _admin.scss

| Section | Lines (approx) | Can Extract? |
|---------|---------------|--------------|
| Shell & Base | 1-100 | → `_base.scss` |
| Dashboard & Stats | 100-570 | → `_dashboard.scss` |
| Admin Cards & Forms | 570-930 | → `_base.scss` |
| Price Breakdown | 930-1090 | → `_pricing.scss` |
| Gallery Upload | 1090-1300 | → `_gallery.scss` |
| Image Modal | 1300-1380 | → `_dialogs.scss` |
| Inquiry Inbox | 1380-2080 | → `_inquiries.scss` |
| Email Templates | 2080-2440 | → `_templates.scss` |
| Confirm Dialog | 2450-2600 | → `_dialogs.scss` |
| Customer CRM | 2600-3307 | → `_customers.scss` |

---

## Recommended Approach

### Strategy: "Additive First, Replace Gradually"

**Principle:** Never delete working code until replacement is verified.

**Priority:** Admin styles are the canonical design. We extract admin patterns AS the mixins - not the other way around. If there's any conflict between admin styles and older site styles, admin wins.

### Phase 1: Create Admin Design Tokens (Low Risk)

Add to `_variables.scss`:
```scss
:root {
  // Admin spacing tokens
  --admin-radius-sm: 0.5rem;
  --admin-radius-md: 0.75rem;
  --admin-radius-lg: 1rem;
  --admin-spacing-xs: 0.25rem;
  --admin-spacing-sm: 0.5rem;
  --admin-spacing-md: 1rem;
  --admin-spacing-lg: 1.5rem;
}

html.dark {
  // Admin surface colors (dark mode)
  --admin-surface-subtle: rgba(255, 255, 255, 0.03);
  --admin-surface-muted: rgba(255, 255, 255, 0.06);
  --admin-surface-elevated: rgba(255, 255, 255, 0.08);
  --admin-border-subtle: rgba(255, 255, 255, 0.08);
  --admin-border-muted: rgba(255, 255, 255, 0.12);
  --admin-border-elevated: rgba(255, 255, 255, 0.15);
  --admin-input-bg: rgba(255, 255, 255, 0.06);
  --admin-input-border: rgba(255, 255, 255, 0.12);
}
```

### Phase 2: Create Admin Mixins (Low Risk)

Add to `_components.scss`:
```scss
// Admin dark input mixin
@mixin admin-dark-input {
  background: var(--admin-input-bg);
  border: 1px solid var(--admin-input-border);
  color: var(--text);
  border-radius: var(--admin-radius-sm);
  padding: 0.625rem 0.875rem;
  font-size: 0.95rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  &:focus {
    outline: none;
    border-color: var(--accent, #f472b6);
    box-shadow: 0 0 0 2px rgba(244, 114, 182, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Admin list item mixin
@mixin admin-list-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--admin-surface-subtle);
  border: 1px solid var(--admin-border-subtle);
  border-radius: var(--admin-radius-md);
  transition: all 0.15s ease;
  
  &:hover {
    background: var(--admin-surface-muted);
    border-color: var(--admin-border-muted);
  }
}

// Admin card (extends glass-panel)
@mixin admin-card {
  @include glass-panel;
  padding: clamp(1.25rem, 3vw, 2rem);
  
  // Disable hover transform for admin cards
  &:hover {
    transform: none;
  }
}
```

### Phase 3: Create Admin Partials Directory

```
app/styles/admin/
├── _index.scss        # Aggregates all admin partials
├── _tokens.scss       # Admin-specific variables (if needed separately)
├── _base.scss         # Shell, cards, nav, alerts, forms
├── _dashboard.scss    # Dashboard grid, stat cards
├── _gallery.scss      # Gallery management, image modal
├── _inquiries.scss    # Inquiry inbox, reply form
├── _customers.scss    # Customer CRM
├── _templates.scss    # Email templates
└── _dialogs.scss      # Confirm dialog, modals
```

### Phase 4: Migration Process (Per Partial)

For each section:
1. **Copy** relevant code to new partial
2. **Replace** hardcoded values with variables/mixins
3. **Remove** duplicate keyframes (import from _animations)
4. **Update** `admin/_index.scss` to forward new partial
5. **Build test** - verify no errors
6. **Visual test** - screenshot comparison
7. **Comment out** (don't delete) original section in _admin.scss
8. **Repeat** for next section

### Phase 5: Cleanup

After all sections migrated and verified:
1. Delete old `_admin.scss`
2. Update `_index.scss` to `@forward './admin'`
3. Final build and visual verification

---

## Technical Considerations

### Dependencies

- Mixins must be defined BEFORE partials that use them
- `_components.scss` must be forwarded before admin partials
- `_variables.scss` must be forwarded first

### Import Order in `admin/_index.scss`

```scss
@use '../components' as *;
@use '../variables' as *;
@use '../animations' as *;

@forward './base';
@forward './dashboard';
@forward './gallery';
@forward './inquiries';
@forward './customers';
@forward './templates';
@forward './dialogs';
```

### Testing Strategy

1. **Build verification** - `npm run build` must pass
2. **Visual regression** - Screenshot key admin pages before/after
3. **Animation check** - Verify all animations still work
4. **Responsive check** - Test mobile breakpoints
5. **Dark mode check** - Ensure all dark styles apply

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| CSS specificity changes | High | Medium | Keep same selector structure |
| Missing styles after split | High | Low | Copy first, verify, then delete |
| Animation breaks | Medium | Low | Test each keyframe usage |
| Import order issues | Medium | Medium | Document dependencies |
| Regression in edge cases | Medium | Low | Visual comparison testing |

---

## Effort Estimation

| Phase | Effort | Risk |
|-------|--------|------|
| 1. Design tokens | 30 min | Very Low |
| 2. Create mixins | 45 min | Low |
| 3. Create partial structure | 15 min | Very Low |
| 4. Migrate each section | 3-4 hours | Medium |
| 5. Testing & verification | 1 hour | Low |
| 6. Cleanup | 15 min | Very Low |

**Total:** ~6 hours

---

## Success Criteria

- [ ] _admin.scss reduced from 3307 lines to <100 (just imports)
- [ ] No visual changes to any admin page
- [ ] All animations preserved and working
- [ ] Build passes without warnings
- [ ] Duplicate keyframes removed (only in _animations.scss)
- [ ] Common patterns use variables/mixins
- [ ] Each partial is <500 lines
- [ ] Code is more maintainable and DRY

---

## Implementation Readiness

### Prerequisites
- [x] Existing mixin infrastructure identified
- [x] Duplicate patterns catalogued
- [x] Section boundaries mapped
- [x] Safe migration strategy defined

### Next Steps for Planning
1. Create design tokens and mixins (Phase 1-2)
2. Create admin partials directory structure
3. Migrate section by section with verification
4. Visual regression testing at each step

---

## References

- Current file: `app/styles/_admin.scss` (3307 lines)
- Existing mixins: `app/styles/_components.scss`
- Variables: `app/styles/_variables.scss`
- Animations: `app/styles/_animations.scss`
- Index: `app/styles/_index.scss`
