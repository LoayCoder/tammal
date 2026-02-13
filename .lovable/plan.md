

# Link Schedules to Question Batches (Max 3) with Avoid Weekends Selection

## Overview

Add the ability to link up to 3 Question Batches when creating/editing a Schedule. The schedule engine will then pull questions from the linked batches instead of querying the general questions pool. The "Avoid Weekends" toggle already exists in the form and is functional.

---

## Step 1: Database Migration

Add a `batch_ids` JSONB column to `question_schedules`:

```text
ALTER TABLE question_schedules ADD COLUMN batch_ids jsonb DEFAULT '[]'::jsonb;
```

This stores an array of up to 3 `question_sets` IDs (e.g., `["uuid1", "uuid2"]`).

---

## Step 2: Update Hook -- `useQuestionSchedules.ts`

- Add `batch_ids: string[]` to the `QuestionSchedule` interface
- Add `batch_ids?: string[]` to the `CreateScheduleInput` interface
- Include `batch_ids` in create/update mutation data mapping

---

## Step 3: Update Schedule Dialog UI -- `ScheduleManagement.tsx`

### New State
- `selectedBatchIds: string[]` (max length 3)

### New UI Section (in the create/edit dialog, after description)
- A "Question Batches" label with a multi-select using Popover + Checkbox pattern (same as the category multi-select)
- Shows available batches from `useQuestionBatches` (non-deleted, tenant-scoped)
- Each checkbox shows: batch name, question count badge
- Enforce max 3 selection -- disable unchecked items when 3 are already selected
- Display selected count: "2/3 selected"

### Form Integration
- Pass `batch_ids: selectedBatchIds` in `handleSubmit` for both create and update
- Populate `selectedBatchIds` from schedule data in `openEditDialog`
- Reset `selectedBatchIds` in `resetForm`

### Table Column
- Add a "Batches" column to the schedule table showing count (e.g., "2 batches") or batch names as badges

---

## Step 4: Update Schedule Engine -- `schedule-engine/index.ts`

Update the question-fetching logic:
- If `schedule.batch_ids` contains IDs, fetch questions from `generated_questions` WHERE `question_set_id` IN those batch IDs (instead of the general `questions` table)
- If `batch_ids` is empty, fall back to the existing general questions pool logic

---

## Step 5: Localization

| Key | English | Arabic |
|-----|---------|--------|
| schedules.questionBatches | Question Batches | دفعات الأسئلة |
| schedules.selectBatches | Select batches (max 3) | اختر الدفعات (حد أقصى 3) |
| schedules.batchesSelected | {{count}}/3 batches | {{count}}/3 دفعات |
| schedules.maxBatchesReached | Maximum 3 batches allowed | الحد الأقصى 3 دفعات |
| schedules.noBatchesAvailable | No batches available | لا توجد دفعات متاحة |

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| Migration | SQL | Add `batch_ids` column to `question_schedules` |
| Edit | `src/hooks/useQuestionSchedules.ts` | Add `batch_ids` to interfaces and mutations |
| Edit | `src/pages/admin/ScheduleManagement.tsx` | Add batch multi-select to dialog, show in table |
| Edit | `supabase/functions/schedule-engine/index.ts` | Pull questions from linked batches |
| Edit | `src/locales/en.json` | Add batch-related schedule keys |
| Edit | `src/locales/ar.json` | Add batch-related schedule keys |

