

## Plan: Targeted Employee Assignment, Admin Representative Management, Completion Matrix & Bulk Import

### Summary
Three enhancements to the Representative system:
1. **Redesign DistributeTaskDialog** — cascading Division → Department → Section → **Employee picker** (targeted, not broadcast)
2. **Admin Representative Management** — new tab in Unified User Management for tenant admins to assign/remove representative scopes
3. **Completion Matrix** — expandable batch cards showing per-employee status in a grid view
4. **CSV Bulk Import** — download template + upload CSV to create multiple targeted tasks at once

---

### 1. Redesign `DistributeTaskDialog` — Targeted Assignment

**Current**: Selects a scope assignment → broadcasts to ALL employees in that scope.
**New**: Cascading selectors to pick a **specific employee** within the representative's scope.

Flow:
```text
Division (from assignments) → Department → Section (optional) → Employee (single select)
```

- Remove the old scope-assignment-based selector
- Add cascading `Select` components: division → departments (filtered by `division_id`) → sections (filtered by `department_id`) → employees (filtered by department/section + `status = active`)
- Fetch employees via a new query in the hook filtered by department_id/section_id
- Submit sends `employee_id` instead of `scope_type/scope_id`

**Edge function update**: Accept `employee_id` (single) or `tasks[]` (bulk). Validate the target employee belongs to a scope the representative is assigned to. Insert one locked task per call (or per array item for bulk).

### 2. Admin Representative Management — New Tab in User Management

Add a **5th tab** "Representatives" to `UnifiedUserManagement.tsx`:

| Column | Description |
|---|---|
| Employee Name | From employees table |
| Scope Type | Division / Department / Section |
| Scope Name | Resolved from org tables |
| Actions | Remove (soft delete) |

- "Add Representative" button opens a dialog with: Employee selector + scope cascading selector (Division → Department → Section)
- Uses a new `useRepresentativeAdmin` hook that queries `representative_assignments` filtered by tenant
- Insert/soft-delete mutations
- Only visible to `tenant_admin` / `super_admin`

### 3. Completion Matrix on Representative Dashboard

When a representative clicks a batch card, expand or navigate to a **detail view** showing:

```text
┌────────────────────────────────────────────┐
│ Task: "Complete Safety Training"           │
│ Due: 2026-03-15  │  12/20 Done (60%)       │
├──────────────────┬──────────┬──────────────┤
│ Employee         │ Status   │ Updated      │
├──────────────────┼──────────┼──────────────┤
│ Ahmed Ali        │ ✅ Done  │ Mar 2        │
│ Sara Hassan      │ 🔄 In Progress │ Mar 1  │
│ Omar Khalid      │ ⏳ Todo  │ —            │
│ ...              │          │              │
└──────────────────┴──────────┴──────────────┘
```

- New component `BatchDetailDialog.tsx` — a dialog/sheet that takes a `batchId`, queries `unified_tasks` where `source_id = batchId`, joins employee names
- Shows a table with employee name, status badge, last updated timestamp
- Summary row at top with counts per status

### 4. CSV Bulk Import

**Template download** (client-side):
- Generates a CSV with columns: `employee_email`, `title`, `title_ar`, `description`, `due_date`, `priority`, `estimated_minutes`
- 2 sample rows pre-filled

**Import flow**:
- File input for `.csv`
- Client-side parsing via `FileReader` + string split
- Resolve `employee_email` → `employee_id` from employees table
- Validate each employee is within representative's scope
- Preview table with per-row validation status (green/red)
- Submit calls the bulk endpoint on the edge function

### File Summary

| File | Action |
|---|---|
| `src/components/workload/representative/DistributeTaskDialog.tsx` | Redesign with cascading org → employee picker |
| `supabase/functions/distribute-representative-task/index.ts` | Accept `employee_id` or `tasks[]` for bulk; validate scope membership |
| `src/hooks/workload/useRepresentativeTasks.ts` | Update payload, add employee query, add bulk mutation |
| `src/pages/admin/RepresentativeWorkload.tsx` | Add template download + import buttons, batch click → detail view |
| `src/components/workload/representative/BatchDetailDialog.tsx` | **New** — per-employee completion matrix |
| `src/components/workload/representative/BulkImportDialog.tsx` | **New** — CSV upload, parse, preview, submit |
| `src/components/workload/representative/csvTemplate.ts` | **New** — template generation + CSV parser |
| `src/pages/admin/UnifiedUserManagement.tsx` | Add 5th "Representatives" tab |
| `src/hooks/org/useRepresentativeAdmin.ts` | **New** — CRUD for representative assignments (admin) |
| `src/components/users/RepresentativeTab.tsx` | **New** — table + add/remove dialog for representative assignments |
| `src/locales/en.json`, `src/locales/ar.json` | Add i18n keys for all new UI |

