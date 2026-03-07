

# Add Edit, Delete & Impact Alert to Award Cycles

## What We Are Building

On the `/admin/recognition` page, each award cycle card will get **Edit** and **Delete** action buttons. When a cycle is already in an active phase (nominating, voting, calculating, announced), clicking edit or delete will show an **impact alert dialog** warning the admin about consequences before proceeding.

## Technical Plan

### 1. Add translations (en.json + ar.json)
Add new keys under `recognition.cycles`:
- `edit`, `delete`, `editCycle`
- `confirmDelete`, `confirmDeleteDescription`
- `impactAlert.title`, `impactAlert.editDescription`, `impactAlert.deleteDescription`
- `impactAlert.nominatingWarning`, `impactAlert.votingWarning`, `impactAlert.calculatingWarning`, `impactAlert.announcedWarning`
- `impactAlert.proceed`, `impactAlert.cancel`

### 2. Update RecognitionManagement.tsx
- Import `DropdownMenu` (from shadcn), `MoreVertical`, `Pencil`, `Trash2` icons
- Import `ConfirmDialog` and `useConfirmDelete` from `@/shared/dialogs`
- Import `Alert` components for impact warnings
- Add state: `editingCycle` for the cycle being edited, plus `useConfirmDelete` for delete flow
- Add a `DropdownMenu` to each cycle card header (kebab menu with Edit / Delete options)
- Determine if cycle is "in-process" (`status !== 'configuring'`)
- **Delete flow**: If in-process, show a `ConfirmDialog` with impact warning text describing what will be affected (nominations, votes, etc). If configuring, show a simple confirm. On confirm, call `deleteCycle.mutate(id)` (soft-delete)
- **Edit flow**: If in-process, show an `AlertDialog` with impact warning first, then on proceed open the edit state. If configuring, go directly to edit
- When `editingCycle` is set, render an inline edit form or reuse `CycleBuilder` in edit mode

### 3. Create CycleEditDialog component
- New file: `src/components/recognition/CycleEditDialog.tsx`
- A dialog/sheet that allows editing cycle name, dates, and audit days
- Pre-populated with existing cycle data
- On save, calls `updateCycle.mutate()`
- If cycle is in-process, shows an `Alert` banner at the top warning about impact (e.g., "This cycle has active nominations. Changing dates may affect participants.")

### 4. Impact logic helper
- Define `getImpactWarning(status, action)` — returns the appropriate warning message based on the cycle's current status:
  - `nominating` → "Active nominations exist. Editing/deleting will affect nominees and endorsements."
  - `voting` → "Voting is in progress. Changes will impact active ballots."
  - `calculating` → "Results are being calculated. Modifications may corrupt results."
  - `announced` → "Results have been published. Changes will affect announced winners."

### Files to Create/Edit

| Action | File |
|--------|------|
| Create | `src/components/recognition/CycleEditDialog.tsx` |
| Edit | `src/pages/admin/RecognitionManagement.tsx` |
| Edit | `src/locales/en.json` |
| Edit | `src/locales/ar.json` |

