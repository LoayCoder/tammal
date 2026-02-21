

# Comprehensive Audit Report: Organization Wellness Dashboard

## Audit Findings Summary

After a deep code review of all dashboard files, database schemas, RLS policies, console logs, and data state, I identified **12 issues** categorized by severity.

---

## CRITICAL Issues (Will cause failures or incorrect data)

### 1. `answer_value` is JSONB, not a number -- category/subcategory score parsing will fail

**File**: `src/hooks/useOrgAnalytics.ts`, lines 335-336

The `answer_value` column in `employee_responses` is `jsonb`. The current code tries to parse it as a number directly:

```
const numVal = typeof r.answer_value === 'number' ? r.answer_value
  : typeof r.answer_value === 'string' ? parseFloat(r.answer_value) : null;
```

When Supabase returns JSONB, it can arrive as `{"value": 4}` or `4` or `"4"` depending on how it was stored. The `submit-response` edge function stores values in varying formats (numeric for scales, string for labels). The code has **no fallback** for object-type values like `{"value": 4}` or `{"selected": "Agree"}`, so these will all produce `null` and be excluded from category scoring.

**Fix**: Add object-type handling: `if (typeof r.answer_value === 'object' && r.answer_value !== null) { numVal = r.answer_value.value ?? r.answer_value.score ?? null; }`

### 2. `batchIn` helper function is defined but NEVER used

**File**: `src/hooks/useOrgAnalytics.ts`, lines 129-135

The `batchIn` function was created to handle the Supabase `.in()` limit of ~1000 items, but it is never called anywhere. All `.in('employee_id', filteredIds)` calls pass the raw array directly. If a tenant has more than ~1000 employees, these queries will silently fail or truncate results.

**Fix**: Apply `batchIn` to all `.in()` calls with `filteredIds`, or at minimum add a guard that chunks the IDs.

### 3. Survey Response Rate query is missing end-date filter

**File**: `src/hooks/useOrgAnalytics.ts`, lines 276-288

Both `schedQuery` and `answeredQuery` use `.gte('...', startDate)` but **do not** apply `.lte('...', endDate)`. This means the survey response rate includes ALL data from startDate to the present, regardless of the selected time range or custom end date. When the user selects "7 days" or a custom range, the KPI will show inflated or incorrect numbers.

**Fix**: Add `.lte('scheduled_delivery', endDate + 'T23:59:59')` and `.lte('responded_at', endDate + 'T23:59:59')` to both queries.

### 4. Mood entries query may hit the default 1000-row Supabase limit

**File**: `src/hooks/useOrgAnalytics.ts`, line 188-194

The mood entries query has no `.limit()` override. Supabase defaults to 1000 rows. A tenant with 200 employees doing daily check-ins for 30 days would generate 6,000 entries. The query would silently return only the first 1000, making ALL downstream calculations (mood trend, risk trend, streak, distribution, org comparison, top engagers) **wrong**.

**Fix**: Add `.limit(10000)` or paginate results. This is the most impactful bug -- it corrupts every KPI and chart.

### 5. Same 1000-row limit applies to `employee_responses` queries

**File**: `src/hooks/useOrgAnalytics.ts`, lines 247-253 and 296-301

The `employee_responses` queries for daily trend and category scores also have no explicit limit. Large tenants will get truncated data.

**Fix**: Add `.limit(10000)` to both queries.

---

## HIGH Issues (Functional problems)

### 6. `useOrgWellnessStats` hook is now orphaned/dead code

**File**: `src/hooks/useOrgWellnessStats.ts`

This hook is no longer imported by any component (confirmed by search). It was the original data source before `useOrgAnalytics` replaced it. It wastes bundle size and creates maintenance confusion.

**Fix**: Delete the file.

### 7. OrgComparison names are not localized (Arabic not shown)

**File**: `src/hooks/useOrgAnalytics.ts`, lines 433-436

The comparison data fetches only `id, name` from branches, departments, divisions, and sections. It does NOT fetch `name_ar`. The `OrgComparisonChart` displays `u.name` directly with no RTL fallback, so Arabic users will always see English names.

**Fix**: Fetch `name_ar` alongside `name` in all four queries, and use `isRTL ? name_ar || name : name` in `OrgComparisonChart.tsx`.

### 8. TopEngagersCard does not localize department names for Arabic

**File**: `src/hooks/useOrgAnalytics.ts`, line 546

The department lookup only fetches `id, name` but not `name_ar`. Arabic users see English department names in the leaderboard.

**Fix**: Fetch `name_ar` from departments and pass the locale-appropriate name.

### 9. Console warning: "Function components cannot be given refs" in CartesianGrid

**Source**: Console logs

Recharts `CartesianGrid` is receiving a ref from a parent. This is a known Recharts v2 issue with React 18 StrictMode. It's a warning, not a crash, but it clutters the console.

**Fix**: This is a library-level issue. No action needed unless it causes visual bugs.

---

## MEDIUM Issues (Edge cases and UX)

### 10. OrgComparison ReferenceLine only shows one avg line for wellness score

**File**: `src/components/dashboard/OrgComparisonChart.tsx`, line 69

Only `orgAvgScore` is used as a `ReferenceLine`, but the chart shows three metrics (Wellness, Participation, Risk) with very different scales (0-5 vs 0-100%). A single reference line at ~3.5 makes no visual sense when plotted alongside percentages.

**Fix**: Either use separate Y-axes for score vs percentage, or remove the misleading single reference line and show per-metric averages in tooltips instead.

### 11. Custom date range arrow symbol "right arrow" not RTL-aware

**File**: `src/components/dashboard/TimeRangeSelector.tsx`, line 72

The separator between start and end date is a hardcoded `-->` character. In RTL mode, the arrow should point left (`<--`).

**Fix**: Use `isRTL ? 'leftarrow' : 'rightarrow'` or replace with a neutral separator like "—".

### 12. OrgFilterBar branch selection clears division/department/section but NOT vice versa

**File**: `src/components/dashboard/OrgFilterBar.tsx`, line 59

When changing branch, it correctly clears downstream filters. However, when changing division (line 78), it preserves `branchId` which may be unrelated to the selected division. This can create contradictory filters (Branch A + Division from Branch B) resulting in zero matched employees.

**Fix**: When division changes, also clear branchId if the selected division doesn't belong to the selected branch.

---

## Implementation Plan

### Phase 1: Fix Critical Data Issues (highest priority)
1. Add `.limit(10000)` to mood_entries and employee_responses queries
2. Add missing `.lte(endDate)` to survey response rate queries
3. Fix `answer_value` JSONB parsing to handle object types
4. Wire `batchIn` to all `.in()` calls or add a size guard

### Phase 2: Fix Localization Gaps
5. Add `name_ar` to all OrgComparison and TopEngager data fetches
6. Update OrgComparisonChart and TopEngagersCard to use locale-aware names
7. Fix the custom date range RTL arrow

### Phase 3: Clean Up
8. Delete orphaned `useOrgWellnessStats.ts`
9. Fix OrgComparison chart reference line to not be misleading
10. Fix OrgFilterBar cascading to prevent contradictory filter states

### Files to Modify
| File | Changes |
|---|---|
| `src/hooks/useOrgAnalytics.ts` | Fix limits, date filters, JSONB parsing, batchIn usage, add name_ar fields |
| `src/components/dashboard/OrgComparisonChart.tsx` | RTL names, fix reference line |
| `src/components/dashboard/TopEngagersCard.tsx` | RTL department names |
| `src/components/dashboard/TimeRangeSelector.tsx` | RTL arrow fix |
| `src/components/dashboard/OrgFilterBar.tsx` | Fix cascading logic |
| `src/hooks/useOrgWellnessStats.ts` | Delete (dead code) |

