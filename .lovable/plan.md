

# Audit: Survey vs Daily Check-in Workflow Separation

## Audit Summary

After a thorough review of all backend logic, frontend hooks, edge functions, and analytics, the system is **mostly well-separated** but has **5 concrete gaps** that need fixing.

---

## Current State: What Is Already Correct

| Area | Status | Details |
|------|--------|---------|
| Frontend: Daily Check-in UI | Clean | `InlineDailyCheckin.tsx` and `DailyCheckin.tsx` use only `mood_entries` -- no survey pipeline involvement |
| Frontend: Survey UI | Clean | `EmployeeSurvey.tsx` uses `useScheduledQuestions` which filters `schedule_type = 'survey'` |
| Hook: `useScheduledQuestions` | Clean | Explicitly filters `schedule_type = 'survey'` before fetching scheduled_questions |
| Hook: `useCheckinScheduledQuestions` | Clean | Explicitly filters `schedule_type = 'daily_checkin'` (though no longer called from check-in UI) |
| Hook: `useMoodPathwayQuestions` | Clean | Uses `daily_checkin` schedules as a gate only; pulls from `questions` bank by mood tag |
| Question Batches | Clean | `useQuestionBatches` separates `survey` (question_sets/generated_questions) from `wellness` (question_generation_batches/wellness_questions) |
| Response Storage | Clean | Daily Check-in saves to `mood_entries.answer_value`; Surveys save to `employee_responses` via `submit-response` edge function |
| Schedule Management UI | Clean | Schedule type selector properly filters batches by purpose |

---

## Gaps Found

### GAP 1: Schedule Engine Does NOT Filter by Schedule Type (CRITICAL)

**File:** `supabase/functions/schedule-engine/index.ts`

**Problem:** The schedule engine processes ALL active schedules without distinguishing between `daily_checkin` and `survey` types. It fetches `question_schedules` with only `status = 'active'` and `deleted_at IS NULL` -- no `schedule_type` filter. This means:
- It creates `scheduled_questions` rows for daily check-in schedules
- These rows are never consumed (the check-in UI uses mood pathway, not scheduled_questions)
- This wastes database rows and could confuse analytics

**Fix:** Add `.eq('schedule_type', 'survey')` filter to the schedule engine query, OR accept a `scheduleType` parameter. Since Daily Check-in no longer uses the scheduled_questions pipeline, the engine should only process survey schedules.

---

### GAP 2: Deliver-Questions Edge Function Has No Schedule Type Filter (MEDIUM)

**File:** `supabase/functions/deliver-questions/index.ts`

**Problem:** The `deliver-questions` function marks ALL pending `scheduled_questions` as "delivered" regardless of which schedule type created them. If GAP 1 creates daily_checkin rows, this function would deliver them too.

**Fix:** Join `scheduled_questions` with `question_schedules` to only deliver rows belonging to `survey` schedules, or rely on GAP 1 fix to prevent daily_checkin rows from being created.

---

### GAP 3: Survey Response Rate in Analytics Counts ALL Scheduled Questions (MEDIUM)

**File:** `src/hooks/useOrgAnalytics.ts` (lines 322-340)

**Problem:** The "Survey Response Rate" KPI counts ALL rows from `scheduled_questions` and ALL rows from `employee_responses` without filtering by schedule type. If any daily_checkin scheduled_questions exist (from GAP 1), they inflate the denominator, making the survey response rate appear lower than it actually is.

**Fix:** Join or pre-filter `scheduled_questions` to only count rows whose `schedule_id` belongs to a `survey` type schedule. Similarly, `employee_responses` should only count those linked to survey scheduled_questions.

---

### GAP 4: Analytics `employee_responses` Queries Include Both Workflows (LOW)

**File:** `src/hooks/useOrgAnalytics.ts` (lines 292-307, 343-409, 472-477)

**Problem:** The analytics dashboard queries `employee_responses` for trend data, category scores, and cross-analysis without distinguishing whether responses came from surveys or check-ins. Currently this works because daily check-in responses go to `mood_entries` (not `employee_responses`), but if the system ever changes, there is no guard. More importantly, the `responseCount` in the daily trend merges survey response volume with mood entry volume on the same chart without labeling the distinction.

**Fix:** Add a comment/guard to clarify that `employee_responses` is survey-only. Optionally, label the trend chart axis to say "Survey Responses" rather than generic "Daily Responses".

---

### GAP 5: Employee Home Page Uses `useScheduledQuestions` Without Schedule Type Context (LOW)

**File:** `src/pages/EmployeeHome.tsx` (line 55-58)

**Problem:** The Employee Home page calls `useScheduledQuestions(employee?.id)` to show the "Pending Surveys" card. While `useScheduledQuestions` correctly filters to `survey` type, the hook name is generic and the import at EmployeeHome doesn't make the survey-only intent explicit. This is a code clarity issue, not a functional bug.

**Fix:** No code change required -- just noting for documentation. The hook is correctly scoped.

---

## Fix Plan

### Fix 1: Schedule Engine -- Filter to Survey Only

In `supabase/functions/schedule-engine/index.ts`, add schedule type filter:

```
// Change line 30 from:
.is("deleted_at", null);

// To:
.is("deleted_at", null)
.eq("schedule_type", "survey");
```

This ensures the schedule engine never creates `scheduled_questions` rows for daily check-in schedules, since check-ins use the mood pathway (questions bank filtered by mood_levels) instead.

### Fix 2: Deliver-Questions -- Filter to Survey Only

In `supabase/functions/deliver-questions/index.ts`, add a join filter to only deliver survey-type scheduled questions. Since direct join isn't straightforward, the preferred approach is:
1. First fetch survey schedule IDs
2. Then filter `scheduled_questions` to only those schedule IDs

### Fix 3: Analytics Survey Response Rate -- Scope to Survey

In `src/hooks/useOrgAnalytics.ts`, modify the "Survey Response Rate" calculation (around line 322) to:
1. First fetch survey-type schedule IDs
2. Filter `scheduled_questions` count to only those schedule IDs
3. Filter `employee_responses` count to only those linked via `scheduled_question_id` to survey schedules

### Fix 4: Analytics Labels Clarity

In `src/hooks/useOrgAnalytics.ts` and `OrgDashboard.tsx`:
- Rename `responseCount` in the trend data to `surveyResponseCount` for clarity
- Update the chart tooltip label from generic "Daily Responses" to explicitly say "Survey Responses"

### Fix 5: Cleanup Orphaned Daily Check-in Scheduled Questions (Optional)

Run a one-time cleanup to soft-delete any `scheduled_questions` rows that were created by `daily_checkin` schedules (if any exist). This prevents them from affecting analytics.

```sql
UPDATE scheduled_questions
SET status = 'expired'
WHERE schedule_id IN (
  SELECT id FROM question_schedules WHERE schedule_type = 'daily_checkin'
)
AND status IN ('pending', 'delivered');
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/schedule-engine/index.ts` | Add `.eq('schedule_type', 'survey')` filter |
| `supabase/functions/deliver-questions/index.ts` | Add survey-only scope |
| `src/hooks/useOrgAnalytics.ts` | Scope survey response rate and response counts to survey schedules; rename field for clarity |
| `src/components/dashboard/OrgDashboard.tsx` | Update chart label to "Survey Responses" |

## No Changes Needed

| File | Reason |
|------|--------|
| `InlineDailyCheckin.tsx` | Already uses mood_entries only |
| `DailyCheckin.tsx` | Already uses mood_entries only |
| `MoodPathwayQuestions.tsx` | Correctly scoped to questions bank + daily_checkin gate |
| `EmployeeSurvey.tsx` | Correctly uses survey-scoped hook |
| `useScheduledQuestions.ts` | Already filters schedule_type = 'survey' |
| `useCheckinScheduledQuestions.ts` | Already filters schedule_type = 'daily_checkin' (unused but correct) |
| `submit-response` edge function | Only processes scheduled_questions (survey pipeline) |
| `useQuestionBatches.ts` | Correctly separates survey vs wellness batches |

