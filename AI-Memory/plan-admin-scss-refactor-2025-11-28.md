# Plan: Admin SCSS Refactoring

**Created:** 2025-11-28  
**Research Brief:** `research-admin-scss-refactor-2025-11-28.md`  
**Status:** Ready for execution

---

## Task Definition

Refactor `_admin.scss` (3,307 lines) into modular, maintainable partials while:
- Extracting admin patterns AS the canonical mixins (admin = source of truth)
- Eliminating duplicate keyframes and repeated style patterns
- Ensuring ZERO visual changes to the admin interface
- Preserving all animations and design details

---

## Implementation Strategy

### Core Principle: "Admin Patterns → Mixins → Reuse"

```
Current State:                    Target State:
┌─────────────────┐              ┌─────────────────┐
│ _admin.scss     │              │ _variables.scss │ ← Admin tokens added
│ 3,307 lines     │              │ (extended)      │
│ - duplications  │              └────────┬────────┘
│ - repeated rgba │                       │
│ - dup keyframes │              ┌────────▼────────┐
└─────────────────┘              │ _components.scss│ ← Admin mixins added
                                 │ (extended)      │
                                 └────────┬────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
           ┌────────▼────────┐   ┌────────▼────────┐   ┌────────▼────────┐
           │ admin/_base.scss│   │admin/_inquiries │   │admin/_customers │
           │ ~400 lines      │   │ ~600 lines      │   │ ~500 lines      │
           └─────────────────┘   └─────────────────┘   └─────────────────┘
```

---

## Phase 1: Add Admin Design Tokens to `_variables.scss`

**Goal:** Extract repeated values as CSS custom properties

### 1.1 Add Admin Surface Tokens
| Token | Value | Used For |
|-------|-------|----------|
| `--admin-surface-subtle` | `rgba(255, 255, 255, 0.03)` | Backgrounds, panels |
| `--admin-surface-muted` | `rgba(255, 255, 255, 0.06)` | Input backgrounds |
| `--admin-surface-elevated` | `rgba(255, 255, 255, 0.08)` | Hover states |
| `--admin-border-subtle` | `rgba(255, 255, 255, 0.08)` | Light borders |
| `--admin-border-muted` | `rgba(255, 255, 255, 0.12)` | Input borders |
| `--admin-border-elevated` | `rgba(255, 255, 255, 0.15)` | Focus borders |

### 1.2 Add Admin Spacing Tokens
| Token | Value | Used For |
|-------|-------|----------|
| `--admin-radius-sm` | `0.5rem` | Inputs, small elements |
| `--admin-radius-md` | `0.75rem` | Cards, buttons |
| `--admin-radius-lg` | `1rem` | Large panels |

### 1.3 Add Admin Input Tokens
| Token | Value | Used For |
|-------|-------|----------|
| `--admin-input-bg` | `var(--admin-surface-muted)` | Input backgrounds |
| `--admin-input-border` | `var(--admin-border-muted)` | Input borders |
| `--admin-input-focus-border` | `var(--accent, #f472b6)` | Focus state |
| `--admin-input-focus-shadow` | `rgba(244, 114, 182, 0.2)` | Focus glow |

**Files Modified:** `_variables.scss`  
**Risk:** Very Low (additive only)

---

## Phase 2: Add Admin Mixins to `_components.scss`

**Goal:** Create reusable mixins from admin's current patterns

### 2.1 `@mixin admin-dark-input`
Extracts the dark input styling used throughout admin:
```scss
@mixin admin-dark-input {
  background: var(--admin-input-bg);
  border: 1px solid var(--admin-input-border);
  color: var(--text);
  border-radius: var(--admin-radius-sm);
  padding: 0.625rem 0.875rem;
  font-size: 0.95rem;
  width: 100%;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  &:focus {
    outline: none;
    border-color: var(--admin-input-focus-border);
    box-shadow: 0 0 0 2px var(--admin-input-focus-shadow);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

### 2.2 `@mixin admin-dark-select`
Extends input with dropdown arrow:
```scss
@mixin admin-dark-select {
  @include admin-dark-input;
  appearance: none;
  background-image: url("data:image/svg+xml,..."); // dropdown chevron
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem;
  cursor: pointer;
}
```

### 2.3 `@mixin admin-list-item`
Extracts the repeated list item pattern:
```scss
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
```

### 2.4 `@mixin admin-section-label`
Extracts the uppercase label pattern:
```scss
@mixin admin-section-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  margin-bottom: 0.5rem;
}
```

### 2.5 `@mixin admin-message-box`
Extracts the message/note box pattern:
```scss
@mixin admin-message-box {
  background: var(--admin-surface-subtle);
  border: 1px solid var(--admin-border-subtle);
  border-radius: var(--admin-radius-sm);
  padding: 1rem;
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-wrap;
}
```

**Files Modified:** `_components.scss`  
**Risk:** Low (additive only)

---

## Phase 3: Create Admin Partials Directory Structure

**Goal:** Organize admin styles into logical, maintainable files

### Directory Structure
```
app/styles/admin/
├── _index.scss         # Aggregates all admin partials
├── _base.scss          # Shell, cards, nav, forms, alerts (~400 lines)
├── _dashboard.scss     # Dashboard grid, stat cards (~200 lines)
├── _gallery.scss       # Gallery management, image modal (~350 lines)
├── _inquiries.scss     # Inquiry inbox, reply form (~700 lines)
├── _customers.scss     # Customer CRM (~450 lines)
├── _templates.scss     # Email templates (~350 lines)
└── _dialogs.scss       # Confirm dialog, modals (~100 lines)
```

### `admin/_index.scss` Content
```scss
// Admin Styles - Modular Organization
// Dependencies: _components.scss (mixins), _variables.scss (tokens)

@forward './base';
@forward './dashboard';
@forward './gallery';
@forward './inquiries';
@forward './customers';
@forward './templates';
@forward './dialogs';
```

**Files Created:** 8 new files in `app/styles/admin/`  
**Risk:** Very Low (new directory, no changes to existing)

---

## Phase 4: Migrate Sections (One at a Time)

### Migration Order (by dependency)

| Order | Partial | Lines | Dependencies | Contains |
|-------|---------|-------|--------------|----------|
| 1 | `_base.scss` | ~400 | None | Shell, cards, nav, forms, alerts |
| 2 | `_dashboard.scss` | ~200 | base | Dashboard, stat cards |
| 3 | `_dialogs.scss` | ~100 | base | Confirm dialog, image modal |
| 4 | `_gallery.scss` | ~350 | base, dialogs | Gallery upload, sections |
| 5 | `_inquiries.scss` | ~700 | base, dialogs | Inbox, detail, reply form |
| 6 | `_templates.scss` | ~350 | base | Email template editor |
| 7 | `_customers.scss` | ~450 | base | CRM, deposits |

### Migration Process (Per Partial)

```
For each section:
1. ┌─ CREATE new partial file
   │  - Copy relevant code from _admin.scss
   │  - Add @use '../components' as * at top
   │
2. ├─ REPLACE hardcoded values with tokens/mixins
   │  - rgba(255,255,255,0.06) → var(--admin-surface-muted)
   │  - border-radius: 0.5rem → var(--admin-radius-sm)
   │  - Duplicate input styles → @include admin-dark-input
   │
3. ├─ REMOVE duplicate keyframes
   │  - Delete @keyframes fadeIn (use from _animations.scss)
   │  - Delete @keyframes scaleIn (use from _animations.scss)
   │
4. ├─ UPDATE admin/_index.scss
   │  - Add @forward for new partial
   │
5. ├─ BUILD TEST
   │  - npm run build
   │  - Verify no errors
   │
6. ├─ VISUAL TEST
   │  - Compare screenshots before/after
   │  - Check animations work
   │
7. └─ COMMENT OUT original section in _admin.scss
      - Don't delete until all verified
```

---

## Phase 5: Update Main Index & Cleanup

### 5.1 Update `_index.scss`
```scss
// Before:
@forward './admin';

// After:
@forward './admin/index';
```

### 5.2 Final Verification
- [ ] All admin pages render correctly
- [ ] All animations work (fadeIn, scaleIn, shimmer, etc.)
- [ ] Dark mode inputs styled correctly
- [ ] Mobile responsive behavior intact
- [ ] Build passes with no warnings

### 5.3 Delete Old `_admin.scss`
Only after complete verification, remove the original 3,307-line file.

---

## Detailed Todo Breakdown

### Phase 1: Design Tokens (30 min)
| # | Todo | Status |
|---|------|--------|
| 1.1 | Add admin surface tokens to `html.dark` in `_variables.scss` | ⬜ |
| 1.2 | Add admin spacing tokens to `:root` in `_variables.scss` | ⬜ |
| 1.3 | Add admin input tokens to `html.dark` in `_variables.scss` | ⬜ |
| 1.4 | Build test | ⬜ |

### Phase 2: Admin Mixins (45 min)
| # | Todo | Status |
|---|------|--------|
| 2.1 | Add `@mixin admin-dark-input` to `_components.scss` | ⬜ |
| 2.2 | Add `@mixin admin-dark-select` to `_components.scss` | ⬜ |
| 2.3 | Add `@mixin admin-list-item` to `_components.scss` | ⬜ |
| 2.4 | Add `@mixin admin-section-label` to `_components.scss` | ⬜ |
| 2.5 | Add `@mixin admin-message-box` to `_components.scss` | ⬜ |
| 2.6 | Build test | ⬜ |

### Phase 3: Directory Structure (15 min)
| # | Todo | Status |
|---|------|--------|
| 3.1 | Create `app/styles/admin/` directory | ⬜ |
| 3.2 | Create `admin/_index.scss` with forwards | ⬜ |
| 3.3 | Create empty partial files (7 files) | ⬜ |

### Phase 4: Section Migration (~3.5 hours)
| # | Todo | Estimated | Status |
|---|------|-----------|--------|
| 4.1 | Migrate `_base.scss` (shell, cards, forms, alerts) | 45 min | ⬜ |
| 4.2 | Migrate `_dashboard.scss` (stats, grid) | 20 min | ⬜ |
| 4.3 | Migrate `_dialogs.scss` (confirm, modal) | 15 min | ⬜ |
| 4.4 | Migrate `_gallery.scss` (upload, sections, modal) | 30 min | ⬜ |
| 4.5 | Migrate `_inquiries.scss` (inbox, detail, reply) | 45 min | ⬜ |
| 4.6 | Migrate `_templates.scss` (editor, list) | 30 min | ⬜ |
| 4.7 | Migrate `_customers.scss` (CRM, deposits) | 30 min | ⬜ |

### Phase 5: Finalization (30 min)
| # | Todo | Status |
|---|------|--------|
| 5.1 | Update `_index.scss` to forward `admin/index` | ⬜ |
| 5.2 | Full visual regression test (all admin pages) | ⬜ |
| 5.3 | Test all animations | ⬜ |
| 5.4 | Test mobile responsive | ⬜ |
| 5.5 | Delete old `_admin.scss` | ⬜ |
| 5.6 | Final build verification | ⬜ |

---

## Duplicate Keyframes to Remove

| Keyframe | Keep In | Remove From |
|----------|---------|-------------|
| `fadeIn` | `_animations.scss` | `_admin.scss` (lines 1316, 2468) |
| `scaleIn` | `_animations.scss` | `_admin.scss` (lines 1360, 2484) |
| `admin-stat-skeleton` | `_animations.scss` | `_admin.scss` (line 553) |
| `shimmer` | `_animations.scss` | `_admin.scss` (line 2072) |
| `adminFadeIn` | `admin/_base.scss` | Keep (unique to admin) |
| `skeleton-shimmer` | Consolidate with `shimmer` | `_admin.scss` (line 3251) |

---

## Code Replacements Summary

### Pattern → Token Replacements
| Find | Replace With |
|------|--------------|
| `rgba(255, 255, 255, 0.03)` | `var(--admin-surface-subtle)` |
| `rgba(255, 255, 255, 0.06)` | `var(--admin-surface-muted)` |
| `rgba(255, 255, 255, 0.08)` | `var(--admin-surface-elevated)` |
| `rgba(255, 255, 255, 0.08)` (border) | `var(--admin-border-subtle)` |
| `rgba(255, 255, 255, 0.12)` | `var(--admin-border-muted)` |
| `rgba(255, 255, 255, 0.15)` | `var(--admin-border-elevated)` |
| `border-radius: 0.5rem` | `var(--admin-radius-sm)` |
| `border-radius: 0.75rem` | `var(--admin-radius-md)` |
| `border-radius: 1rem` | `var(--admin-radius-lg)` |

### Mixin Replacements
| Find (Pattern) | Replace With |
|----------------|--------------|
| Dark input block (~15 lines) | `@include admin-dark-input` |
| Dark select block (~20 lines) | `@include admin-dark-select` |
| List item pattern (~10 lines) | `@include admin-list-item` |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| CSS specificity changes | Keep exact same selectors, only extract values |
| Missing styles | Copy first, verify, comment out original (don't delete) |
| Animation breaks | Test each animation after migration |
| Import order issues | Follow documented dependency order |
| Regression in edge cases | Screenshot comparison at each step |

---

## Success Criteria

- [ ] `_admin.scss` deleted (replaced by `admin/` directory)
- [ ] Total admin CSS ~2,500 lines (down from 3,307 - removed duplications)
- [ ] Each partial <500 lines
- [ ] All repeated values use tokens
- [ ] All input styling uses mixins
- [ ] Zero duplicate keyframes
- [ ] ZERO visual changes
- [ ] All animations preserved
- [ ] Build passes clean
- [ ] Mobile responsive works

---

## Execution Order Summary

```
Day 1 (Foundation):
  1. Add tokens to _variables.scss
  2. Add mixins to _components.scss
  3. Create admin/ directory structure
  4. Migrate _base.scss
  5. Migrate _dashboard.scss

Day 2 (Features):
  6. Migrate _dialogs.scss
  7. Migrate _gallery.scss
  8. Migrate _inquiries.scss
  
Day 3 (Complete):
  9. Migrate _templates.scss
  10. Migrate _customers.scss
  11. Update main _index.scss
  12. Full testing
  13. Cleanup
```

---

## References

- Research: `memory-bank/research-admin-scss-refactor-2025-11-28.md`
- Current file: `app/styles/_admin.scss` (3,307 lines)
- Target directory: `app/styles/admin/`
- Dependencies: `_components.scss`, `_variables.scss`, `_animations.scss`
