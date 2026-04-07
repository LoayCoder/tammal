

# Enforce Evidence Verification Before Task Closure

## Problem
Currently, tasks can be moved to `completed` status without any evidence uploaded or verified. The requirement is that **before a task can be closed (completed), the assignee must upload evidence, and the Representative must verify (approve) it**.

## Solution

### 1. Database: Block completion without approved evidence (trigger)
**Migration:** Create a new trigger `enforce_evidence_before_completion` on `unified_tasks` that fires BEFORE UPDATE. When status transitions to `completed`, it checks `task_evidence` for at least one row with `status = 'approved'` for that task. If none found, it raises an exception.

```sql
CREATE FUNCTION enforce_evidence_before_completion() ...
-- Check: SELECT EXISTS (SELECT 1 FROM task_evidence WHERE action_id = NEW.id AND status = 'approved' AND deleted_at IS NULL)
-- If not exists → RAISE EXCEPTION 'Cannot complete task without approved evidence.'
```

### 2. Frontend: Block status change to "completed" in UI

**File: `src/features/tasks/pages/TaskDetail.tsx`**
- Fetch evidence for the current task using `useTaskEvidence(id)`
- When user selects `completed` status, check if there is at least one approved evidence item
- If not, show a toast error explaining evidence must be uploaded and approved first, and prevent the update

**File: `src/features/tasks/hooks/useApprovalQueue.ts`**
- Before allowing `handleApprove` (which sets status to `completed`), check evidence status
- If no approved evidence, show error toast and block the mutation

**File: `src/features/tasks/constants/taskLifecycle.ts`**
- No changes needed — the transition rules stay the same; evidence gating is orthogonal

### 3. Evidence verification UI for Representatives

**File: `src/features/tasks/pages/TaskDetail.tsx`**
- Add an Evidence tab (alongside comments, activity, attachments) showing uploaded evidence with approve/reject buttons
- Representatives and reviewers/approvers can verify evidence from the task detail page
- Use existing `useTaskEvidence` hook which already has `verifyEvidence` mutation

### 4. Visual indicator on task cards
- Show a warning badge on approval queue items (`WorkloadApprovalsView.tsx`) when a task has no approved evidence, indicating the approver should request evidence before approving

## Files to Change
1. **New migration** — `enforce_evidence_before_completion` trigger
2. `src/features/tasks/pages/TaskDetail.tsx` — Add evidence tab + block completion without evidence
3. `src/features/workload/components/WorkloadApprovalsView.tsx` — Evidence status indicator
4. `src/features/tasks/hooks/useApprovalQueue.ts` — Pre-check evidence before approving

## Flow After Fix
1. Assignee uploads evidence on their task → status `pending`
2. Representative/reviewer opens task detail → sees Evidence tab → approves/rejects evidence
3. Once evidence is `approved`, task can transition to `completed`
4. If no approved evidence exists, completion is blocked at both UI and database level

