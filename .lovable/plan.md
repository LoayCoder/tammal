

## Phase 8 — End-to-End Functional Integration

### Current Integration Audit

| Integration Point | Status | Evidence |
|---|---|---|
| Survey engine | Connected | AI queries `employee_responses` for participation; PulseNudgeCard navigates to `/employee/survey` |
| Check-ins | Connected | AI queries `mood_entries` for consistency + streak; InlineDailyCheckin on same dashboard page |
| User profiles | Connected | `useCurrentEmployee` resolves employee; edge function resolves via `user_id → employees` |
| Team hierarchy | Connected | `manager_id` used for direct reports; `usePulseModes` checks roles + direct reports |
| Organization analytics | Connected | Org mode aggregates across `tenant_id`; admin dashboard includes `TeamPulseCard` |
| Task/workload system | Connected | AI queries `unified_tasks` for completion + overdue; actionPath routes to `/my-workload` |
| Appreciation/recognition | Connected | Sent/received counts fed to AI; `QuickAppreciationCard` on same page; points awarded |
| AI insight generation | Connected | `team-pulse-engine` edge function with structured tool-calling, daily caching |
| Dashboard views | Connected | EmployeeHome, DashboardOverviewTab both render `TeamPulseCard` |
| Action logging | Partial | `PulseActionPath` and `PulseNudgeCard` log to `engagement_action_log`; but appreciation sends and nudge dismissals are NOT logged |
| Notifications | Not connected | No notification sent when engagement drops or when a Kudos Nudge is received |

### Gaps Requiring Implementation

**1. Appreciation sends not logged to engagement_action_log**
The `useAppreciations` hook sends appreciation and awards points, but never calls `logAction.mutate({ actionType: "appreciation_sent", source: "appreciation_widget" })`. This breaks the Action Completion Rate KPI.

**2. Nudge dismissal not tracked**
`PulseNudgeCard` has no dismiss button — users can only act or ignore. Adding a dismiss option with `nudge_dismissed` logging would complete the nudge interaction loop and provide richer analytics.

**3. Check-in from nudge not tracked**
When a user navigates from `PulseNudgeCard` to `/employee/survey` and completes it, there's no way to attribute that action back to the nudge. The `checkin_from_nudge` action type exists in the type definition but is never used.

**4. AI-generated action paths not validated**
The AI can generate any `actionPath` string. If it produces an invalid route (e.g., `/admin/reports` which doesn't exist), the CTA navigates to a 404. The edge function should constrain `actionPath` to a whitelist of valid routes.

**5. Cache invalidation after user action**
After a user clicks a pulse CTA and performs the action (e.g., completes a survey), the pulse data remains stale for 24h (daily cache). The frontend should invalidate the `team-pulse` query after returning from an action route.

**6. Appreciation send → pulse query invalidation**
After sending an appreciation via `QuickAppreciationCard`, the pulse engagement score doesn't update because the `team-pulse` query is not invalidated.

### Plan

#### 1. Log appreciation sends to engagement_action_log

**File**: `src/features/team-pulse/hooks/useAppreciations.ts`

In the `onSuccess` callback of `sendAppreciation`, add a call to insert into `engagement_action_log` with `action_type: "appreciation_sent"` and `source: "appreciation_widget"`. Also invalidate the `team-pulse` query key so the engagement score refreshes.

#### 2. Add nudge dismiss with logging

**File**: `src/features/team-pulse/components/PulseNudgeCard.tsx`

Add a small dismiss button (X icon, top-right). On click, log `nudge_dismissed` to engagement_action_log and hide the card for the session using local state.

#### 3. Constrain AI action paths to valid routes

**File**: `supabase/functions/team-pulse-engine/index.ts`

Add an `enum` constraint to the `actionPath` property in the tool-calling schema, limiting it to known valid routes: `/employee/survey`, `/employee/wellness`, `/my-workload`, `/admin/workload/dashboard`, `/admin/workload/team`, `/admin/org-analytics`. This prevents the AI from generating invalid routes.

#### 4. Invalidate pulse cache after returning from action

**File**: `src/features/team-pulse/components/PulseActionPath.tsx`

This is already handled adequately — the 30-minute `staleTime` on the frontend query means the data refreshes on next visit. No change needed here. However, adding `team-pulse` to the invalidated queries after appreciation send (step 1) ensures the score updates immediately.

#### 5. Add appreciation activity logging in QuickAppreciationCard

**File**: `src/features/team-pulse/components/QuickAppreciationCard.tsx`

Import and use `useEngagementActionLog` to log `appreciation_sent` with metadata including the category, directly in the `handleSend` success path.

### Files Summary

| File | Change |
|------|--------|
| `src/features/team-pulse/hooks/useAppreciations.ts` | Log `appreciation_sent` to engagement_action_log; invalidate `team-pulse` query |
| `src/features/team-pulse/components/PulseNudgeCard.tsx` | Add dismiss button with `nudge_dismissed` logging |
| `src/features/team-pulse/components/QuickAppreciationCard.tsx` | Log `appreciation_sent` via `useEngagementActionLog` |
| `supabase/functions/team-pulse-engine/index.ts` | Add `enum` constraint to `actionPath` in tool schema |

### What Is Not Changing

- No new tables or migrations
- No new routes or pages
- Edge function data aggregation logic unchanged
- Notification system integration deferred (requires notification infrastructure extension)

