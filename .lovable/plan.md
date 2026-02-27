

## Phase 2: Analytics Architecture Consolidation

### Objective
Reorganize the fragmented analytics system from 5 scattered files into a clean `src/lib/analytics/` module with feature-isolated submodules. Zero UI/API contract changes.

---

### Current State (6 files, 3 import patterns)

```text
src/lib/analyticsTypes.ts        -- types + emptyResult()
src/lib/analyticsComputation.ts  -- pure computations (KPIs, streaks, mood trends)
src/lib/analyticsQueries.ts      -- Supabase queries (mood entries, org comparison, top engagers)
src/lib/wellnessAnalytics.ts     -- risk scoring, early warnings, health score, period comparison
src/lib/synthesisEngine.ts       -- BAI synthesis, checkin pulse, survey structural
src/hooks/analytics/useOrgAnalytics.ts -- 384-line orchestrator with inline Supabase calls
```

Problems:
- `wellnessAnalytics.ts` imports types from `@/hooks/useOrgAnalytics` (circular-risk)
- `analyticsTypes.ts` imports `TrendOverlayPoint` from a UI component
- `useOrgAnalytics.ts` still has ~100 lines of inline Supabase queries (category/subcategory analysis, period comparison)
- Streak logic in `analyticsComputation.ts` is reimplemented (not delegating to `gamificationService`)

---

### Target Structure

```text
src/lib/analytics/
    index.ts                    -- barrel re-exports for backward compat
    types.ts                    -- ALL analytics types consolidated
    queries.ts                  -- ALL Supabase query logic
    synthesis.ts                -- synthesis engine (BAI, checkin pulse, survey structural)
    computations/
        index.ts                -- barrel
        kpis.ts                 -- computeKPIs, computeMoodDistribution
        streak.ts               -- delegates to gamificationService.computeStreak()
        moodTrends.ts           -- daily trend, checkin mood over time, support actions
        riskScore.ts            -- risk scoring, early warnings, health score, period comparison
        engagement.ts           -- day-of-week activity, org-unit breakdown
```

---

### Step-by-step Changes

#### 1. Create `src/lib/analytics/types.ts`

Consolidate ALL types from:
- `analyticsTypes.ts` (TimeRange, OrgFilter, CategoryScore, SubcategoryScore, AffectiveDistribution, DayOfWeekActivity, RiskTrendPoint, OrgUnitComparison, OrgComparison, TopEngager, CheckinMoodOverTimePoint, SupportActionCount, StreakBucket, CheckinByOrgUnitItem, MoodEntry, OrgAnalyticsData, emptyResult)
- `wellnessAnalytics.ts` (CategoryRiskScore, CategoryTrendPoint, CategoryMoodCell, EarlyWarning, PeriodComparison)
- `synthesisEngine.ts` (CheckinPulseMetrics, SurveyStructuralMetrics, DivergenceAlert, DepartmentBAIItem, SynthesisResult)
- `TrendOverlayPoint` (currently defined in a UI component -- will be defined here, re-exported from the component file for backward compat)

This file has ZERO imports from hooks or components. Self-contained.

#### 2. Create `src/lib/analytics/computations/kpis.ts`

Move from `analyticsComputation.ts`:
- `computeKPIs()`
- `computeMoodDistribution()`

Pure functions, import types from `../types`.

#### 3. Create `src/lib/analytics/computations/streak.ts`

Move from `analyticsComputation.ts`:
- `computeStreaks()` -- delegates internally to `gamificationService.computeStreak()` per employee
- `computeStreakDistribution()` -- delegates similarly

This eliminates the duplicated UTC date-diff logic. The functions call `computeStreak()` from `@/services/gamificationService` for each employee's date array.

#### 4. Create `src/lib/analytics/computations/moodTrends.ts`

Move from `analyticsComputation.ts`:
- `computeDailyTrend()`
- `computeCheckinMoodOverTime()`
- `computeSupportActions()`

#### 5. Create `src/lib/analytics/computations/riskScore.ts`

Move from `wellnessAnalytics.ts`:
- `computeRiskScore()`
- `riskStatus()`
- `computeCategoryRiskScores()`
- `computeDeclineRate()` (currently private -- stays private)
- `detectEarlyWarnings()`
- `computeHealthScore()`
- `computePeriodComparison()`

#### 6. Create `src/lib/analytics/computations/engagement.ts`

Move from `analyticsComputation.ts`:
- `computeDayOfWeekActivity()`
- `computeCheckinByOrgUnit()`

#### 7. Create `src/lib/analytics/computations/index.ts`

Barrel file re-exporting all computation submodules.

#### 8. Create `src/lib/analytics/synthesis.ts`

Move ALL logic from `synthesisEngine.ts`:
- `computeCheckinPulse()`
- `computeSurveyStructural()`
- `computeBAI()`
- `computeConfidence()`
- `detectDivergencePatterns()`
- `getRecommendedActionKey()`
- `computeSynthesis()`
- Helper functions (stddev, coefficientOfVariation, normalize1to5, classifyBAI, divergenceLevel)

Imports types from `./types`.

#### 9. Create `src/lib/analytics/queries.ts`

Move ALL logic from `analyticsQueries.ts`:
- `hasOrgFilter()`
- `resolveFilteredEmployeeIds()`
- `batchedQuery()`
- `fetchMoodEntries()`
- `fetchActiveEmployeeCount()`
- `fetchSurveyResponseRate()`
- `computeOrgComparison()`
- `computeTopEngagers()`
- `parseAnswerValue()`

ALSO extract from `useOrgAnalytics.ts` into this file:
- Category/subcategory/affective response fetching and aggregation (lines 112-204)
- Category trend + risk matrix computation (lines 206-302)
- Period comparison data fetching (lines 308-326)
- Trend overlay computation (lines 357-366)

These become new exported functions:
- `fetchCategoryAnalysis()` -- returns { categoryScores, subcategoryScores, affectiveDistribution }
- `computeCategoryTrendsAndMatrix()` -- returns { categoryTrends, categoryMoodMatrix, moodByCategoryData, catNegMap }
- `fetchPeriodComparison()` -- returns PeriodComparison | null
- `computeTrendOverlay()` -- returns TrendOverlayPoint[]

#### 10. Create `src/lib/analytics/index.ts`

Barrel file that re-exports:
- Everything from `./types`
- Everything from `./computations`
- Everything from `./queries`
- Everything from `./synthesis`

#### 11. Rewrite `src/hooks/analytics/useOrgAnalytics.ts`

Becomes a thin orchestrator (~80 lines):
- Imports from `@/lib/analytics` only
- `useQuery` wraps a clean sequence: date range setup -> parallel fetches -> computations -> synthesis -> return
- Zero inline Supabase calls
- Zero business logic
- Re-exports types from `@/lib/analytics/types` for backward compatibility

#### 12. Update old file re-exports (backward compat shims)

Replace file contents with re-exports:
- `src/lib/analyticsTypes.ts` -> `export * from './analytics/types'`
- `src/lib/analyticsComputation.ts` -> `export * from './analytics/computations'`
- `src/lib/analyticsQueries.ts` -> `export * from './analytics/queries'`
- `src/lib/wellnessAnalytics.ts` -> `export * from './analytics/computations/riskScore'; export type/re-export relevant types from './analytics/types'`
- `src/lib/synthesisEngine.ts` -> `export * from './analytics/synthesis'`
- `src/hooks/useOrgAnalytics.ts` -> unchanged (already `export * from './analytics/useOrgAnalytics'`)

This ensures all 16+ consumer components continue to work without import changes.

#### 13. Move `TrendOverlayPoint` type definition

Define `TrendOverlayPoint` in `src/lib/analytics/types.ts`. Update `TrendOverlayChart.tsx` to import from `@/lib/analytics/types` and re-export it for any consumers that import from the component.

---

### Consumer Impact (Zero Breaking Changes)

| Current Import Path | Change Needed |
|---|---|
| `@/hooks/analytics/useOrgAnalytics` (16 components) | None -- re-exports preserved |
| `@/hooks/useOrgAnalytics` (1 file: wellnessAnalytics.ts) | None -- shim preserved |
| `@/lib/wellnessAnalytics` (4 components) | None -- shim re-exports |
| `@/lib/synthesisEngine` (5 components) | None -- shim re-exports |
| `@/lib/analyticsTypes` (1 file: useOrgAnalytics.ts) | None -- shim re-exports |
| `@/lib/analyticsComputation` (1 file: useOrgAnalytics.ts) | None -- shim re-exports |
| `@/lib/analyticsQueries` (1 file: useOrgAnalytics.ts) | None -- shim re-exports |

---

### Streak Deduplication Detail

Current: `analyticsComputation.ts` has its own UTC date-diff loop in both `computeStreaks()` and `computeStreakDistribution()`.

After: Both functions call `gamificationService.computeStreak()` per employee:

```text
computeStreaks(entries):
  group entries by employee_id
  for each employee:
    streak = gamificationService.computeStreak(employeeDates)
  return { avgStreak, employeeEntryMap }

computeStreakDistribution(employeeEntryMap):
  for each employee:
    streak = gamificationService.computeStreak(employeeDates)
  bucket into distribution
```

---

### File Changelog

| Action | File | Details |
|--------|------|---------|
| Create | `src/lib/analytics/types.ts` | All 25+ interfaces and types consolidated |
| Create | `src/lib/analytics/computations/kpis.ts` | KPI + mood distribution |
| Create | `src/lib/analytics/computations/streak.ts` | Streak via gamificationService |
| Create | `src/lib/analytics/computations/moodTrends.ts` | Daily trend, checkin mood, support actions |
| Create | `src/lib/analytics/computations/riskScore.ts` | Risk, warnings, health, period comparison |
| Create | `src/lib/analytics/computations/engagement.ts` | Day-of-week, org-unit breakdown |
| Create | `src/lib/analytics/computations/index.ts` | Barrel |
| Create | `src/lib/analytics/synthesis.ts` | Full synthesis engine |
| Create | `src/lib/analytics/queries.ts` | All DB queries + extracted inline queries |
| Create | `src/lib/analytics/index.ts` | Barrel |
| Modify | `src/hooks/analytics/useOrgAnalytics.ts` | Thin orchestrator, no inline Supabase |
| Modify | `src/lib/analyticsTypes.ts` | Becomes re-export shim |
| Modify | `src/lib/analyticsComputation.ts` | Becomes re-export shim |
| Modify | `src/lib/analyticsQueries.ts` | Becomes re-export shim |
| Modify | `src/lib/wellnessAnalytics.ts` | Becomes re-export shim |
| Modify | `src/lib/synthesisEngine.ts` | Becomes re-export shim |
| Modify | `src/components/dashboard/comparison/TrendOverlayChart.tsx` | Import TrendOverlayPoint from analytics/types |

**Total: 10 new files, 7 modified files, 0 deleted files**

---

### Post-Refactor Dependency Map

```text
Components (16+)
  |
  +--> useOrgAnalytics (hook -- React Query only)
  |       |
  |       +--> analytics/queries.ts (all Supabase calls)
  |       |       +--> gamificationService (computeStreak, calculatePoints)
  |       |
  |       +--> analytics/computations/* (pure functions)
  |       |       +--> gamificationService (streak only)
  |       |
  |       +--> analytics/synthesis.ts (pure functions)
  |
  +--> analytics/types.ts (direct type imports by components)
```

No circular dependencies. No reverse flows.

---

### Verification Criteria

1. No duplicate `computeStreak` logic -- all delegate to `gamificationService`
2. No duplicate `calculatePoints` logic -- only in `gamificationService`
3. Zero React imports in `src/lib/analytics/**`
4. Zero `supabase.*` calls in `computations/` or `synthesis.ts`
5. `useOrgAnalytics` return shape unchanged
6. All 16+ consumer imports resolve without changes
7. TypeScript builds without errors

### Risk Assessment: **Low**
- Pure structural move with re-export shims for backward compatibility
- No business logic changes
- No UI changes
- No API contract changes

