

## E2E Audit: Remaining Incomplete Workflows

After thorough codebase analysis, I identified **4 issues** — 2 critical (will cause DB errors), 2 medium.

---

### Issue 1: `'verified'` status rejected by DB trigger (CRITICAL)

**Root cause**: `TaskDialog.tsx` line 158 calls `onUpdate({ status: 'verified' })`, and `MyTasks.tsx` lists `'verified'` as a filter option. But `validate_unified_task_status` only allows 8 statuses — `'verified'` is **not** one of them. Any attempt to mark a task as verified will throw a database error.

**Also affected**: `UnifiedTaskList.tsx` (line 45, 65, 82, 125, 141), `PersonalCommandCenter.tsx` (lines 37-38) — these display `verified` but won't cause errors since they only read.

**Fix**: Remove the "Mark Verified" button from `TaskDialog.tsx`. Replace it with metadata-based verification (set a `metadata.verified = true` field on completed tasks instead of a separate status). Update `MyTasks.tsx` to remove `'verified'` from the STATUSES filter. Update display components to check `metadata.verified` instead of `status === 'verified'`.

---

### Issue 2: `'blocked'` status rejected by DB trigger (CRITICAL)

**Root cause**: `TaskDialog.tsx` line 247 has a "Blocked" checkbox toggle that sets `status = 'blocked'`. This status is **not** in the `validate_unified_task_status` trigger's allowed list. Toggling it will cause a database error.

**Also affected**: `TeamTaskFilters.tsx` line 44 — filter option for `'blocked'` will never match any tasks since they can't have that status.

**Fix**: Remove the blocked checkbox from `TaskDialog.tsx`. Replace with a `metadata.is_blocked = true` approach, or add `'blocked'` to the DB trigger's valid status list (requires migration). The simpler approach: use metadata and display a blocked badge visually.

---

### Issue 3: TeamTaskFilters uses deprecated `'todo'` and `'done'` (MEDIUM)

**File**: `src/components/workload/team/TeamTaskFilters.tsx` lines 42-44

The status filter dropdown offers `todo`, `done`, and `blocked` — none of which exist in the current lifecycle. Filtering by these will always return 0 results.

**Fix**: Replace filter options with valid statuses: `draft`, `open`, `in_progress`, `under_review`, `pending_approval`, `completed`, `rejected`, `archived`.

---

### Issue 4: TaskDialog status display logic broken (MEDIUM)

**File**: `src/components/workload/employee/TaskDialog.tsx` line 214

The translation key resolver chain has a dead branch: it checks for `'verified'` (maps to `completed` label) and falls through to `'blocked'` as default — neither are valid. When status is `'open'`, `'draft'`, `'under_review'`, or `'pending_approval'`, the ternary chain falls to `'blocked'` label.

**Fix**: Replace the nested ternary with a proper status-to-label map covering all 8 valid statuses.

---

### Implementation Plan

**Files to modify**:

1. **`src/components/workload/employee/TaskDialog.tsx`**:
   - Remove "Mark Verified" button and `handleMarkVerified` function
   - Remove "Blocked" checkbox toggle
   - Fix status display ternary to use a proper map for all 8 valid statuses
   - Clean up `computeStatus` to remove `verified`/`blocked` branches

2. **`src/components/workload/team/TeamTaskFilters.tsx`**:
   - Replace `todo`/`done`/`blocked` filter options with valid lifecycle statuses

3. **`src/features/tasks/pages/MyTasks.tsx`**:
   - Remove `'verified'` from STATUSES array

4. **`src/components/workload/employee/UnifiedTaskList.tsx`**:
   - Remove `verified` and `blocked` from status config map
   - Update `isCompleted` checks to only use `'completed'`

5. **`src/pages/employee/PersonalCommandCenter.tsx`**:
   - Remove `'verified'` from status filters

