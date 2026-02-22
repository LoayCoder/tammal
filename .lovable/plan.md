

# Generation Enhancements: Prerequisites, Color Inheritance, Period-Batch Linking, and Auto Question Count

## Overview

This plan adds five interconnected enhancements to the Question Generation module: prerequisite gates, subcategory color inheritance, period-to-batch linkage with expiry cascading, automatic question count calculation based on period duration and questions-per-day, and integration with Schedule Management.

---

## 1. Generation Prerequisites (Gate Check)

**Goal:** Block question generation until configuration is valid.

**Rules:**
- At least 3 categories must exist and be active
- Each category can have max 5 subcategories (already enforced)
- The generation configuration must be valid (categories selected, model selected)

**Changes:**

**`src/components/ai-generator/ConfigPanel.tsx`**
- Add a prerequisite validation block above the Generate button
- Check `activeCategories.length >= 3` -- if not, show an Alert with a message like "You need at least 3 categories before generating questions"
- Disable the Generate button and show a checklist of unmet prerequisites
- Prerequisites checklist:
  - Minimum 3 active categories
  - At least 1 category selected
  - Model selected (already handled)

**`src/locales/en.json` and `ar.json`**
- Add keys: `aiGenerator.prerequisiteMinCategories`, `aiGenerator.prerequisitesNotMet`, `aiGenerator.prerequisiteSelectCategory`

---

## 2. Category and Subcategory Color Inheritance

**Goal:** Subcategories must always inherit their parent category's color. No custom color allowed.

**Changes:**

**`src/components/questions/SubcategoryDialog.tsx`**
- Remove the color picker section entirely
- Auto-set color from the selected parent category
- When `categoryId` changes, look up the parent category's color and set it automatically
- Remove `isColorTaken` validation (no longer relevant since all siblings share the same color)

**`src/hooks/useQuestionSubcategories.ts`**
- No changes needed -- the color field is still saved, just always set to the parent's color

**`src/pages/admin/SubcategoryManagement.tsx`**
- No structural changes -- the color dot in the table will naturally show the inherited color

**`src/pages/admin/CategoryManagement.tsx`**
- When a category's color is updated, cascade the change to all its subcategories
- After `updateCategory.mutate` succeeds, run an additional mutation to update all subcategories with `category_id = id` to the new color

**`src/hooks/useQuestionCategories.ts`**
- Add an `onSuccess` callback option or a separate `cascadeColorToSubcategories` function that updates subcategory colors when a category color changes

---

## 3. Period and Expiry Management (Period-Batch-Schedule Linking)

**Goal:** Link generation periods to question batches and schedules. When a period expires, deactivate associated batches.

**Database Migration:**
```sql
-- Add generation_period_id to question_sets
ALTER TABLE question_sets ADD COLUMN generation_period_id uuid REFERENCES generation_periods(id);

-- Add generation_period_id to question_generation_batches 
ALTER TABLE question_generation_batches ADD COLUMN generation_period_id uuid;

-- Add generation_period_id to question_schedules
ALTER TABLE question_schedules ADD COLUMN generation_period_id uuid;
```

**Changes:**

**`src/hooks/useEnhancedAIGeneration.ts`** (save functions)
- When saving a batch (survey or wellness), store `selectedPeriodId` as `generation_period_id` on the batch record

**`src/hooks/useQuestionBatches.ts`**
- Add `generation_period_id` to the `QuestionBatch` interface
- Display the linked period info in batch listings

**`src/hooks/useGenerationPeriods.ts`**
- When `expirePeriod` is called, also deactivate all batches and schedules linked to that period:
  - Update `question_sets` where `generation_period_id = periodId` to `status = 'inactive'`
  - Update `question_generation_batches` where `generation_period_id = periodId` to `status = 'inactive'`
  - Update `question_schedules` where `generation_period_id = periodId` to `status = 'paused'`

**`src/pages/admin/QuestionManagement.tsx`** (Question Batches page)
- Show the linked period's date range and type as a badge on each batch
- Fetch period data to display alongside batches

---

## 4. Automatic Question Count Based on Period

**Goal:** When a period is selected, auto-calculate total questions = period days x questions per day.

**UI Changes in `src/components/ai-generator/ConfigPanel.tsx`:**

- When a period is selected, replace the manual question count selector with:
  - A "Questions Per Day" selector: styled stepper with options 1, 2, or 3
  - An auto-calculated "Total Questions" display showing: `{days} days x {perDay} = {total} questions`
  - The `questionCount` is automatically set to `days * questionsPerDay`

- When no period is selected (freeform mode), keep the existing manual question count selector

**Calculation logic:**
- `periodDays = differenceInDays(parse(endDate), parse(startDate))`
- Exclude weekends if applicable (based on schedule settings)
- `totalQuestions = periodDays * questionsPerDay`
- Min 1 per day, Max 3 per day

**New props/state:**
- `questionsPerDay` state (1, 2, or 3) in `AIQuestionGenerator.tsx`
- Pass down to ConfigPanel

---

## 5. Integration with Schedule Management

**Goal:** Sync period-driven configuration with schedule "Questions Per Delivery" and timing.

**Changes in `src/pages/admin/ScheduleManagement.tsx`:**
- When creating/editing a schedule that has a linked period:
  - Auto-populate `start_date` and `end_date` from the period
  - Pre-fill `questions_per_delivery` from the period's questions-per-day setting
  - Show the period info as a read-only badge
  - If the period expires, the schedule status auto-changes to "paused"

**Changes in `src/hooks/useQuestionSchedules.ts`:**
- Add `generation_period_id` to the interface and CRUD operations

---

## Technical Summary of File Changes

| File | Change |
|------|--------|
| **Migration** | Add `generation_period_id` to `question_sets`, `question_generation_batches`, `question_schedules` |
| **ConfigPanel.tsx** | Add prerequisites gate, auto question count with questions-per-day selector |
| **SubcategoryDialog.tsx** | Remove color picker, auto-inherit parent color |
| **CategoryManagement.tsx** | Cascade color changes to subcategories |
| **useGenerationPeriods.ts** | Cascade expire to batches/schedules |
| **useQuestionBatches.ts** | Add `generation_period_id` field |
| **useQuestionSchedules.ts** | Add `generation_period_id` field |
| **useEnhancedAIGeneration.ts** | Save `generation_period_id` on batch creation |
| **AIQuestionGenerator.tsx** | Add `questionsPerDay` state, pass to ConfigPanel |
| **ScheduleManagement.tsx** | Auto-populate from linked period |
| **en.json / ar.json** | New translation keys for prerequisites, questions-per-day, period linkage |

## New Translation Keys

**English:**
- `aiGenerator.prerequisiteMinCategories`: "At least 3 active categories are required before generating"
- `aiGenerator.prerequisitesNotMet`: "Generation prerequisites not met"
- `aiGenerator.questionsPerDay`: "Questions Per Day"
- `aiGenerator.questionsPerDayDesc`: "Select how many questions to generate per day"
- `aiGenerator.totalQuestionsCalc`: "{{days}} days x {{perDay}} per day = {{total}} questions"
- `aiGenerator.periodLinked`: "Linked to period"
- `subcategories.colorInherited`: "Color is inherited from parent category"

**Arabic:**
- `aiGenerator.prerequisiteMinCategories`: "يجب إنشاء 3 فئات نشطة على الأقل قبل التوليد"
- `aiGenerator.prerequisitesNotMet`: "لم يتم استيفاء متطلبات التوليد"
- `aiGenerator.questionsPerDay`: "أسئلة في اليوم"
- `aiGenerator.questionsPerDayDesc`: "اختر عدد الأسئلة المراد توليدها يومياً"
- `aiGenerator.totalQuestionsCalc`: "{{days}} يوم × {{perDay}} يومياً = {{total}} سؤال"
- `aiGenerator.periodLinked`: "مرتبط بالفترة"
- `subcategories.colorInherited`: "اللون موروث من الفئة الأم"

