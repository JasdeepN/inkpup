# Implementation Plan: Price Breakdown Preview Feature

**Date:** 2025-11-26
**Research Brief:** Documented in systemPatterns.md and decisionLog.md (2025-11-26)
**Status:** Planning Complete
**Branch:** dev

---

## 1. Main Task

Implement a Price Breakdown Preview panel in the admin pricing dashboard that shows how changes to pricing data (sizes, styles, color profiles) affect the final estimated prices displayed on the public site. The preview displays a visual breakdown showing each component's contribution to the final price.

**Problem Statement:**
Admins editing pricing data cannot easily see how their changes affect final estimates. The current system combines Size base × Style multiplier × Color multiplier, but doesn't visualize each component's contribution.

---

## 2. Success Criteria

- [ ] Admin can see price breakdown on all pricing admin pages (/styles, /sizes, /colors)
- [ ] Selecting different Size/Style/Color combinations shows live calculation
- [ ] Breakdown shows each component's percentage contribution with visual bars
- [ ] Preview panel is collapsible to minimize UI clutter
- [ ] Works with D1 data in production, shows "unavailable" message in local dev
- [ ] Unit tests for calculation logic (100% coverage of breakdown function)
- [ ] Integration tests verify component renders correctly
- [ ] Build passes without errors

---

## 3. Major Components

| # | Component | Description | Effort |
|---|-----------|-------------|--------|
| 1 | Calculation Utilities | Price breakdown calculation with contribution percentages | Low |
| 2 | PriceBreakdownPreview Component | Client component with selectors and visual breakdown | Medium |
| 3 | Layout Integration | Add preview panel to pricing layout | Low |
| 4 | Styling | Glass panel styling, progress bars, collapsible state | Low |
| 5 | Unit Tests | Test calculation logic and edge cases | Medium |
| 6 | Integration Tests | Test component rendering with mock data | Low |
| 7 | Build Verification | Ensure production build passes | Low |

---

## 4. Actionable Steps

### Phase 1: Calculation Utilities

#### Step 1.1: Create Price Breakdown Calculator
**File:** `lib/pricing-breakdown.ts`

```typescript
interface PriceBreakdown {
  sizeId: string;
  sizeLabel: string;
  baseRange: [number, number];
  
  styleId: string;
  styleLabel: string;
  styleMultiplier: number;
  
  colorId: string;
  colorLabel: string;
  colorMultiplier: number;
  
  finalRange: [number, number];
  
  // Contribution percentages (sum to 100%)
  contributions: {
    size: number;    // Base contribution (before multipliers)
    style: number;   // Additional % from style
    color: number;   // Additional % from color
  };
}

function calculatePriceBreakdown(
  sizeId: string,
  styleId: string,
  colorId: string,
  sizes: SizeCategory[],
  styles: Style[],
  colors: ColorProfile[]
): PriceBreakdown | null
```

**Logic:**
- Find size, style, color by ID
- Calculate base range from size
- Apply multipliers: final = base × style × color
- Calculate contributions:
  - Base contribution = 1 / (style × color) × 100%
  - Style contribution = (style - 1) / (style × color - 1) × (100% - base%)
  - Color contribution = remaining %

**Tool:** create_file

---

#### Step 1.2: Export from pricing module
**File:** `lib/pricing.ts`

- Re-export `calculatePriceBreakdown` for use in components
- Keep existing `estimatePriceRange` for backward compatibility

**Tool:** replace_string_in_file

---

### Phase 2: PriceBreakdownPreview Component

#### Step 2.1: Create Component File
**File:** `components/admin/PriceBreakdownPreview.tsx`

**Structure:**
```tsx
'use client';

interface PriceBreakdownPreviewProps {
  sizes: SizeCategory[];
  styles: Style[];
  colors: ColorProfile[];
  defaultSizeId?: string;
  defaultStyleId?: string;
  defaultColorId?: string;
}

export default function PriceBreakdownPreview({ ... }: PriceBreakdownPreviewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedSize, setSelectedSize] = useState(defaultSizeId || '');
  const [selectedStyle, setSelectedStyle] = useState(defaultStyleId || '');
  const [selectedColor, setSelectedColor] = useState(defaultColorId || '');
  
  const breakdown = useMemo(() => 
    calculatePriceBreakdown(selectedSize, selectedStyle, selectedColor, sizes, styles, colors),
    [selectedSize, selectedStyle, selectedColor, sizes, styles, colors]
  );
  
  return (
    <div className="price-breakdown-panel">
      <CollapsibleHeader />
      {isOpen && (
        <>
          <SizeSelector />
          <StyleSelector />
          <ColorSelector />
          <BreakdownDisplay breakdown={breakdown} />
        </>
      )}
    </div>
  );
}
```

**Tool:** create_file

---

#### Step 2.2: Create Breakdown Display Sub-component
**File:** `components/admin/PriceBreakdownPreview.tsx` (continued)

**BreakdownDisplay features:**
- Visual progress bars for each component's contribution
- Color-coded: Size (blue), Style (purple), Color (green)
- Show multiplier values next to labels
- Final estimate prominently displayed
- Percentage labels on bars

**Visual mockup:**
```
┌────────────────────────────────────────────┐
│ 💰 Price Preview                      [−]  │
├────────────────────────────────────────────┤
│ Size:   [Small (1-2")              ▼]      │
│ Style:  [Traditional               ▼]      │
│ Color:  [Full Color                ▼]      │
│                                            │
│ ───────────── Breakdown ───────────────    │
│                                            │
│ Base Price         $150 - $200             │
│ ██████████████████████████████░░░░ 72%     │
│                                            │
│ Style (×1.20)      +$30 - $40              │
│ ██████████░░░░░░░░░░░░░░░░░░░░░░░░ 14%     │
│                                            │
│ Color (×1.15)      +$22 - $30              │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░ 11%     │
│                                            │
│ ═══════════════════════════════════════    │
│ ESTIMATED TOTAL:   $207 - $276 CAD         │
└────────────────────────────────────────────┘
```

**Tool:** create_file (part of same file)

---

### Phase 3: Layout Integration

#### Step 3.1: Update Pricing Layout
**File:** `app/dashboard/pricing/layout.tsx`

Changes:
1. Fetch sizes, styles, colors from D1 in server component
2. Pass data to PriceBreakdownPreview
3. Add preview panel below navigation or in sidebar
4. Handle D1 unavailable case (hide preview or show notice)

```tsx
// Server component additions
const db = getD1Binding();
let sizes: SizeCategory[] = [];
let styles: Style[] = [];
let colors: ColorProfile[] = [];

if (db) {
  [sizes, styles, colors] = await Promise.all([
    getSizeCategories(db),
    getStyles(db),
    getColorProfiles(db),
  ]);
}

// In JSX
{db && sizes.length > 0 && styles.length > 0 && colors.length > 0 && (
  <PriceBreakdownPreview 
    sizes={sizes}
    styles={styles}
    colors={colors}
  />
)}
```

**Tool:** replace_string_in_file

---

#### Step 3.2: Add Styling
**File:** `app/globals.scss` or `app/styles/_admin.scss`

Add styles for:
- `.price-breakdown-panel` container
- `.breakdown-bar` progress bars with color variants
- `.breakdown-label` typography
- Collapsible animation
- Responsive adjustments

**Tool:** replace_string_in_file or create_file

---

### Phase 4: Unit Tests

#### Step 4.1: Test Calculation Logic
**File:** `lib/pricing-breakdown.test.ts`

Test cases:
1. **Happy path**: Valid size/style/color returns correct breakdown
2. **Multiplier math**: Verify percentage calculations
3. **Base-only case**: Style=1.0, Color=1.0 → 100% base contribution
4. **High multipliers**: Style=2.0, Color=1.5 → verify proportions
5. **Invalid ID**: Returns null for missing size/style/color
6. **Empty arrays**: Returns null gracefully
7. **Edge cases**: Multiplier of exactly 1.0, very small/large values

**Tool:** create_file

---

#### Step 4.2: Test Component Rendering
**File:** `components/admin/PriceBreakdownPreview.test.tsx`

Test cases:
1. **Renders selectors**: All three dropdowns present
2. **Updates on selection**: Changing dropdown updates breakdown
3. **Shows breakdown**: Progress bars render with correct widths
4. **Collapsible**: Toggle open/closed state
5. **Empty data**: Shows appropriate message when no data
6. **Accessibility**: Labels associated with selectors

**Tool:** create_file

---

### Phase 5: Build Verification

#### Step 5.1: Run Tests
**Command:** `npm test -- --testPathPatterns="pricing-breakdown|PriceBreakdownPreview" --forceExit`

- All tests pass
- Coverage meets thresholds

**Tool:** run_in_terminal

---

#### Step 5.2: Run Build
**Command:** `npm run build`

- No TypeScript errors
- No ESLint errors
- Build completes successfully

**Tool:** run_in_terminal

---

#### Step 5.3: Manual Testing
**Steps:**
1. Start dev server: `npm run dev`
2. Navigate to `/dashboard/pricing/styles`
3. Verify preview panel appears (or unavailable message in local dev)
4. In production, test:
   - Select different sizes → base price changes
   - Select different styles → multiplier and contribution update
   - Select different colors → final estimate updates
   - Collapse/expand panel
   - Verify percentages sum to ~100%

**Tool:** Browser testing

---

## 5. #todos

### Phase 1: Calculation
- [ ] #todo Create `lib/pricing-breakdown.ts` with `calculatePriceBreakdown` function
- [ ] #todo Export breakdown function from `lib/pricing.ts`

### Phase 2: Component
- [ ] #todo Create `components/admin/PriceBreakdownPreview.tsx` with selectors
- [ ] #todo Implement BreakdownDisplay with visual progress bars
- [ ] #todo Add collapsible panel functionality

### Phase 3: Integration
- [ ] #todo Update `app/dashboard/pricing/layout.tsx` to fetch all pricing data
- [ ] #todo Pass data to PriceBreakdownPreview component
- [ ] #todo Add CSS styling for breakdown panel and bars

### Phase 4: Testing
- [ ] #todo Create `lib/pricing-breakdown.test.ts` with calculation tests
- [ ] #todo Create `components/admin/PriceBreakdownPreview.test.tsx` with render tests
- [ ] #todo Run test suite and verify all pass

### Phase 5: Verification
- [ ] #todo Run production build and verify no errors
- [ ] #todo Manual testing in browser (local + production)
- [ ] #todo Update memory bank with completion status

---

## 6. Tools & Dependencies

| Step | Tool/Function |
|------|---------------|
| Calculation utilities | `create_file` |
| Component creation | `create_file` |
| Layout integration | `replace_string_in_file` |
| Styling | `replace_string_in_file` |
| Unit tests | `create_file` |
| Test execution | `run_in_terminal` (npm test) |
| Build verification | `run_in_terminal` (npm run build) |
| Browser testing | Manual |

**Dependencies (already installed):**
- React 19 (useState, useMemo)
- TypeScript
- Jest + Testing Library
- Tailwind CSS

---

## 7. Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| D1 unavailable in local dev | High | Low | Show "Preview unavailable locally" message |
| Calculation rounding errors | Low | Low | Use Math.round, test edge cases |
| Component state complexity | Low | Med | Use useMemo for derived state |
| Layout breaks on mobile | Med | Low | Test responsive, use Tailwind |
| Performance with large datasets | Low | Low | Data is small (<50 items total) |

---

## 8. Estimated Time

| Phase | Steps | Time |
|-------|-------|------|
| Phase 1: Calculation | 1.1, 1.2 | 20 min |
| Phase 2: Component | 2.1, 2.2 | 45 min |
| Phase 3: Integration | 3.1, 3.2 | 25 min |
| Phase 4: Testing | 4.1, 4.2 | 35 min |
| Phase 5: Verification | 5.1, 5.2, 5.3 | 15 min |
| **Total** | | **~140 min** |

---

## 9. Execution Order

```
Phase 1 ──────────────────────────────────────────────────────────
   │
   ├─ 1.1 Create pricing-breakdown.ts
   │
   └─ 1.2 Export from pricing.ts
           │
Phase 2 ──┼──────────────────────────────────────────────────────
           │
           ├─ 2.1 Create PriceBreakdownPreview.tsx
           │
           └─ 2.2 Implement BreakdownDisplay
                   │
Phase 3 ───────────┼─────────────────────────────────────────────
                   │
                   ├─ 3.1 Update pricing layout
                   │
                   └─ 3.2 Add styling
                           │
Phase 4 ───────────────────┼─────────────────────────────────────
                           │
                           ├─ 4.1 Unit tests (calculation)
                           │
                           └─ 4.2 Integration tests (component)
                                   │
Phase 5 ───────────────────────────┼─────────────────────────────
                                   │
                                   ├─ 5.1 Run tests
                                   │
                                   ├─ 5.2 Run build
                                   │
                                   └─ 5.3 Manual testing
```

---

## 10. File Summary

**New Files:**
- `lib/pricing-breakdown.ts` - Calculation utilities
- `components/admin/PriceBreakdownPreview.tsx` - Preview component
- `lib/pricing-breakdown.test.ts` - Unit tests
- `components/admin/PriceBreakdownPreview.test.tsx` - Component tests

**Modified Files:**
- `lib/pricing.ts` - Re-export breakdown function
- `app/dashboard/pricing/layout.tsx` - Integrate preview component
- `app/globals.scss` or `app/styles/_admin.scss` - Add styling

---

## 11. Rollback Plan

If issues arise:
1. **Calculation errors**: Revert `lib/pricing-breakdown.ts`, keep existing `estimatePriceRange`
2. **Component issues**: Remove from layout, preview not critical to admin function
3. **Build failures**: Check TypeScript errors, fix or revert affected files
4. **Performance**: Add React.memo to component, lazy load if needed

---

## 12. Post-Implementation

After completion:
- [ ] Update `memory-bank/progress.md` with completion
- [ ] Log any decisions made during implementation
- [ ] Update `memory-bank/systemPatterns.md` if new patterns discovered
- [ ] Consider enhancement: auto-select item being edited on current page

---

*Plan complete. Ready for Execute.prompt.md.*
