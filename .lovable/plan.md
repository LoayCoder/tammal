

## Fix Workload Intelligence Code Gaps

Based on deep code review, here are the **real code gaps** (not documentation gaps) and the plan to fix each. Organized by priority.

---

### Gap 1: SLA Visibility on Task Cards (HIGH)

**Problem**: `SlaBadge` only appears on `ObjectiveDetail` page (strategic actions). Task cards in My Workload, Team Command Center, and Approval Queue show no SLA indicator. No countdown timer exists.

**Fix**:
- Create `SlaCountdownBadge` component showing remaining time (e.g. "2d 4h left") with color-coded urgency (green/amber/red)
- Add `SlaCountdownBadge` to:
  - `WorkloadTasksView.tsx` (My Workload task rows)
  - `WorkloadApprovalsView.tsx` (approval cards)
  - Team Command Center accordion task rows
  - Task Detail page header

**Files**: New `src/components/workload/governance/SlaCountdownBadge.tsx`, edits to 4 consumer files

---

### Gap 2: Approval UX — Comments/Feedback on Reject (HIGH)

**Problem**: `WorkloadApprovalsView` calls `updateStatus.mutate({ id, status: 'rejected' })` with no comment/reason. Reviewer/approver cannot provide feedback. No rejection reason shown to employee.

**Fix**:
- Add a `RejectWithReasonDialog` (textarea for rejection reason)
- On reject, write reason to `task_activity_logs.details` via the existing `log_approval_activity` trigger (pass reason in metadata)
- Update `useApprovalQueue` to accept optional `reason` field and store in task metadata
- Show rejection reason on Task Detail activity timeline

**Files**: New `src/features/tasks/components/RejectWithReasonDialog.tsx`, edit `WorkloadApprovalsView.tsx`, edit `useApprovalQueue.ts`

---

### Gap 3: AI Redistribution — "Approve & Execute" Workflow (HIGH)

**Problem**: `RedistributionCard` only marks recommendations as accepted/rejected. Accepting does NOT actually reassign the task. It's display-only.

**Fix**:
- When status = 'accepted', also update the `unified_tasks` row to reassign `employee_id` / `assignee_id` to `to_employee_id`
- Add confirmation dialog before execution: "This will reassign task X from Employee A to Employee B"
- Log the reassignment in `task_activity_logs`
- Update `useRedistributions` hook to perform the task reassignment on accept

**Files**: Edit `src/features/workload/hooks/useRedistributions.ts`, edit `RedistributionCard.tsx` (add confirm dialog)

---

### Gap 4: Locking Override Mechanism (MEDIUM)

**Problem**: `enforce_unified_task_lock` trigger is absolute — no way for admin/manager to request an unlock without directly editing `is_locked`. No audit trail for override requests.

**Fix**:
- Create `UnlockRequestDialog` component (justification required, similar to existing `JustificationDialog`)
- When admin/manager submits unlock request: set `is_locked = false`, `status = 'in_progress'`, log justification to `audit_logs`
- Add unlock button to Task Detail page (visible only to admin/manager when task is locked)
- The existing trigger already allows unlock when transitioning to `draft`/`in_progress`, so no DB migration needed

**Files**: New `src/components/workload/governance/UnlockRequestDialog.tsx`, edit Task Detail page

---

### Gap 5: Executive Narrative Insights (MEDIUM)

**Problem**: Executive Dashboard shows raw metrics (TAMMAL Index gauge, KPI numbers) but no AI-generated narrative like "Your organization is at risk because..."

**Fix**:
- Create `ExecutiveNarrativeCard` component
- Call `wellness-copilot` edge function with `scope: 'organization'` (already supported) and display the primary insight as a narrative block
- Fallback: generate a simple rule-based narrative from TAMMAL Index components (e.g., "Burnout health is critically low at 23%")
- Place above the KPI row on Executive Dashboard

**Files**: New `src/features/workload/components/executive/ExecutiveNarrativeCard.tsx`, edit `ExecutiveDashboard.tsx`

---

### Gap 6: Burnout Model — Integrate Mood Data (MEDIUM)

**Problem**: Burnout scoring uses only Capacity (40%) + Overdue (35%) + Off-hours (25%). The platform already has rich mood/mental health data (`mood_entries`, `daily_checkins`) but it's not connected to burnout predictions.

**Fix**:
- Update `workload-ai` edge function's burnout prediction prompt to include recent mood data (avg mood score last 7 days, streak breaks)
- Query `mood_entries` and `daily_checkins` in the data aggregation step
- Add mood signal to the AI prompt context (not to the formula — let AI reason about it)
- No weight formula change needed; the AI model will incorporate mood as a behavioral signal

**Files**: Edit `supabase/functions/workload-ai/index.ts`

---

### Gap 7: Historical Trends Detection (MEDIUM)

**Problem**: `execution_velocity_metrics`, `workload_heatmap_metrics` snapshots exist but no trend comparison or improvement/decline detection is surfaced in UI.

**Fix**:
- Create `useWorkloadTrends` hook that compares current week vs previous week for key metrics (utilization, burnout count, velocity)
- Create `TrendIndicator` component (up/down arrow with % change)
- Add trend indicators to `ExecutiveKPIRow` cards
- Add a simple "Weekly Trend" mini-chart to the Workload Dashboard

**Files**: New `src/features/workload/hooks/useWorkloadTrends.ts`, new `src/components/workload/TrendIndicator.tsx`, edit `ExecutiveKPIRow.tsx`

---

### Gap 8: TAMMAL Index Dynamic Weights (LOW)

**Problem**: Weights are hardcoded at 25% each in the edge function. Not configurable per tenant or role.

**Fix**:
- Add `tammal_weights` JSONB column to `tenants` table (default `{alignment:25, velocity:25, capacity:25, burnout:25}`)
- Update `workload-analytics` edge function to read tenant weights instead of hardcoded values
- Add a settings UI in the Executive Dashboard for admins to adjust weights (with validation that sum = 100)

**Files**: DB migration (add column), edit `supabase/functions/workload-analytics/index.ts`, new `src/features/workload/components/executive/TammalWeightsSettings.tsx`

---

### Implementation Order

1. Gap 1 (SLA Visibility) + Gap 2 (Approval Feedback) — immediate user impact
2. Gap 3 (Redistribution Execute) + Gap 4 (Unlock Override) — governance completeness
3. Gap 5 (Narrative) + Gap 6 (Mood Integration) — AI enhancement
4. Gap 7 (Trends) + Gap 8 (Dynamic Weights) — analytics depth

Total: ~15 new/edited files, 1 DB migration, 1 edge function edit

