

# Add Edit & Delete for Nominations (Before Approval)

## Summary

Users cannot currently edit or delete their nominations. The delete button exists in `NominationCard` but is never wired up in `MyNominationsPage`. No edit mutation or UI exists at all. Both actions should be allowed only **before** manager approval (when `manager_approval_status` is `pending` or `not_required` and `status` is `draft` or `submitted`).

## Changes

### 1. `useNominations.ts` — Add `updateNomination` mutation

- New mutation that accepts `id` + partial fields (`headline`, `justification`, `specific_examples`, `impact_metrics`)
- Guards: only update if nomination belongs to current user
- Invalidates relevant query keys on success

### 2. `NominationCard.tsx` — Add edit button

- Add `onEdit` optional prop alongside existing `onDelete`
- Show Edit and Delete buttons only when `manager_approval_status` is `not_required` or `pending` AND `status` is `draft` or `submitted`
- Update the condition on line 103 to use this new editable check

### 3. `NominationEditDialog.tsx` — New component

- Dialog with form fields: headline, justification, specific examples, impact metrics
- Pre-populated from the selected nomination
- Calls `updateNomination` on save
- Read-only display of nominee name (cannot change nominee after submission)

### 4. `MyNominationsPage.tsx` — Wire up edit + delete

- Import `useConfirmDelete` for delete confirmation flow
- Pass `onDelete` to `NominationCard` (calls `softDelete` after confirmation)
- Add `NominationEditDialog` with state management
- Pass `onEdit` to `NominationCard` to open edit dialog
- Stop click-to-detail propagation when action buttons are clicked

### 5. Localization — `en.json` + `ar.json`

Add keys:
- `recognition.nominations.editNomination` / `editNominationDesc`
- `recognition.nominations.editSuccess` / `editError`
- `recognition.nominations.confirmDelete` / `confirmDeleteDesc`
- `recognition.nominations.cannotEditApproved`

## Editable condition logic

```typescript
const canModify = (n: Nomination) =>
  ['draft', 'submitted'].includes(n.status) &&
  ['not_required', 'pending'].includes(n.manager_approval_status);
```

Once a manager approves or rejects, or the nomination advances to `endorsed`/`shortlisted`, both edit and delete are locked.

## Files

| File | Action |
|------|--------|
| `src/hooks/recognition/useNominations.ts` | Add `updateNomination` mutation |
| `src/components/recognition/NominationCard.tsx` | Add `onEdit` prop, refine action visibility |
| `src/components/recognition/NominationEditDialog.tsx` | **New** — edit form dialog |
| `src/pages/recognition/MyNominationsPage.tsx` | Wire edit + delete with confirmation |
| `src/locales/en.json` | Add edit/delete i18n keys |
| `src/locales/ar.json` | Add edit/delete i18n keys |

