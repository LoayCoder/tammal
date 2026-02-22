

# Thought Reframer -- Audit & Fix Plan

## Audit Results

After reviewing all previous plans against the current codebase, here is the status of every planned feature:

### Fully Implemented (no issues)
- Database table `thought_reframes` with proper RLS policies
- `useThoughtReframes` hook with CRUD operations and stats
- Multi-step wizard UI (Steps 1-3 + Summary)
- Stats bar (Total, This Month, Streak)
- Reframe Journal with expand/collapse and soft-delete
- AI Suggest edge function (`suggest-reframe`) with Gemini integration
- AI Suggest button on Step 3
- Voice-to-text (`useSpeechToText` hook + MicButton component)
- RTL-aware arrow icons (ArrowRight/ArrowLeft with `rtl:-scale-x-100`)
- "Save Reframe" relabeled button
- Reframe Activity card on MoodTrackerPage
- Reframe stats in `usePersonalMoodDashboard`
- All localization keys (EN + AR)

### Issues Found

| # | Issue | Location | Severity |
|---|---|---|---|
| 1 | **Unused import**: `differenceInCalendarDays` imported but never used | `useThoughtReframes.ts` line 5 | Low (lint warning) |
| 2 | **Raw arrow character** `→` not RTL-aware in "Go to Reframer" link | `MoodTrackerPage.tsx` line 452 | Medium (RTL bug) |
| 3 | **Cache invalidation mismatch**: `useThoughtReframes` invalidates `['reframe-stats']` but `usePersonalMoodDashboard` uses `['reframe-stats', employeeId]` -- the invalidation won't match the dashboard query | `useThoughtReframes.ts` lines 95, 109 | High (data not refreshing on dashboard after save) |
| 4 | **MicButton tooltip hardcoded**: "Stop" and "Voice input" are hardcoded English strings instead of using translation keys | `ThoughtReframerPage.tsx` lines 61-62 | Medium (i18n gap) |
| 5 | **Error toast hardcoded**: "Error saving reframe" and "Error deleting" are hardcoded English | `ThoughtReframerPage.tsx` lines 94, 103 | Medium (i18n gap) |

---

## Fix Plan

### 1. Fix `useThoughtReframes.ts`
- Remove the unused `differenceInCalendarDays` import
- Fix cache invalidation to use the correct query key pattern: `queryClient.invalidateQueries({ queryKey: ['reframe-stats'] })` should use fuzzy matching which actually already works -- BUT to be safe and explicit, add `exact: false` or invalidate with `['reframe-stats', employeeId]`

### 2. Fix `MoodTrackerPage.tsx` line 452
- Replace the raw `→` with a Lucide `ArrowRight` icon wrapped in `rtl:-scale-x-100`

### 3. Fix `ThoughtReframerPage.tsx` hardcoded strings
- Replace tooltip text "Stop" / "Voice input" with `t("mentalToolkit.thoughtReframer.voiceListening")` / `t("mentalToolkit.thoughtReframer.voiceInput")`
- Replace "Error saving reframe" with a translation key
- Replace "Error deleting" with a translation key

### 4. Add missing translation keys
- `mentalToolkit.thoughtReframer.saveError`: "Error saving reframe" / "خطأ في حفظ إعادة الصياغة"
- `mentalToolkit.thoughtReframer.deleteError`: "Error deleting" / "خطأ في الحذف"
- `mentalToolkit.thoughtReframer.stopListening`: "Stop listening" / "إيقاف الاستماع"

---

## Files to Modify

| File | Change |
|---|---|
| `src/hooks/useThoughtReframes.ts` | Remove unused import, fix cache invalidation key |
| `src/pages/mental-toolkit/MoodTrackerPage.tsx` | Replace raw arrow with RTL-aware icon |
| `src/pages/mental-toolkit/ThoughtReframerPage.tsx` | Replace hardcoded English strings with translation keys |
| `src/locales/en.json` | Add `saveError`, `deleteError`, `stopListening` keys |
| `src/locales/ar.json` | Add `saveError`, `deleteError`, `stopListening` keys |

---

## Dashboard Integration Verification

The reframe data IS properly reflected in the personal dashboard:
- `usePersonalMoodDashboard` fetches reframe stats from `thought_reframes` table (line 153)
- `MoodTrackerPage` displays a "Reframe Activity" card with total, monthly, and streak stats (line 426)
- A "Go to Reframer" link navigates to `/mental-toolkit/thought-reframer` (line 449)
- The cache invalidation fix (item 3) ensures the dashboard updates immediately after saving/deleting a reframe

