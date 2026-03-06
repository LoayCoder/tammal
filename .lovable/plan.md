

# Enterprise Task Management System — Implementation Plan

## Current State Assessment

### What Already Exists
- **`unified_tasks`** — General task table with title, description, status, priority, progress, comments (JSONB), tags, lock, timestamps
- **`objective_actions`** — Strategic actions with assignee, accountable, SLA, evidence, lock, comments (JSONB)
- **`task_queue_items`** — Lightweight queue synced from actions via trigger
- **`task_dependencies`** — Task-to-task dependency links
- **`task_evidence`** — File attachments for actions (file_url, file_type, status, verification)
- **`approvals`** — Generic approval system (entity_type, entity_id, requested_by, approved_by, status)
- **`audit_logs`** — Full audit trail with IP, changes JSONB
- **Storage buckets** — `support-attachments` exists but no dedicated `task-attachments` bucket

### What Needs to Be Built (New Tables)
1. **`task_members`** — Assignee, Reviewer, Approver, Observer role assignments
2. **`task_checklists`** — Sub-tasks with checkbox, assignee, due date
3. **`task_comments`** — Dedicated comments table (replacing JSONB pattern)
4. **`task_attachments`** — File attachments for tasks
5. **`task_tags`** — Tag definitions (name, color, tenant-scoped)
6. **`task_tag_links`** — Many-to-many task-tag relationships
7. **`task_activity_logs`** — Task-specific activity feed

### What Needs to Be Built (UI)
- Enterprise Create/Edit Task Modal (three-zone layout)
- Task detail view
- Task dashboards (My Tasks, Department Tasks, Approval Queue, Overdue)

---

## Implementation Phases

Given the massive scope, this will be implemented in **3 phases** across multiple conversations.

### Phase 1: Database Schema + Create Task Modal (This Session)

#### 1A. Database Migration — New Tables

Create 7 new tables with full RLS, tenant isolation, and soft delete:

```text
task_members        (task_id, user_id, role, tenant_id)
task_checklists     (task_id, title, assigned_to, status, due_date, sort_order, tenant_id)
task_comments       (task_id, user_id, comment_text, attachments[], tenant_id)
task_attachments    (task_id, file_url, file_name, file_type, uploaded_by, tenant_id)
task_tags           (name, name_ar, color, tenant_id)  
task_tag_links      (task_id, tag_id, tenant_id)
task_activity_logs  (task_id, action, performed_by, details jsonb, tenant_id)
```

Add columns to `unified_tasks`:
- `department_id`, `section_id`, `initiative_id`, `objective_id` (linking fields)
- `assignee_id`, `reviewer_id`, `approver_id` (quick access)
- `visibility` (private/department/cross_department/organization)
- `archived`, `archived_at`
- `reminder_date`, `recurrence_rule`
- `estimated_minutes`, `actual_minutes` (already exist)

Create storage bucket: `task-attachments`

All tables get:
- `tenant_id` + RLS using `get_user_tenant_id(auth.uid())`
- `deleted_at` for soft delete
- `created_at`, `updated_at` timestamps
- Partial indexes on `deleted_at IS NULL`

#### 1B. Create Task Modal UI

**New file:** `src/components/tasks/CreateTaskModal.tsx`

Three-zone enterprise modal:
- **Left panel**: Title, description (rich textarea), file attachments, comments
- **Right panel**: Status, priority, assignee (EmployeePicker), reviewer, approver, dates (start/due/reminder), department/section selects, initiative/objective linking, tags, visibility, checklist
- **Footer**: Save Draft / Create Task

Supporting components:
- `src/components/tasks/TaskChecklist.tsx` — Inline checklist editor
- `src/components/tasks/TaskTagPicker.tsx` — Tag selector with create
- `src/components/tasks/TaskMembersPicker.tsx` — Multi-role member assignment
- `src/components/tasks/TaskAttachments.tsx` — Drag-drop file upload

#### 1C. Hooks

- `src/hooks/tasks/useTasks.ts` — CRUD on unified_tasks with new fields
- `src/hooks/tasks/useTaskChecklists.ts` — Checklist CRUD
- `src/hooks/tasks/useTaskComments.ts` — Comments CRUD
- `src/hooks/tasks/useTaskTags.ts` — Tag management
- `src/hooks/tasks/useTaskMembers.ts` — Member role management
- `src/hooks/tasks/useTaskAttachments.ts` — File upload/delete
- `src/hooks/tasks/useTaskActivity.ts` — Activity log read

#### 1D. i18n

Add `tasks` block to `en.json` and `ar.json` with all labels for the modal fields, statuses, priorities, roles, visibility options.

### Phase 2: Task Dashboards + Queue (Future Session)
- My Tasks, Department Tasks, Approval Queue, Overdue Tasks pages
- Workload metrics dashboard
- Task detail page with full activity log

### Phase 3: AI Recommendation Engine (Future Session)
- Edge function using Lovable AI for task suggestions
- Assignee recommendation based on workload
- Completion time estimation
- Risk prediction

---

## Technical Details

### Database Design Principles
- All tables use `uuid` primary keys with `gen_random_uuid()` default
- Tenant isolation via `tenant_id NOT NULL` + RLS
- Soft delete via `deleted_at TIMESTAMP NULL`
- Activity logging via trigger on `unified_tasks` for status/assignment changes
- Checklist completion auto-calculates task progress via trigger
- Approval integration uses existing `approvals` table with `entity_type = 'task'`

### Status Lifecycle
```text
draft → open → in_progress → under_review → pending_approval → completed
                    ↑              ↓
                    ← rejected ←───┘
                                            completed → archived
```

Validated via trigger (same pattern as `validate_queue_item_status`).

### Progress Calculation
Auto-calculated from checklist: `(completed_items / total_items) * 100`
Or manually set if no checklist items exist.

### Files to Create/Modify
- **Migration**: 1 SQL migration file (7 new tables + unified_tasks columns + triggers + RLS)
- **New components**: ~6 files in `src/components/tasks/`
- **New hooks**: ~7 files in `src/hooks/tasks/`
- **Locales**: `en.json`, `ar.json` updates
- **Storage**: New `task-attachments` bucket

This plan focuses on Phase 1 delivery. Phases 2 and 3 will be planned in follow-up sessions.

