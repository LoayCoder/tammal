# Enterprise Task Management — Architecture Refactoring Plan

## Overview
Consolidate 33+ scattered task files into a self-contained `src/features/tasks/` module, extract inline Supabase calls into hooks, and fix type co-location violations.

---

## Phase 1: Create `src/features/tasks/` Module Structure

### 1.1 — Scaffold feature directory
```
src/features/tasks/
  components/        ← move from src/components/tasks/
  hooks/             ← move from src/hooks/tasks/
  pages/             ← move from src/pages/tasks/
  types/             ← new, task-specific types
  index.ts           ← barrel exports
```

### 1.2 — Move components (12 files)
- CreateTaskModal, NotificationBell, TaskAIPanel, TaskActivityTimeline
- TaskAttachments, TaskChecklist, TaskCommentsPanel, TaskDependenciesPanel
- TaskMembersPicker, TaskTagPicker, TaskTemplatePicker, TaskTimeTrackingPanel

### 1.3 — Move hooks (12 files)
- useEnterpriseTasks, useTaskAI, useTaskActivity, useTaskAttachments
- useTaskChecklists, useTaskComments, useTaskDependencies, useTaskMembers
- useTaskNotifications, useTaskTags, useTaskTemplates, useTaskTimeTracking

### 1.4 — Move pages (9 files)
- ApprovalQueue, ManagerTaskOverview, MyTasks, OverdueTasks, RecurringTasks
- TaskCalendar, TaskDetail, TaskPerformanceAnalytics, TaskTemplates

### 1.5 — Update all import paths (App.tsx, AppSidebar, cross-references)

---

## Phase 2: Extract Inline Supabase Calls into Hooks

- TaskDetail.tsx → useTaskDetail(id) + useTaskUpdate(id)
- ApprovalQueue.tsx → useApprovalQueue()
- OverdueTasks.tsx → useOverdueTasks()
- ManagerTaskOverview.tsx → useManagerTaskOverview()
- RecurringTasks.tsx → useRecurringTasks()
- TaskPerformanceAnalytics.tsx → useTaskPerformanceAnalytics()
- TaskDependenciesPanel.tsx → extend useTaskDependencies hook

---

## Phase 3: Fix Type Co-location Violations

- AccountStatusBadge types → src/types/employee.ts
- TenantSecurityControl types → src/types/tenant.ts
- HSLColorPicker types → src/types/branding.ts
- Update hook imports to new type locations

---

## Phase 4: Create Approvals Feature Module

- Scaffold src/features/approvals/ (components, hooks, pages, types, index.ts)
- Move approval-related code from tasks module

---

## Execution Order
1. Phase 3 (type fixes — smallest, unblocks others)
2. Phase 1 (file moves — bulk restructure)
3. Phase 2 (extract hooks — code quality)
4. Phase 4 (approvals module — new feature boundary)

## Rules
- No business logic changes — structure only
- All imports use @/ alias
- Barrel index.ts for each feature module
- Verify build passes after each phase
