

# Workload Feature Co-location — Barrel Migration

## What
Move all 26 workload hooks from `src/hooks/workload/` into `src/features/workload/hooks/` and update every import across the codebase to use the feature module path.

## Scope
- **26 hook files** to move
- **24 consumer files** (186 import references) to update
- **1 barrel file** (`src/features/workload/index.ts`) to repoint

## Steps

### 1. Create `src/features/workload/hooks/` and move all 26 files
Each file moves as-is with zero internal changes (their imports reference `@/integrations/supabase/client`, `@/hooks/org/`, `@/hooks/audit/`, `@/services/` — none reference sibling workload hooks by relative path, so no internal rewiring needed).

### 2. Update barrel file `src/features/workload/index.ts`
Change all re-export paths from `@/hooks/workload/useX` to `./hooks/useX`.

### 3. Update 24 consumer files
Replace every `from '@/hooks/workload/...'` with `from '@/features/workload'` (barrel import) where possible, or `from '@/features/workload/hooks/...'` for type-only imports that need specific named types.

Key consumers:
- `src/pages/admin/` (WorkloadDashboard, ObjectiveDetail, StrategicObjectives, etc.)
- `src/pages/employee/` (PersonalCommandCenter, MyTasks, etc.)
- `src/components/workload/` (team, representative, dashboard sub-components)
- `src/features/tasks/` (TaskCalendar, CreateTaskModal)

### 4. Delete `src/hooks/workload/` directory
After all imports are migrated, remove the empty directory.

### Result
```text
src/features/workload/
  index.ts              ← barrel (re-exports from ./hooks/)
  hooks/
    useActions.ts
    useAlignmentMetrics.ts
    useApprovals.ts
    ... (26 files total)
```

All workload logic fully co-located under `src/features/workload/`. No functional changes — purely structural.

