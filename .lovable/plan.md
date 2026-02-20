
# Save Wellness Questions to Existing Batches

## Problem

Currently, the wellness "Save Draft" flow always creates a **new** `question_generation_batches` record. The user wants it to behave like the Survey save flow: show a dialog where they can choose to append to an existing non-full batch (capacity < 64) or create a new one.

## Solution

Merge the wellness save preview into the existing `BatchSaveDialog` pattern -- add batch selection (new vs. existing) to the `WellnessSavePreviewDialog`, and update the `saveWellnessMutation` to accept an optional `targetBatchId`.

---

## Changes

### 1. Update `useQuestionBatches.ts` -- expose wellness available batches

Add a new computed list `availableWellnessBatches` that filters batches where `purpose === 'wellness'` and `question_count < MAX_BATCH_SIZE` and `status === 'draft'`.

### 2. Update `WellnessSavePreviewDialog.tsx` -- add batch selection UI

Add a section below the question preview table with:
- Radio group: "Create new batch" vs. "Add to existing batch"
- When "existing" is selected, show list of non-full wellness batches with name, count, and remaining capacity
- Pass the selected `targetBatchId` to `onConfirm`

### 3. Update `useEnhancedAIGeneration.ts` -- `saveWellnessMutation` supports `targetBatchId`

Modify the mutation to accept an optional `targetBatchId`:
- If provided: append questions to existing batch's `wellness_questions`, update `question_count`
- If not provided: create new batch (current behavior)
- Handle overflow: if questions exceed remaining capacity, fill existing batch then create new one

### 4. Update `AIQuestionGenerator.tsx` -- wire up available batches and targetBatchId

Pass `availableWellnessBatches` and `MAX_BATCH_SIZE` to the `WellnessSavePreviewDialog`, and forward the `targetBatchId` from the dialog confirm handler to `saveWellness`.

---

## Technical Details

### `useQuestionBatches.ts` (line ~399)

Add alongside `availableBatches`:
```text
availableWellnessBatches = batches.filter(
  b => b.purpose === 'wellness' && b.question_count < MAX_BATCH_SIZE && b.status === 'draft'
)
```

### `WellnessSavePreviewDialog.tsx`

New props:
- `availableBatches: QuestionBatch[]`
- `maxBatchSize: number`
- `onConfirm: (targetBatchId?: string) => void` (changed from `() => void`)

UI addition between the question table and footer:
- RadioGroup with "New batch" / "Add to existing"
- Batch list (when "existing" selected) showing name, question count, remaining capacity

### `saveWellnessMutation` in `useEnhancedAIGeneration.ts`

Updated params type: `{ questions, targetBatchId? }`

Logic:
```text
if targetBatchId:
  1. Fetch current batch question_count
  2. Calculate capacity = 64 - current_count
  3. Take min(capacity, questions.length) for this batch
  4. Insert into wellness_questions with existing batch_id
  5. Update batch question_count
  6. If overflow: create new batch with remaining questions
else:
  Current behavior (create new batch)
```

### Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useQuestionBatches.ts` | Add `availableWellnessBatches` |
| `src/components/ai-generator/WellnessSavePreviewDialog.tsx` | Add batch selection UI |
| `src/hooks/useEnhancedAIGeneration.ts` | Support `targetBatchId` in wellness save |
| `src/pages/admin/AIQuestionGenerator.tsx` | Pass batches to dialog, forward targetBatchId |
| `src/locales/en.json` | Add i18n keys for wellness batch selection |
| `src/locales/ar.json` | Arabic translations |
