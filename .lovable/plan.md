

# Organization Structure Redesign: Division - Department - Section

## Overview

The current hierarchy **Branch - Department (with sub-departments) - Site** will be restructured to **Division - Department - Section**. This is a systematic rename plus the removal of the parent-department (tree) concept, making all three levels flat under each other.

## Current vs New Structure

```text
CURRENT                          NEW
-------                          ---
Branch (top)                     Division (top)
  Department (with parent_id)      Department (flat, no parent)
    Site (bottom)                    Section (bottom)
```

## What Changes

### 1. Database Migration (Non-Destructive)
- **No table renames or drops** -- existing `branches`, `departments`, and `sites` tables stay intact
- Remove the `parent_id` column usage from departments (set to NULL for existing records, the column stays for safety)
- Update the `get_user_department_id` RLS helper function description comment (no functional change needed)

### 2. Translation Files (en.json and ar.json)
- Rename all `branches.*` keys to use "Division" / "قسم رئيسي" terminology
- Keep `organization.departments` as "Departments" / "الأقسام"
- Rename all `sites.*` keys to use "Section" / "القسم الفرعي" terminology
- Add new keys like `divisions.title`, `divisions.addDivision`, `sections.title`, `sections.addSection`, etc.

### 3. OrgStructure Page (`OrgStructure.tsx`)
- Rename tabs: Divisions | Departments | Sections
- Update icons: use `Network` for Divisions, `Building2` for Departments, `Layers` for Sections
- Remove the "Add Child Department" functionality (no more tree)
- Replace `DepartmentTree` with a flat `DepartmentTable` component
- Pass division (branch) data to Department and Section management

### 4. Department Components
- **Remove** `DepartmentTree.tsx` (no more recursive tree view)
- **Create** `DepartmentTable.tsx` -- flat table showing departments with their parent Division
- **Update** `DepartmentSheet.tsx` -- remove `parent_id` selector, rename "Branch" to "Division", keep head employee, color, etc.

### 5. Site/Section Components
- **Update** `SiteTable.tsx` -- rename column headers from "Site" to "Section", "Branch" to "Division"
- **Update** `SiteSheet.tsx` -- rename labels from "Site" to "Section", "Branch" to "Division"

### 6. Employee Sheet (`EmployeeSheet.tsx`)
- Rename "Branch" dropdown label to "Division"
- Keep the linked filtering logic: selecting a Division filters Departments
- Add a third "Section" dropdown filtered by selected Department

### 7. Schedule Preview Analytics (`SchedulePreviewDialog.tsx`)
- Rename "Branch -- Status Distribution" to "Division -- Status Distribution"
- Keep Department chart as-is
- Update filter labels from "Branch" to "Division"

### 8. Sidebar Navigation (`AppSidebar.tsx`)
- Update the Organization Structure menu item label if needed

### 9. Branch-related files (rename labels only)
- `BranchTable.tsx` -- rename column headers to Division terminology
- `BranchSheet.tsx` -- rename form labels to Division terminology
- `useBranches.ts` -- update toast messages to use division translation keys

## Technical Details

### Files to Modify
| File | Change |
|------|--------|
| `src/locales/en.json` | Add divisions/sections keys, update branch/site labels |
| `src/locales/ar.json` | Same as above in Arabic |
| `src/pages/admin/OrgStructure.tsx` | Rename tabs, remove tree, use flat table for departments |
| `src/components/org/DepartmentSheet.tsx` | Remove parent_id field, rename Branch to Division |
| `src/components/org/DepartmentTree.tsx` | Replace with flat DepartmentTable.tsx |
| `src/components/org/BranchTable.tsx` | Rename headers to Division |
| `src/components/org/BranchSheet.tsx` | Rename labels to Division |
| `src/components/org/SiteTable.tsx` | Rename headers to Section, Branch to Division |
| `src/components/org/SiteSheet.tsx` | Rename labels to Section/Division |
| `src/components/employees/EmployeeSheet.tsx` | Rename Branch to Division, add Section dropdown |
| `src/components/employees/EmployeeTable.tsx` | Update department column if needed |
| `src/components/schedules/SchedulePreviewDialog.tsx` | Rename Branch filters/charts to Division |
| `src/hooks/useBranches.ts` | Update toast translation keys |
| `src/hooks/useSites.ts` | Update toast translation keys |

### New File
| File | Purpose |
|------|---------|
| `src/components/org/DepartmentTable.tsx` | Flat table view replacing recursive tree |

### Database
- No schema migration needed -- reusing existing tables with new UI labels
- `branches` table = Divisions
- `departments` table = Departments (parent_id ignored in UI)
- `sites` table = Sections

### RLS Policies
- No changes needed -- existing policies on branches, departments, and sites remain valid since the underlying tables are unchanged

## Sequencing
1. Update translation files first (both languages)
2. Create DepartmentTable component
3. Update OrgStructure page
4. Update all Sheet/Table components with new labels
5. Update EmployeeSheet with Section dropdown
6. Update SchedulePreviewDialog analytics labels

