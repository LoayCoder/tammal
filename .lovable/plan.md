

## Color Audit: Remaining Unintegrated Colors

### Summary
After the v1.2.0 state color tokens were added, **~260 hardcoded Tailwind color usages remain across 30 files**, plus **~50 hex values across 10 files**. Here is the full breakdown and migration plan.

---

### Unintegrated Colors by Category

**1. Action/Audit Colors** (`src/components/audit/AuditLogTable.tsx`)
- `bg-emerald-500/10 text-emerald-600` → create action
- `bg-blue-500/10 text-blue-600` → update action
- `bg-purple-500/10 text-purple-600` → status_change action
- `bg-amber-500/10 text-amber-600` → module_toggle action

**2. Risk/Synthesis Colors** (`SynthesisCard.tsx`)
- `bg-emerald-500/15 text-emerald-700` → green risk
- `bg-yellow-500/15 text-yellow-700` → yellow risk
- `bg-orange-500/15 text-orange-700` → orange risk

**3. Trend Colors** (`CheckinPulseCard.tsx`)
- `text-emerald-500` → positive trend

**4. Recognition/Ranking Colors** (`RankingsTable.tsx`, `WinnerAnnouncement.tsx`)
- `text-yellow-500` → gold rank
- `text-gray-400` → silver rank
- `text-amber-600` → bronze rank

**5. Prayer/Spiritual Colors** (`PrayerCard.tsx`)
- `border-emerald-500/40` → completed_mosque
- `border-amber-500/40` → completed_home
- `border-gray-500/40` → completed_work
- `border-red-500/40` → missed

**6. MFA/Profile Colors** (`MFASetupDialog.tsx`)
- `bg-green-100 text-green-600` → success state

**7. AI Generator Colors** (`FrameworkDocuments.tsx`, `QuestionCard.tsx`)
- `bg-green-500/10 text-green-600` → extracted
- `bg-amber-500/10 text-amber-600` → pending
- `bg-amber-50 dark:bg-amber-950/30` → alert highlight

**8. Survey Colors** (`EmployeeSurvey.tsx`)
- `border-amber-500/50 bg-amber-500/5` → pending review
- `border-amber-500 text-amber-600` → pending badge

**9. Mood Palette Colors** (`MoodDefinitionDialog.tsx`, `moods.ts`)
- `text-teal-500`, `text-indigo-500`, `text-rose-500`, `text-orange-500`, `text-emerald-500`, `text-amber-500` — user-selectable mood colors

**10. VIP Badge** (`EmployeeHome.tsx`)
- `text-amber-500` → crown icon

**11. Dashboard Widget** (`MentalHealthResourcesHub.tsx`)
- `bg-[#6feb9d]/[0.04]` → green tint

**12. Color Picker Hex Palettes** (intentional exceptions)
- `RoleDialog.tsx`: 10 hex colors
- `CategoryDialog.tsx`: 17 hex colors
- `TaskTagPicker.tsx`: 8 hex colors
- `DivisionSheet.tsx`, `DepartmentSheet.tsx`: `#3B82F6` default

**13. Toast Component** (`toast.tsx`)
- `text-red-300`, `text-red-50`, `ring-red-400`, `ring-offset-red-600` — shadcn default destructive styling

---

### Plan

#### Phase 1: Add New CSS Tokens (index.css)

Add these new semantic variables for light + dark modes:

```text
/* Action audit */
--action-create:     142 71% 45%
--action-update:     217 91% 60%
--action-delete:     (use existing --destructive)
--action-toggle:     38 92% 50%
--action-status:     271 81% 56%

/* Trend */
--trend-positive:    142 71% 45%
--trend-negative:    (use existing --destructive)

/* Rank */
--rank-gold:         48 96% 53%
--rank-silver:       0 0% 70%
--rank-bronze:       33 90% 45%

/* Prayer completion */
--prayer-mosque:     142 71% 45%
--prayer-home:       38 92% 50%
--prayer-work:       0 0% 55%
--prayer-missed:     (use existing --state-missed)
```

#### Phase 2: Export Token Maps (toolkit-colors.ts)

```ts
export const ACTION_COLORS = { create, update, toggle, status };
export const RANK_COLORS = { gold, silver, bronze };
export const PRAYER_COLORS = { mosque, home, work, missed };
export const TREND_COLORS = { positive, negative };
```

#### Phase 3: Migrate Components (30 files)

Replace all hardcoded Tailwind color classes with CSS variable equivalents:
- `text-emerald-500` → `text-[hsl(var(--trend-positive))]`
- `text-yellow-500` → `text-[hsl(var(--rank-gold))]`
- etc.

**Exempt from migration** (documented exceptions):
- Color picker hex arrays (RoleDialog, CategoryDialog, TaskTagPicker) — HTML input requires hex
- Toast component — shadcn internal, don't modify
- Mood definition palette — user-selectable, needs special handling

#### Phase 4: Design System Page Update

Add sections:
- **Action Colors** — audit log action swatches
- **Rank Colors** — gold/silver/bronze
- **Prayer Colors** — mosque/home/work/missed
- **Trend Colors** — positive/negative
- **Documented Hex Exceptions** — color pickers, mood palette

#### Phase 5: Version Bump

Update to `1.3.0` dated `2026-04-04`.

---

### Files Modified
1. `src/index.css` — ~24 new CSS variables (light + dark)
2. `src/config/toolkit-colors.ts` — 4 new token maps
3. `src/components/audit/AuditLogTable.tsx` — migrate action colors
4. `src/components/dashboard/comparison/SynthesisCard.tsx` — migrate risk colors
5. `src/components/dashboard/comparison/CheckinPulseCard.tsx` — migrate trend
6. `src/components/recognition/RankingsTable.tsx` — migrate rank colors
7. `src/components/recognition/WinnerAnnouncement.tsx` — migrate rank colors
8. `src/components/spiritual/PrayerCard.tsx` — migrate prayer colors
9. `src/components/profile/MFASetupDialog.tsx` — use state-completed token
10. `src/features/ai-generator/components/FrameworkDocuments.tsx` — use state tokens
11. `src/features/ai-generator/components/QuestionCard.tsx` — use warning token
12. `src/pages/employee/EmployeeSurvey.tsx` — use state-pending token
13. `src/pages/EmployeeHome.tsx` — use rank-gold token
14. `src/components/dashboard/MentalHealthResourcesHub.tsx` — use toolkit token
15. `src/pages/dev/DesignSystemPage.tsx` — add 4 new sections
16. `src/theme/version.ts` — bump to 1.3.0

### Not Changed (documented exceptions)
- `RoleDialog.tsx`, `CategoryDialog.tsx`, `TaskTagPicker.tsx` — hex color pickers
- `toast.tsx` — shadcn internal component
- `MoodDefinitionDialog.tsx` / `moods.ts` — user-selectable mood palette (Phase 2 candidate)

