

# Inline Editing for Existing Criteria

## Overview
Add click-to-edit capability on each criterion card so users can modify name, description, and weight in place, with Save/Cancel controls.

## Changes

### `src/components/recognition/CriteriaEditor.tsx`

1. **Track editing state** — add `editingId: string | null` and local edit fields (`editName`, `editDescription`, `editWeight`).

2. **Click-to-edit trigger** — add a `Pencil` icon button next to the delete button. Clicking it sets `editingId` and populates local state from the criterion.

3. **Inline edit form** — when `editingId === criterion.id`, render Input/Textarea/Slider instead of static text (same layout as the "add" form but pre-filled). The weight slider's max is capped to `remainingWeight + currentCriterionWeight` (the criterion's own weight is "freed up" when editing).

4. **Save/Cancel buttons** — Save calls `updateCriterion.mutate({ id, name, description, weight })` then clears `editingId`. Cancel just clears editing state.

5. **Validation** — Save disabled if name is empty or total weight (excluding the old weight, adding the new) exceeds 100%.

### `src/locales/en.json` & `src/locales/ar.json`
- Add `recognition.criteria.edit` key ("Edit" / "تعديل") if not present, plus `recognition.criteria.editSuccess` / `recognition.criteria.editError` if needed (already have `updateSuccess`/`updateError`).

### No database or hook changes needed
`updateCriterion` mutation already exists in `useJudgingCriteria` and supports partial updates.

