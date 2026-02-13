

# AI Question Generator Batching and Question Library Overhaul

## Overview

Redesign the save flow so that AI-generated questions are automatically saved into batches (using the existing `question_sets` table) with a max of 64 questions per batch. The Question Library page (`/admin/questions`) gets a completely new layout displaying collapsible batches with metadata, replacing the current flat table view.

---

## Step 1: Database Migration

Add a `name` and `question_count` column to `question_sets` to support batch naming and fast count display:

```text
ALTER TABLE question_sets ADD COLUMN name text;
ALTER TABLE question_sets ADD COLUMN question_count integer NOT NULL DEFAULT 0;
```

No new tables needed. The existing `question_sets` + `generated_questions` (linked via `question_set_id`) already provide the batch-question relationship.

---

## Step 2: Update Save Logic in `useEnhancedAIGeneration.ts`

### Auto-Save on Generate

Currently, questions are only saved when the user clicks "Save". Change the `saveSet` mutation to:

1. Accept an optional `targetBatchId` parameter (for "add to existing batch")
2. Generate the batch name using format: `DD MMMM YYYY - Full Name` (e.g., `14 February 2026 - Luay Madkhali`)
3. Enforce the 64-question limit:
   - If adding to an existing batch, calculate remaining capacity (`64 - current_count`)
   - If questions exceed capacity, split into multiple batches automatically
4. Update `question_count` on the batch after inserting questions

### New Interface for Save Options

```text
interface SaveOptions {
  targetBatchId?: string;  // null = create new batch
}
```

The `saveSet` function will:
- Fetch the user's profile to get `full_name`
- Format current date using `date-fns` (`format(new Date(), 'dd MMMM yyyy')`)
- Build batch name: `${formattedDate} - ${fullName}`
- If `targetBatchId` is provided, check existing count, calculate remaining space
- Split overflow questions into new batches as needed
- Update `question_count` on each batch

---

## Step 3: Add Batch Selection Dialog

Create `src/components/ai-generator/BatchSaveDialog.tsx`:

- A dialog shown when the user clicks Save
- Two options:
  1. **Create New Batch** (default) -- auto-generates the name
  2. **Add to Existing Batch** -- shows a list of existing batches that have fewer than 64 questions, displaying batch name, current count, and remaining capacity
- Shows a warning if questions will overflow and create additional batches
- Confirm button triggers the save

---

## Step 4: Redesign Question Library Page (`QuestionManagement.tsx`)

### New Layout

Replace the flat question table with a batch-based collapsible view:

```text
[Search bar] [Filter by category]

Batch: "14 February 2026 - Luay Madkhali"
  Created: 14 Feb 2026 | By: Luay Madkhali | Questions: 12/64 | Status: draft
  [Expand/Collapse]
  
  When expanded:
    [Question table with existing columns]

Batch: "13 February 2026 - Luay Madkhali"
  Created: 13 Feb 2026 | By: Luay Madkhali | Questions: 64/64 | Status: validated
  [Expand/Collapse]
```

### Data Fetching

Create a new hook `useQuestionBatches.ts`:
- Fetch `question_sets` with `deleted_at IS NULL`, ordered by `created_at DESC`
- For each batch, lazy-load `generated_questions` when expanded (using `question_set_id`)
- Include creator name via a join or separate profile lookup
- Support search across question text within batches

### Batch Actions
- Expand/collapse (Accordion pattern using Collapsible)
- Delete batch (soft delete -- sets `deleted_at`)
- View batch metadata

---

## Step 5: New Hook -- `useQuestionBatches.ts`

Create `src/hooks/useQuestionBatches.ts`:

```text
- batchesQuery: fetch question_sets (with user profile join for creator name)
  - Filter: deleted_at IS NULL, tenant-scoped
  - Order: created_at DESC
  
- batchQuestionsQuery(batchId): fetch generated_questions for a specific batch
  - Filter: question_set_id = batchId
  - Order: created_at ASC

- deleteBatch: soft delete (set deleted_at)
```

---

## Step 6: Update `AIQuestionGenerator.tsx`

### Replace Direct Save with Batch Dialog

- Remove the direct `handleSave` call from TopControlBar
- When user clicks Save, open the `BatchSaveDialog`
- Pass available batches (from `useQuestionBatches`) and question count to the dialog
- On confirm, call `saveSet` with optional `targetBatchId`

### Auto-clear After Save

After successful save, clear the generated questions from the preview panel.

---

## Step 7: Files Summary

| Action | File | Purpose |
|--------|------|---------|
| Migration | SQL | Add `name`, `question_count` to `question_sets` |
| Create | `src/hooks/useQuestionBatches.ts` | Batch CRUD and question fetching |
| Create | `src/components/ai-generator/BatchSaveDialog.tsx` | Batch selection dialog for saving |
| Edit | `src/hooks/useEnhancedAIGeneration.ts` | Batch-aware save with 64-limit splitting |
| Edit | `src/pages/admin/QuestionManagement.tsx` | Complete redesign with collapsible batches |
| Edit | `src/pages/admin/AIQuestionGenerator.tsx` | Integrate BatchSaveDialog |
| Edit | `src/components/ai-generator/TopControlBar.tsx` | Pass through save handler |
| Edit | `src/locales/en.json` | New batch-related i18n keys |
| Edit | `src/locales/ar.json` | New batch-related Arabic i18n keys |

---

## Step 8: Localization

| Key | English | Arabic |
|-----|---------|--------|
| batches.title | Question Batches | دفعات الأسئلة |
| batches.createNew | Create New Batch | إنشاء دفعة جديدة |
| batches.addToExisting | Add to Existing Batch | إضافة إلى دفعة موجودة |
| batches.questionsCount | {{count}}/64 questions | {{count}}/64 سؤال |
| batches.remaining | {{count}} remaining | {{count}} متبقي |
| batches.full | Batch full | الدفعة ممتلئة |
| batches.overflowWarning | Questions will be split into multiple batches | سيتم تقسيم الأسئلة إلى دفعات متعددة |
| batches.createdBy | Created by | أنشئت بواسطة |
| batches.deleteSuccess | Batch deleted | تم حذف الدفعة |
| batches.saveSuccess | Questions saved to batch | تم حفظ الأسئلة في الدفعة |
| batches.noBatches | No batches yet | لا توجد دفعات بعد |
| batches.selectBatch | Select a batch | اختر دفعة |

