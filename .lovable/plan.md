

# Plan: Remove "Today's Wellness Question" System Permanently

## What Gets Removed

The "Today's Wellness Question" is the tenant-wide daily question fetched from `daily_question_schedule` + `wellness_questions` tables. It appears as a separate step/section in both check-in flows. Removing it simplifies the check-in to: **Mood -> Pathway Follow-ups -> Scheduled Questions -> Submit**.

---

## Files to Modify

### 1. `src/components/checkin/InlineDailyCheckin.tsx` (Primary inline flow)
- Remove import of `useDailyWellnessQuestions`
- Remove `question` / `questionLoading` state from hook
- Remove `wellnessAnswer` state variable
- Remove `dailyWellnessQuestionId` variable (used for dedup -- pass `undefined` instead)
- Remove the entire "Wellness Question" UI section (lines 234-251)
- Remove `renderWellnessInput` function call and the function itself (lines 353+)
- Remove `MessageCircle` icon import (if only used for wellness)
- Remove `wellnessAnswer` from submission payload (`answerValue.wellness`, `generate-daily-tip` body)
- Remove `question?.question_id` from `mood_entries` insert (`question_id` column)
- Remove `setWellnessAnswer(null)` from reset logic

### 2. `src/pages/employee/DailyCheckin.tsx` (Multi-step flow)
- Remove import of `useDailyWellnessQuestions` and `WellnessQuestionStep`
- Remove `question` / `questionLoading` state
- Remove `wellnessAnswer` state variable
- Remove `dailyWellnessQuestionId` variable
- Remove `'wellness'` from the `steps` array and `Step` type
- Remove `advanceFromWellness` function
- Remove wellness references in `handleMoodSelected`, `advanceFromMood`, `goBack`
- Remove the entire `{step === 'wellness' && ...}` block (lines 270-288)
- Remove `wellnessAnswer` from submission payload and `generate-daily-tip` body
- Remove `question_id` from `mood_entries` insert
- Update step flow: mood -> scheduled (or support if no scheduled)

### 3. `src/hooks/useDailyWellnessQuestions.ts`
- **Delete this file entirely** -- no longer needed

### 4. `src/components/checkin/WellnessQuestionStep.tsx`
- **Delete this file entirely** -- no longer needed

### 5. `supabase/functions/auto-schedule-questions/index.ts`
- **Delete this edge function entirely** -- it only served the daily wellness schedule

### 6. `supabase/functions/generate-daily-tip/index.ts`
- Update to remove `questionText` and `answerValue` parameters from the body (these were the wellness question data)
- The function still generates tips based on mood level and pathway answers, so it stays but with a simplified input

---

## Database Considerations

The following database objects become unused but should NOT be dropped (data preservation):
- `daily_question_schedule` table -- contains historical schedule data
- `wellness_questions` table -- still used by the AI Generator's wellness save flow (`WellnessSavePreviewDialog.tsx`)

The `wellness_questions` table is still actively used for AI-generated question storage via the generator UI, so it must stay. Only the daily scheduling/delivery pipeline is removed.

---

## Step Flow Changes

**Before:**
```text
Mood -> Pathway Follow-ups -> Wellness Question -> Scheduled Questions -> Submit
```

**After:**
```text
Mood -> Pathway Follow-ups -> Scheduled Questions -> Submit
```

---

## Summary of Changes

| Action | File |
|---|---|
| Modify | `src/components/checkin/InlineDailyCheckin.tsx` |
| Modify | `src/pages/employee/DailyCheckin.tsx` |
| Modify | `supabase/functions/generate-daily-tip/index.ts` |
| Delete | `src/hooks/useDailyWellnessQuestions.ts` |
| Delete | `src/components/checkin/WellnessQuestionStep.tsx` |
| Delete | `supabase/functions/auto-schedule-questions/index.ts` |

No database migrations needed -- tables are preserved for historical data and the AI generator workflow.

