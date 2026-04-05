

## Engagement Rank Feature — Quality Audit Results & Fix Plan

### Issues Found

**1. CRITICAL — Supabase 1000-row silent truncation**
The query in `useEmployeeEngagementRank.ts` (line 29-35) fetches `mood_entries` for the entire tenant over 30 days with **no `.limit()` call**. Supabase defaults to 1000 rows. For organizations with 50+ employees checking in daily, this will silently return incomplete data, producing **wrong rankings** without any error.

**Fix**: Add `.limit(50000)` to the query (matching the pattern used in `queries.ts` which uses `.limit(10000)`). Also paginate if needed, but 50k should cover most tenants.

**2. MODERATE — computeStreak penalizes "not yet today"**
`computeStreak` returns 0 if the employee hasn't checked in *today*. This means an employee with a 29-day consecutive streak who simply hasn't opened the app yet today will appear as rank 0 and the badge will hide entirely (`if (!rank || rank <= 0) return null`). At 8 AM, most employees will show no rank.

**Fix**: In the hook, adjust the streak computation to also count from yesterday (i.e., allow a 1-day grace). Check if the latest entry is today OR yesterday before starting the consecutive count. This mirrors how most streak systems work (Duolingo, etc.).

**3. MINOR — No error boundary / silent fail on query error**
If the query throws (network error, RLS issue), React Query will retry but the badge just shows a skeleton forever on persistent failure. There's no fallback or error state in `EngagementRankBadge`.

**Fix**: Add `error` to the hook return, and in the badge component, return `null` on error (same as rank=0) so it degrades gracefully.

**4. MINOR — Missing `tenant_id` RLS consideration**
The query filters by `tenant_id` in the WHERE clause, which is correct. But `employee?.tenant_id` comes from the employees table. If for some reason the employee record exists but tenant_id is null, the query would return nothing. The `enabled` guard checks for truthiness, so this is handled. No fix needed — just noting.

**5. COSMETIC — Rank badge uses `gap-4` (physical property)**
Per RTL protocol, `gap` is direction-agnostic so this is actually fine. No fix needed.

---

### Fix Plan

**File**: `src/hooks/wellness/useEmployeeEngagementRank.ts`

1. Add `.limit(50000)` to the mood_entries query to prevent silent truncation
2. Adjust streak computation to allow 1-day grace (count from yesterday if no entry today)
3. Return `error` from the hook for downstream handling

**File**: `src/components/dashboard/EngagementRankBadge.tsx`

4. Accept optional `error` prop; return `null` on error for graceful degradation

**File**: `src/pages/EmployeeHome.tsx`

5. Pass `error` from hook to badge component

### Files Modified

| File | Change |
|------|--------|
| `src/hooks/wellness/useEmployeeEngagementRank.ts` | Add query limit, fix streak grace period, expose error |
| `src/components/dashboard/EngagementRankBadge.tsx` | Handle error prop gracefully |
| `src/pages/EmployeeHome.tsx` | Pass error to badge |

