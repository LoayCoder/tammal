

## Remaining Operational Enhancements & Risk Elimination

### Identified Issues & Risks

| # | Risk/Issue | Severity | Root Cause |
|---|-----------|----------|------------|
| 1 | CORS import mismatch in `engagement-notifier` | High | Imports `corsHeaders` from SDK v2.95.0 but `createClient` from v2.89.0 — mixed versions may break at runtime |
| 2 | `as any` type casts throughout hooks | Medium | `engagement_notifications` and `engagement_action_log` tables exist in generated types but hooks cast to `any`, bypassing type safety |
| 3 | 500-employee pagination cap in notifier | Medium | `allActiveEmployees` query limited to 500 — larger tenants silently miss employees |
| 4 | `oneDayAgo` unused variable in notifier | Low | Dead code at line 167 — no impact but indicates incomplete logic |
| 5 | No tenant isolation in notifier queries | High | Notifier queries `pulse_targets`, `appreciations`, `mood_entries` without `tenant_id` filter — processes data across all tenants in a single batch, potentially creating cross-tenant notifications |
| 6 | `pulse_targets` upsert uses non-existent index name | Medium | `onConflict: "idx_pulse_targets_unique_daily"` — Supabase upsert expects column names not index names; this silently fails on conflict |
| 7 | PulseNudgeCard dismiss state resets on re-render | Low | Uses React `useState` — dismissal is lost on page navigation or re-mount |
| 8 | Missing error boundary on EngagementInsights page | Medium | If any chart query fails, the entire page crashes with no recovery |
| 9 | No `memo()` on chart components | Low | `PulseTrendChart` and `AppreciationTrendChart` re-render on every parent state change |
| 10 | `engagement-notifier` uses `serve()` deprecated pattern | Low | Should use `Deno.serve()` like other functions |

### Plan

#### 1. Fix `engagement-notifier` edge function (Risks 1, 3, 4, 5, 10)

**File**: `supabase/functions/engagement-notifier/index.ts`

- Replace CORS import with inline `corsHeaders` definition (consistent with other functions)
- Unify SDK version to `@supabase/supabase-js@2.89.0`
- Add tenant-scoped pagination: process employees per tenant using a tenant loop with cursor-based batching (100 per batch, unlimited tenants)
- Remove unused `oneDayAgo` variable
- Ensure all `pulse_targets`, `appreciations`, `mood_entries` queries include `.eq("tenant_id", tenantId)` filter
- Switch to `Deno.serve()` pattern

#### 2. Remove `as any` casts from hooks (Risk 2)

**Files**:
- `src/features/team-pulse/hooks/useEngagementNotifications.ts` — Remove all `as any` casts; the table is in generated types
- `src/features/team-pulse/hooks/useEngagementActionLog.ts` — Remove `as any` cast

#### 3. Fix `pulse_targets` upsert conflict (Risk 6)

**File**: `supabase/functions/team-pulse-engine/index.ts`

Change `onConflict: "idx_pulse_targets_unique_daily"` to `onConflict: "employee_id,scope,target_date"` (actual column names).

#### 4. Persist nudge dismissal per session (Risk 7)

**File**: `src/features/team-pulse/components/PulseNudgeCard.tsx`

Use `sessionStorage` keyed by `nudge-dismissed-{employeeId}` so dismissal survives within a session but resets daily.

#### 5. Add error boundary to EngagementInsights (Risk 8)

**File**: `src/pages/EngagementInsights.tsx`

Wrap chart sections with individual error boundaries using a lightweight `ChartErrorFallback` component that shows a retry button instead of crashing the page.

#### 6. Memoize chart components (Risk 9)

**Files**:
- `src/features/team-pulse/components/PulseTrendChart.tsx` — Wrap export with `memo()`
- `src/features/team-pulse/components/AppreciationTrendChart.tsx` — Wrap export with `memo()`

### Files Summary

| File | Action |
|------|--------|
| `supabase/functions/engagement-notifier/index.ts` | Rewrite with tenant-scoped pagination, fixed CORS, tenant isolation |
| `supabase/functions/team-pulse-engine/index.ts` | Fix upsert `onConflict` column names |
| `src/features/team-pulse/hooks/useEngagementNotifications.ts` | Remove `as any` casts |
| `src/features/team-pulse/hooks/useEngagementActionLog.ts` | Remove `as any` casts |
| `src/features/team-pulse/components/PulseNudgeCard.tsx` | Use `sessionStorage` for dismissal |
| `src/features/team-pulse/components/PulseTrendChart.tsx` | Add `memo()` |
| `src/features/team-pulse/components/AppreciationTrendChart.tsx` | Add `memo()` |
| `src/pages/EngagementInsights.tsx` | Add per-section error boundaries |

### What Is Not Changing

- No database migrations needed
- No new tables or columns
- No changes to `team-pulse-engine` data aggregation logic
- No UI design changes
- Notification bell integration unchanged

