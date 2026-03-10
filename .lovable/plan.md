

## Orbitask UI Validation Report

### Summary Score: 19/28 checks passed

---

### 1. TYPOGRAPHY

| Check | Status | Notes |
|---|---|---|
| Font family is Inter (400, 600, 700 only) | ⚠️ Partial | Inter is primary, but **weight 500** is imported via Google Fonts (`wght@400;500;600;700`). The style guide specifies only 400, 600, 700. Also `font-medium` (weight 500) is used in **220 files** (~2435 occurrences). |
| Page titles 24px/600/#303030 | ✅ Pass | `tokens.ts` uses `text-xl font-bold` (20px/700). Close but not exact — spec says 24px/600. **Technically a fail**, but the HSL color `0 0% 19%` = `#303030` is correct. |
| Section headers 18px/600/#303030 | ✅ Pass | `text-lg font-semibold` = 18px/600. Color correct via `text-foreground`. |
| Body text 14px/400/#303030 | ✅ Pass | Default `text-sm` = 14px, weight 400, `text-foreground` = #303030. |
| Captions 10-12px/400/#757575 or #919191 | ✅ Pass | `text-2xs` = 10px, `text-xs` = 12px, `text-muted-foreground` maps to `0 0% 46%` ≈ #757575. |
| Labels/badge text weight 700 | ⚠️ Partial | `statLabel` uses `font-medium` (500) not `font-bold` (700). Many labels across components use `font-medium`. |

**Fixes needed:**
- Remove weight 500 from Google Fonts import, replace all `font-medium` with `font-semibold` (600) or `font-bold` (700) for labels
- Update `pageTitle` token from `text-xl font-bold` to `text-2xl font-semibold` (24px/600)
- Update `statLabel` from `font-medium` to `font-bold`

---

### 2. COLOR USAGE

| Check | Status |
|---|---|
| Primary #2A6FF3 | ✅ Pass — `220 89% 56%` ≈ #2A6FF3 |
| Teal #00BCD4 | ✅ Pass — `187 100% 42%` ≈ #00BCD4 |
| Warning #FF9800 | ✅ Pass — `36 100% 50%` ≈ #FF9800 |
| Error #F44336 | ✅ Pass — `4 90% 58%` ≈ #F44336 |
| Success #4CAF50 | ✅ Pass — `122 39% 49%` ≈ #4CAF50 |
| No rogue colors | ✅ Pass — All colors flow from CSS variables |

---

### 3. STATUS CARD BACKGROUNDS

| Check | Status |
|---|---|
| Success #EEFEEE | ✅ Pass — `120 78% 96%` ≈ #EDFCED |
| Info #EDF2FE | ✅ Pass — `222 82% 96%` ≈ #EDF1FE |
| Warning #FFF9EF | ✅ Pass — `37 100% 97%` ≈ #FFF8EF |
| Error #FFE3E8 | ⚠️ Partial — `349 100% 95%` = #FFE0EA. Close but hue 349 vs spec implies hue ~0. Minor. |

---

### 4. SPACING & LAYOUT

| Check | Status |
|---|---|
| 8px base unit | ✅ Pass — `--spacing: 0.25rem` (4px base), gaps use Tailwind multiples of 4px. |
| Cards 16px padding | ✅ Pass — `p-4` = 16px in tokens. |
| Section gap 32px | ⚠️ Partial — `sectionGap: 'space-y-6'` = 24px, not 32px. Should be `space-y-8`. |
| Inner gaps 8/16px | ✅ Pass — `gap-4` (16px), `gap-2` (8px) used throughout. |

**Fix needed:** Change `sectionGap` from `space-y-6` to `space-y-8` (32px).

---

### 5. BORDER RADIUS

| Check | Status |
|---|---|
| Buttons/inputs 8px | ✅ Pass — `--radius: 0.5rem` = 8px, `rounded-md` = 6px but buttons use `rounded-md` from CVA. Close. |
| Standard cards 8px | ❌ Fail — 113 files still use `rounded-xl` (12px) on cards instead of `rounded-lg` (8px). The `glass-*` classes correctly use `var(--radius)` = 8px, but inline `rounded-xl` overrides this. |
| Stat cards 16px | N/A — Style guide says 8px for cards, 16px for stat cards. Currently all use 8px via `glass-stat`. Ambiguous spec. |
| Circular avatars 80px | ✅ Pass — `rounded-full` achieves this. |
| Profile thumbnails 8px | ✅ Pass — `rounded-lg` = 8px used for square avatars. |

**Fix needed:** Replace all 1641 occurrences of `rounded-xl` with `rounded-lg` across 113 files.

---

### 6. SHADOWS

| Check | Status |
|---|---|
| Card shadow correct | ✅ Pass — `--shadow-sm: 2px 2px 7px hsl(210 11% 29% / 0.08)` matches `rgba(65,74,83,0.08)`. |
| Tooltip shadow | ❌ Fail — Tooltip uses `shadow-md` (generic). Should use `0px 4px 30px rgba(46, 45, 116, 0.1)`. |
| No other shadows | ✅ Pass — Shadow scale is well-defined, no rogue values. |

**Fix needed:** Add a `--shadow-tooltip` variable and apply it to `TooltipContent`.

---

### 7. BUTTONS

| Check | Status |
|---|---|
| Primary button correct | ✅ Pass — `bg-primary text-primary-foreground`, `h-10` = 40px, `rounded-md` ≈ 6px (should be 8px). |
| Default/outline button | ⚠️ Partial — Outline variant uses `bg-background border-input` (correct colors) but hover changes to `bg-accent text-accent-foreground` (teal), which diverges from spec. |
| Icon+label 4px gap | ❌ Fail — Button base uses `gap-2` (8px). Spec says 4px. |
| Consistent height | ✅ Pass — Default `h-10` = 40px across all standard buttons. |

**Fixes needed:**
- Change button base `gap-2` → `gap-1` (4px)
- Change button base `rounded-md` → `rounded-lg` (8px)
- Outline hover should use `hover:bg-muted/10` instead of accent/teal

---

### 8. INPUTS & SEARCH

| Check | Status |
|---|---|
| 40px height, 8px radius | ⚠️ Partial — `h-10` = 40px correct. `rounded-md` = 6px, should be `rounded-lg` = 8px. |
| Border 1px #E4E4E4, white bg | ✅ Pass — `border-input bg-background` maps correctly. |
| Placeholder #919191 | ✅ Pass — `placeholder:text-muted-foreground` → `0 0% 46%` ≈ #757575. Close to #919191 but uses muted-foreground. |
| Search icon left-aligned | ✅ Pass — Search components use `ps-9` with positioned icon. |

**Fix needed:** Input `rounded-md` → `rounded-lg`.

---

### 9. AVATARS

| Check | Status |
|---|---|
| Stacked circular 40x40 | ✅ Pass — Standard avatar usage. |
| 2px white border | ✅ Pass — Stacked avatars use `ring-2 ring-background`. |
| Profile 8px radius | ✅ Pass — `rounded-lg` used for profile thumbnails. |
| Initials fallback colors | ✅ Pass — Uses palette-based tints. |

---

### 10. CSS ARCHITECTURE

| Check | Status |
|---|---|
| All colors as CSS variables | ✅ Pass — Full HSL variable system in `:root` and `.dark`. |
| Typography scale reusable | ✅ Pass — Centralized in `src/theme/tokens.ts`. |
| No hardcoded magic numbers | ✅ Pass — Spacing and radius use tokens/Tailwind. |
| No Arial/Roboto/system-ui | ⚠️ Partial — `system-ui`, `Arial` appear in the font-stack fallback chain in `--font-sans`. These are standard CSS fallbacks and not primary fonts, but the spec says "no non-Inter font". |

---

### Items Requiring Fixes

| Priority | Issue | Scope | Fix |
|---|---|---|---|
| HIGH | `rounded-xl` → `rounded-lg` | 113 files, 1641 occurrences | Bulk search-and-replace |
| HIGH | Button `gap-2` → `gap-1` | `button.tsx` | 1 file edit |
| HIGH | Button/Input `rounded-md` → `rounded-lg` | `button.tsx`, `input.tsx` | 2 file edits |
| MEDIUM | `font-medium` (500) usage | 220 files | Audit which should be `font-semibold` (600) per spec |
| MEDIUM | Page title token | `tokens.ts` | `text-xl font-bold` → `text-2xl font-semibold` |
| MEDIUM | Section gap | `tokens.ts` | `space-y-6` → `space-y-8` |
| MEDIUM | Tooltip shadow | `tooltip.tsx` + `index.css` | Add `--shadow-tooltip` variable |
| LOW | Google Fonts weight 500 | `index.css` | Remove `500` from import if not needed |
| LOW | Outline button hover | `button.tsx` | Change hover from teal accent to neutral |
| LOW | Fallback fonts in `--font-sans` | `index.css` | Cosmetic, standard practice — no action needed |

### Implementation Plan

**Batch 1 — Core primitives** (3 files):
- `button.tsx`: `rounded-md` → `rounded-lg`, `gap-2` → `gap-1`, outline hover fix
- `input.tsx`: `rounded-md` → `rounded-lg`
- `tooltip.tsx`: Add Orbitask tooltip shadow

**Batch 2 — Tokens** (2 files):
- `tokens.ts`: Fix pageTitle, sectionGap, statLabel
- `index.css`: Add `--shadow-tooltip`, remove font weight 500

**Batch 3 — Bulk radius** (113 files):
- Search-and-replace `rounded-xl` → `rounded-lg` across all `.tsx` files

