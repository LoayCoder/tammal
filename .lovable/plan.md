

## Color System Audit & Centralization Plan

### Current State

**Integrated (documented in Design System page):**
- Core semantic: primary, secondary, accent, destructive, muted, background, card, border
- Chart colors: chart-1 through chart-5
- Toolkit palette: 10 colors (lavender, sage, plum, sky, gold, peach, warm, coral, amber, rose)
- Zone colors: thriving, watch, atRisk
- Status semantic: success, warning, info + their tint backgrounds

**NOT Integrated (hardcoded across 30+ files):**

| Color Pattern | Used In | Count |
|---|---|---|
| `text-green-500/600/700`, `bg-green-500/10/20` | Status badges, KPIs, install page | ~40 uses |
| `text-red-500/600/700`, `bg-red-500/10/20` | Destructive states, overdue, risk | ~35 uses |
| `text-blue-500/600/700`, `bg-blue-500/10/20` | Info states, trial, active links | ~25 uses |
| `text-orange-500/600`, `bg-orange-500/10` | Warning states, inactive | ~15 uses |
| `text-yellow-500`, `text-amber-500/800` | Rankings, prayer badges, mood | ~20 uses |
| `text-emerald-500/700`, `bg-emerald-500/15` | Prayer completed, mood "great" | ~15 uses |
| `#69cbfc`, `#2a0909`, `#919191` | Islamic Calendar widget | 3 uses |
| `#6366f1`, `#8b5cf6`, `#ec4899` + 7 more hex | Role color picker | 10 colors |
| `#EF4444`, `#F97316` + preset hex | Category color picker | ~12 colors |
| `#3B82F6` | Org default fallback | 1 use |

**Missing semantic states (no token exists):**
- `overdue` — no token, uses raw `red-500` or `destructive`
- `normal` / `default` — no token, uses `muted` inconsistently
- `missed` — uses `destructive` (prayer), raw `red` (tasks)
- `checked` / `completed` — uses `green-500`, `emerald-500`, `chart-2` inconsistently
- `important` / `urgent` — no token, uses `orange` or `red` arbitrarily
- `pending` — uses `blue-500` or `secondary` inconsistently

---

### Plan

#### 1. Add Semantic State CSS Variables to `index.css`

Add new CSS custom properties for task/item states in both `:root` and `.dark`:

```text
--state-completed:      122 39% 49%    (green)
--state-completed-bg:   122 39% 95%
--state-overdue:        4 90% 58%      (red)
--state-overdue-bg:     4 90% 95%
--state-missed:         4 80% 55%      (dark red)
--state-missed-bg:      4 80% 95%
--state-pending:        220 89% 56%    (blue)
--state-pending-bg:     220 89% 96%
--state-important:      25 95% 53%     (orange)
--state-important-bg:   25 95% 96%
--state-normal:         220 9% 46%     (neutral)
--state-normal-bg:      220 9% 96%
--state-checked:        122 39% 49%    (alias of completed)
--state-checked-bg:     122 39% 95%
```

#### 2. Add State Color Tokens to `src/config/toolkit-colors.ts`

Export a new `STATE_COLORS` map:
```ts
export const STATE_COLORS = {
  completed: 'hsl(var(--state-completed))',
  overdue:   'hsl(var(--state-overdue))',
  missed:    'hsl(var(--state-missed))',
  pending:   'hsl(var(--state-pending))',
  important: 'hsl(var(--state-important))',
  normal:    'hsl(var(--state-normal))',
  checked:   'hsl(var(--state-checked))',
};
```

#### 3. Migrate Status Badge Presets

Update `src/shared/status-badge/presets.ts` to use CSS variables instead of hardcoded Tailwind colors:
- `bg-green-500/20 text-green-700` → `bg-[hsl(var(--state-completed))]/20 text-[hsl(var(--state-completed))]`
- Same pattern for all 9 preset configs

#### 4. Update Design System Page

Add a new **"State Colors"** section in `DesignSystemPage.tsx` showing:
- All 7 state colors as swatches with names: Completed, Overdue, Missed, Pending, Important, Normal, Checked
- Each swatch shows both the solid color and its tint background
- A live preview showing badges in each state
- Code snippets for usage

#### 5. Document Hardcoded Hex Colors

Add a **"Widget Accent Colors"** subsection documenting:
- `#69cbfc` (Islamic calendar border)
- Role picker palette (10 hex colors)
- Category picker palette

These remain hex because they're used in color-picker inputs where CSS vars don't work, but they'll be documented as exceptions.

#### 6. Version Bump

Update `src/theme/version.ts` to `1.2.0` with date `2026-04-04`.

---

### Files Modified
1. `src/index.css` — add 14 new CSS variables (light + dark)
2. `src/config/toolkit-colors.ts` — add `STATE_COLORS` export
3. `src/shared/status-badge/presets.ts` — migrate from Tailwind colors to CSS variables
4. `src/pages/dev/DesignSystemPage.tsx` — add State Colors section + Widget Accent Colors
5. `src/theme/version.ts` — bump to 1.2.0

### Not Changed (Phase 2, separate task)
- Migrating 30+ component files that use raw `text-green-500` etc. — this is a larger refactor that should be done module-by-module after the tokens exist

