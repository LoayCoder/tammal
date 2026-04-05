

## Phase 5 — AI Integration for Actionable Engagement Insights

### Assessment

The AI integration is **already fully implemented** in `team-pulse-engine/index.ts` (505 lines). Here is what exists:

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Analyze engagement signals | Done | Lines 129-353 — weighted composite scoring across check-ins, surveys, tasks, appreciations, streaks |
| Generate one clear insight | Done | `primaryInsight` field via structured tool-calling (line 417) |
| Generate one recommended action | Done | `recommendedAction` field (line 418) |
| Generate one measurable target | Done | `targetMetric` + `targetValue` + `currentValue` fields (lines 420-422) |
| Explain why action matters | Done | Embedded in `primaryInsight` context via system prompt (line 376-389) |
| Premium executive tone | Done | System prompt enforces "premium executive tone" (line 378) |
| No invented data | Done | AI receives only real aggregated metrics; tool-calling schema constrains output shape |
| No confidential details in team/org | Done | System prompt: "NEVER identify individual employees" (line 383); data is pre-aggregated |
| No clinical language | Done | System prompt: "NEVER use clinical or medical language" (line 382) |
| Graceful fallback if insufficient data | Done | Lines 356-372 return `{ insufficientData: true, fallbackCta }` |
| Daily caching | Done | `copilot_insight_cache` upsert (lines 487-493) |
| Target persistence | Done | `pulse_targets` upsert (lines 472-485) |
| Rate limit handling (429/402) | Done | Lines 436-448 |
| Bilingual (EN/AR) | Done | Language passed to system prompt (line 388) |

### Data Inputs Coverage

| Signal | Used | How |
|--------|------|-----|
| Check-ins | Yes | `mood_entries` count (30d) |
| Surveys | Yes | `employee_responses` count (30d) |
| Tasks / overdue | Yes | `unified_tasks` completed vs total (30d) |
| Appreciation activity | Yes | `appreciations` sent + received (30d) |
| Streaks | Yes | Consecutive check-in days computed from mood dates |
| Participation rate | Yes | Team/org: unique participants / total employees |
| Engagement trends | Yes | AI infers `up/down/stable` from data patterns |
| Workload patterns | Partial | Task volume used; dedicated workload hours not yet fed |
| Pulse campaign activity | No | Campaigns not yet built (deferred feature) |
| Response consistency | Partial | Survey response count used; per-question consistency not tracked |

### Gaps to Address

Only two meaningful gaps remain:

**1. Workload signal enrichment** — The AI currently sees task counts but not workload hours or overdue task counts, which would improve insight quality.

**2. 402 Payment Required handling** — The edge function handles 429 (rate limit) but does not explicitly handle 402 (credits exhausted).

### Plan

#### 1. Enrich AI context with workload and overdue data

**File**: `supabase/functions/team-pulse-engine/index.ts`

For each mode, add two additional queries before AI generation:
- **Overdue tasks**: Count tasks where `due_date < today` and `status != 'completed'`
- **Recent workload entries**: Count `daily_work_records` entries (if table exists) for hours-worked signal

Add these to `scopeData` so the AI prompt receives richer context. No scoring weight change needed — this is supplementary context for better insight quality.

#### 2. Handle 402 Payment Required

**File**: `supabase/functions/team-pulse-engine/index.ts`

Add explicit 402 handling alongside the existing 429 block (after line 443):
```
if (status === 402) {
  return Response with { error: "AI credits exhausted" }, status 402
}
```

#### 3. Add "why it matters" field to tool-calling schema

**File**: `supabase/functions/team-pulse-engine/index.ts`

Add an `impactReason` property to the `generate_pulse_insight` tool schema — a one-sentence explanation of why the recommended action matters. Update the `PulseInsight` TypeScript type and render it in `PulseInsightBlock`.

#### 4. Update frontend types and display

| File | Change |
|------|--------|
| `src/features/team-pulse/hooks/useTeamPulse.ts` | Add `impactReason` and `overdueTasks` to `PulseInsight` interface |
| `src/features/team-pulse/components/PulseInsightBlock.tsx` | Render `impactReason` below the insight text in a subtle muted style |

### Files Summary

| File | Change |
|------|--------|
| `supabase/functions/team-pulse-engine/index.ts` | Add overdue task queries, workload context, 402 handling, `impactReason` tool field |
| `src/features/team-pulse/hooks/useTeamPulse.ts` | Add `impactReason` to `PulseInsight` type |
| `src/features/team-pulse/components/PulseInsightBlock.tsx` | Render impact reason text |

### What Is Not Changing

- Scoring weights remain the same (already validated)
- Cache strategy unchanged (daily per scope)
- System prompt guardrails unchanged (already comprehensive)
- Campaign activity deferred (campaigns not yet built)

