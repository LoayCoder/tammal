

## Mobile UX Improvements for Org Wellness Dashboard

Three changes: collapsible filter bar on mobile, hideable cards, and chart clipping fixes.

---

### 1. Collapsible Filter Bar on Mobile

**File**: `src/components/dashboard/OrgFilterBar.tsx`

- Add `useState` for `isOpen` (default `false`)
- On mobile (`md` breakpoint): show only a compact row with the Filter icon + active count badge + a toggle button
- Clicking the filter icon toggles the dropdown with all 4 select inputs stacked vertically
- On desktop: keep current inline layout (always visible)
- Animate open/close with `overflow-hidden` + `max-height` transition

```text
Mobile collapsed:  [🔍 Filter (2)]
Mobile expanded:   [🔍 Filter (2)]
                   [All Branches    ▼]
                   [All Divisions   ▼]
                   [All Departments ▼]
                   [All Sections    ▼]
                   [Clear Filters]
```

---

### 2. Hideable Cards (All Stat Cards + Chart Cards)

**File**: `src/features/org-dashboard/components/StatCards.tsx`
- Add an `EyeOff` icon button on each stat card (top-end corner)
- Track hidden card keys in local state (or localStorage for persistence)
- Hidden cards collapse with a smooth transition
- Show a "Show all" button when any cards are hidden

**File**: `src/features/org-dashboard/components/OverviewTab.tsx`
- Wrap each chart card section (Engagement Trend, Risk Trend, Category Health, etc.) in a collapsible wrapper
- Add an `EyeOff`/`Eye` toggle icon in each card header
- Track visibility state with `useState` (keyed by card name)
- When hidden, the card collapses to just its header row with an `Eye` icon to restore

---

### 3. Fix Chart Clipping on Mobile

The chart lines are being cut off at the top and bottom because the Y-axis domain doesn't include padding.

**File**: `src/features/org-dashboard/components/OverviewTab.tsx` (Engagement Trend)
- Change Y-axis domain from `[1, 5]` to `['auto', 'auto']` with `padding={{ top: 20, bottom: 20 }}`
- Add `margin={{ top: 10, right: 10, bottom: 5, left: 0 }}` to `ComposedChart`

**File**: `src/components/dashboard/RiskTrendChart.tsx`
- Add `padding={{ top: 20, bottom: 10 }}` to YAxis
- Add `margin={{ top: 10, right: 10, bottom: 5, left: 0 }}` to `ComposedChart`
- Reduce `activeDot` radius on mobile for less overflow

**Apply same pattern** to `CategoryHealthChart.tsx` and `AffectiveStateChart.tsx` — add chart margins and Y-axis padding to prevent clipping.

---

### Files Modified

| File | Change |
|------|--------|
| `src/components/dashboard/OrgFilterBar.tsx` | Collapsible on mobile with toggle |
| `src/features/org-dashboard/components/StatCards.tsx` | Hide/show individual cards |
| `src/features/org-dashboard/components/OverviewTab.tsx` | Hideable chart cards + chart margin fix |
| `src/components/dashboard/RiskTrendChart.tsx` | Chart margin/padding fix + hideable |
| `src/components/dashboard/CategoryHealthChart.tsx` | Chart margin/padding fix |
| `src/components/dashboard/AffectiveStateChart.tsx` | Chart margin/padding fix |

