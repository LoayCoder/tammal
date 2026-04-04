

## Bilingual Task Title & Description — Mandatory Both Languages

### Current State
- `unified_tasks` has `title` (EN) and `title_ar` (AR), but **no `description_ar`** column
- CreateTaskModal has `titleAr` field but it's optional — tasks can be created without it
- TaskDetail shows `title` as primary and `title_ar` as a secondary subtitle — no language-aware switching
- Description has no Arabic variant at all

### Plan

**1. Database Migration — Add `description_ar` column**
- Add `description_ar TEXT NULL` to `unified_tasks`
- Keep nullable in DB (existing tasks won't have it), enforce at app level for new tasks

**2. CreateTaskModal — Make both languages mandatory**
- Add `descriptionAr` state field
- Add Arabic description input (`TaskPrimaryForm`)
- Add validation: block submit unless `title`, `titleAr`, `description`, and `descriptionAr` all have content
- Show inline error messages when either language is missing
- Pass `description_ar` to `createTaskAsync`

**3. Update `useEnterpriseTasks` hook**
- Add `description_ar` to `CreateEnterpriseTaskInput` interface
- Include `description_ar` in the insert mutation

**4. TaskDetail — Language-aware display**
- Use `i18n.language` to determine active language
- Title: show `title_ar` when Arabic, `title` when English (show the other as subtitle)
- Description: show `description_ar` when Arabic, `description` when English
- Inline edit must save both `description` and `description_ar`

**5. Workload TaskDialog — Same bilingual enforcement**
- Add `title_ar` and `description_ar` fields to the form schema
- Make both required for create flow
- Display based on current language

### Files to Change
| File | Change |
|------|--------|
| **Migration (new)** | `ALTER TABLE unified_tasks ADD COLUMN description_ar TEXT` |
| `src/features/tasks/components/CreateTaskModal.tsx` | Add `descriptionAr` state, validation for both langs |
| `src/features/tasks/components/create-modal/TaskPrimaryForm.tsx` | Add Arabic description textarea |
| `src/features/tasks/hooks/useEnterpriseTasks.ts` | Add `description_ar` to interface and mutation |
| `src/features/tasks/pages/TaskDetail.tsx` | Language-switch title/description display, bilingual inline edit |
| `src/components/workload/employee/TaskDialog.tsx` | Add `title_ar`, `description_ar` fields with validation |
| `src/components/workload/employee/task-dialog/TaskDialogForm.tsx` | Add Arabic input fields |

