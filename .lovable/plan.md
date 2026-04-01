

# Fix 4 Remaining Typography Token Violations

All 4 issues are confirmed still present. Here's the exact fix for each.

---

## Changes

### 1. `src/components/spiritual/PrayerHistory.tsx` — Line 185
- Replace `text-2xl font-bold` with `typography.metric`
- Add `import { typography } from "@/theme/tokens"` if not already imported
- The inline `style={{ color }}` will correctly override the token's color

### 2. `src/components/dashboard/comparison/DivergenceHeatmap.tsx` — Line 41
- Replace `text-2xl font-bold mt-1` with `{cn(typography.metric, "mt-1")}`
- Add `import { typography } from "@/theme/tokens"` and `import { cn } from "@/lib/utils"` if missing

### 3. `src/components/mental-toolkit/tools/BreathingGroundingTool.tsx` — Line 176
- Replace `text-lg font-semibold text-foreground` with `typography.sectionTitle`
- Add `import { typography } from "@/theme/tokens"` if missing

### 4. `src/components/errors/PageErrorBoundary.tsx` — Line 83
- Replace `text-lg font-semibold` with `typography.sectionTitle`
- Verify `typography` import exists (add if missing)

---

## Result

After this, **zero** raw typography violations remain in feature code → **Grade A**.

