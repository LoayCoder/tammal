
# Fix: Survey Question Count Mismatch and Numbering Gap

## Root Cause Analysis

### Issue 1: 25 questions in batch, only 24 in survey
The question "How often do you feel emotionally drained from your work?" (`69624610`) has `validation_status = 'pending'` while all other 24 questions have `validation_status = 'passed'`. The schedule engine only includes questions with status `published` or `passed`, so this question was skipped during scheduling.

Ironically, this is the only `multiple_choice` question that actually has proper bilingual options filled in.

### Issue 2: Question numbering mismatch (Survey #10 != Batch #9)
The batch lists questions ordered by `created_at`. The survey orders by `scheduled_delivery`, but since all questions receive the same delivery timestamp, the database returns them in arbitrary (non-deterministic) order. This causes numbering to drift between the two views.

### Issue 3: Empty options on multiple_choice questions
Three `multiple_choice` questions in the batch have empty `options: []`, which is a data-quality issue from the AI generation step.

---

## Fix Plan

### Fix 1: Include "pending" questions in the schedule engine
Update the schedule engine to also accept `pending` validation status for generated questions, so all batch questions get scheduled. The schedule is explicitly linked to a batch -- if the admin chose to schedule it, all questions should be delivered.

**File:** `supabase/functions/schedule-engine/index.ts`
- Line 102: Change `.in("validation_status", ["published", "passed"])` to `.in("validation_status", ["published", "passed", "pending"])`

### Fix 2: Patch the missing question into scheduled_questions
Run a one-time database migration to insert the missing question (`69624610`) into the `scheduled_questions` table for all employees in schedule `6dca6b30`, so the current survey immediately shows 25/25 without needing to re-run the engine.

**File:** New SQL migration

### Fix 3: Deterministic question ordering in the survey
Update `useScheduledQuestions.ts` to add a secondary sort by `question_id` so the order is stable and consistent, preventing numbering drift.

**File:** `src/hooks/useScheduledQuestions.ts`
- Add `.order('question_id', { ascending: true })` as a secondary sort after `scheduled_delivery`

### Fix 4: Update the missing question's validation_status
Set question `69624610`'s `validation_status` to `passed` so it's treated consistently with the rest of the batch.

**File:** Included in the same SQL migration

---

## Technical Summary

| File | Change |
|------|--------|
| `supabase/functions/schedule-engine/index.ts` | Accept `pending` validation status |
| `src/hooks/useScheduledQuestions.ts` | Add secondary sort by `question_id` for deterministic ordering |
| New SQL migration | Insert missing question for existing employees + update its validation_status to `passed` |
