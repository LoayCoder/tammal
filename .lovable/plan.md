

## QA Report — Team Pulse: Gaps Identified & Enhancement Plan

### Current State Summary
The Team Pulse system has a solid foundation: AI-generated insights (Personal/Team/Org), weighted engagement scoring, trend charts, appreciation tracking, action logging, notifications with realtime, and nudge cards. However, several critical QA checklist items are **not met**.

---

### QA Findings

| # | Checklist Item | Status | Detail |
|---|---------------|--------|--------|
| 1 | Core value — "How is my team doing?" | PARTIAL | Shows aggregate score but no per-member breakdown |
| 2 | Mood data accuracy | PASS | Uses last 30 days, correct aggregation |
| 3 | Participation rate | PASS | Calculated correctly in edge function |
| 4 | Workload data accuracy | PASS | Active/overdue/completed counted correctly |
| 5 | **Individual breakdown (manager sees each employee)** | **FAIL** | No per-member status cards showing mood + workload + risk |
| 6 | **Risk identification with visual indicators** | **FAIL** | No combined risk detection (low mood + high workload). No red/yellow/green indicators per employee |
| 7 | Insight generation quality | PASS | AI-generated, context-aware, not generic |
| 8 | **Manager actions (reassign, check-in, send support)** | **FAIL** | Only "Team Kudos Nudge" exists. No reassign, no trigger check-in, no send support |
| 9 | Dynamic integration | PASS | Pulls from mood, tasks, appreciations dynamically |
| 10 | **Trend analysis (7d/14d)** | **PARTIAL** | 30-day trend exists but no 7d/14d comparison or improvement/decline detection |
| 11 | **Team health summary score** | **PARTIAL** | Engagement score exists but no explicit "team health" summary card with risk level |
| 12 | Notifications | PASS | engagement-notifier + realtime subscriptions working |
| 13 | UI/UX VIP standard | PASS | Clean, minimal, premium styling |
| 14 | Performance | PASS | Cached daily, staleTime configured |
| 15 | Security/access | PASS | Role-checked in edge function + RLS |
| 16 | Edge cases (empty states) | PASS | PulseEmptyState handles no-data |

### Critical Gaps (3 items to fix)

---

### Plan: Fix 3 Critical Gaps

### 1. Team Member Risk Grid (Manager Intelligence)

**New hook**: `src/features/team-pulse/hooks/useTeamMemberPulse.ts`
- For managers in "team" mode, fetch per-member data:
  - Latest mood level (from `mood_entries`, last 7 days)
  - Active task count + overdue count (from `unified_tasks`)
  - Last check-in date
- Compute risk level per member: `high` (low mood + overdue > 2 OR no check-in 5+ days), `medium` (mood declining OR overdue > 0), `healthy`

**New component**: `src/features/team-pulse/components/TeamMemberRiskGrid.tsx`
- Renders in TeamPulseCard when mode = "team"
- Compact card per direct report showing:
  - Name, role
  - Mood indicator dot (color-coded)
  - Task load (active/overdue counts)
  - Risk badge: red (High), amber (Medium), green (Healthy)
- Sorted: high-risk first

### 2. Manager Quick Actions

**New component**: `src/features/team-pulse/components/TeamMemberActions.tsx`
- Action buttons per team member in the risk grid:
  - "Send Check-in" → creates an engagement notification to that employee prompting a mood check-in
  - "Send Support" → sends an appreciation with a "support" message
  - "View Workload" → navigates to `/admin/workload/team` filtered to that employee
- Each action logged to `engagement_action_log`

### 3. Team Health Summary Bar

**New component**: `src/features/team-pulse/components/TeamHealthSummary.tsx`
- Shows at top of TeamPulseCard in team mode:
  - Overall team health: Healthy / At Risk / Critical (based on % of members at risk)
  - Stat row: `X healthy | Y at risk | Z critical`
  - Color-coded bar indicator
- Compact, fits above the AI insight block

### Files to Create
1. `src/features/team-pulse/hooks/useTeamMemberPulse.ts`
2. `src/features/team-pulse/components/TeamMemberRiskGrid.tsx`
3. `src/features/team-pulse/components/TeamMemberActions.tsx`
4. `src/features/team-pulse/components/TeamHealthSummary.tsx`

### Files to Modify
1. `src/features/team-pulse/components/TeamPulseCard.tsx` — integrate TeamHealthSummary + TeamMemberRiskGrid in team mode
2. `src/features/team-pulse/index.ts` — export new components/hooks

### No database changes needed
All data comes from existing tables (`mood_entries`, `unified_tasks`, `employees`, `engagement_notifications`, `appreciations`).

