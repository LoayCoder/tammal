

# Enhanced Task Management: Progress Tracking, Evidence & Verification

## Problem
Currently, tasks can be toggled "done" with a simple checkbox click. There's no progress tracking, no evidence requirement, no closure comment, and insufficient detail shown (missing source name, start/due dates). The user wants a proper task lifecycle:

- Tasks show: source type, user name, start date, due date
- Users can manually set % progress (0-100)
- At 100% → status becomes **completed** (not verified yet)
- Evidence must be uploaded to mark as **verified**
- Closure requires a comment
- No simple checkbox close

## Database Changes

**Migration: Add `progress` column to `unified_tasks`**
```sql
ALTER TABLE unified_tasks ADD COLUMN progress integer NOT NULL DEFAULT 0;
```

The `unified_tasks` table already has `status` (we'll add 'verified' as a valid status). No other schema changes needed since `task_evidence` table already exists and links via `action_id`.

## Implementation Plan

### 1. Database Migration
- Add `progress` (integer, default 0) column to `unified_tasks`

### 2. Update `UnifiedTaskList.tsx` — Show more detail per task
- Display start date (`scheduled_start`) and due date (`due_date`)
- Show source type badge (already exists) + created_by name
- Add a small progress bar under each task
- **Remove the checkbox** toggle that instantly marks done
- Add a progress % indicator that's clickable/editable inline

### 3. Redesign `TaskDialog.tsx` — Full task detail view
- Add a **progress slider** (0-100%) field
- When progress = 100, auto-set status to `completed`
- Add **closure comment** — require a comment when setting to completed
- Show evidence section: list existing evidence, upload button
- When evidence is uploaded and approved → status can become `verified`
- Show task metadata: source type, created by, start date, due date
- Remove ability to set status to `done` directly without going through the progress flow

### 4. Update `useUnifiedTasks.ts` hook
- Add `progress` field to `UnifiedTask` interface and mutations
- Update the update mutation to handle progress-based status changes

### 5. Update `PersonalCommandCenter.tsx`
- Remove the `handleToggle` checkbox-based completion
- Replace toggle with opening the task detail dialog
- Update stats to use `completed` and `verified` statuses instead of `done`

### 6. Status Flow
```text
todo → in_progress → completed (at 100%) → verified (with evidence)
                   ↘ blocked
```
- Progress slider drives status: >0% auto-sets `in_progress`, 100% auto-sets `completed`
- `verified` only available when evidence exists
- Closing/completing requires a comment

### Files to modify
- **Migration**: Add `progress` column to `unified_tasks`
- `src/hooks/workload/useUnifiedTasks.ts` — Add progress field
- `src/components/workload/employee/UnifiedTaskList.tsx` — Show dates, progress bar, remove checkbox toggle
- `src/components/workload/employee/TaskDialog.tsx` — Add progress slider, evidence section, closure comment requirement
- `src/pages/employee/PersonalCommandCenter.tsx` — Update status logic, remove toggle
- `src/locales/en.json` / `src/locales/ar.json` — New i18n keys

