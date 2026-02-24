

# Update Survey Schedule Logic -- Remove "Questions Per Delivery" and Add Draft/Time-Window Support

## Overview

This change aligns Survey scheduling with its true purpose: delivering all questions in one session with draft capability and time-window enforcement. Daily Check-In remains completely untouched.

## Scope of Changes

### 1. Admin UI -- Hide "Questions Per Delivery" for Surveys

**File: `src/pages/admin/ScheduleManagement.tsx`**

The "Questions Per Delivery" stepper (lines 798-848) currently shows for both schedule types. Wrap it in a `scheduleType === 'daily_checkin'` condition so it only renders for Daily Check-In.

- The stepper and its mood-override collapsible below it are already visually grouped
- For surveys, the `questions_per_delivery` value submitted to the backend will be set to `0` (or omitted) as a signal that "all questions" should be delivered at once
- The `handleSubmit` function (line 260) will set `questions_per_delivery: scheduleType === 'survey' ? 0 : questionsPerDelivery`

Also update the Start/End Date inputs (lines 774-797) to use `datetime-local` instead of `date` so admins can specify exact start and end times for the survey window.

### 2. Schedule Engine -- Deliver All Questions at Once for Surveys

**File: `supabase/functions/schedule-engine/index.ts`**

Currently the engine uses `questionsPerDelivery` (line 206) to slice questions into daily batches. For survey schedules:

- When `questions_per_delivery` is `0` (or schedule type is survey), skip the multi-day delivery date loop
- Instead, use a single delivery timestamp (the schedule's `start_date` or preferred time)
- Assign ALL unassigned questions to each employee in one delivery slot
- This means every employee gets every question from the linked batches in a single assignment

Key logic change (around lines 154-265):
```text
if (schedule.schedule_type === 'survey') {
  // Single delivery: assign ALL questions to each employee at the start_date time
  const deliveryDate = new Date(schedule.start_date || new Date());
  for (const employee of employees) {
    // assign all unassigned questions to this employee at deliveryDate
  }
} else {
  // Existing daily check-in batching logic (unchanged)
}
```

### 3. Database -- Add Draft Support for Survey Responses

**Migration: Add `is_draft` column and `survey_session_id` to `employee_responses`**

```text
ALTER TABLE employee_responses ADD COLUMN is_draft boolean NOT NULL DEFAULT false;
ALTER TABLE employee_responses ADD COLUMN survey_session_id uuid;
```

This allows:
- Saving partial answers as drafts (`is_draft = true`)
- Grouping responses by survey session
- Final submission flips all drafts for that session to `is_draft = false`

Also add a unique constraint to prevent duplicate draft+final responses:
```text
CREATE UNIQUE INDEX idx_employee_responses_unique_answer 
ON employee_responses (scheduled_question_id, employee_id) 
WHERE is_draft = false;
```

### 4. Submit-Response Edge Function -- Support Draft Save

**File: `supabase/functions/submit-response/index.ts`**

Add a `isDraft` flag to the request body:
- When `isDraft = true`: upsert the response with `is_draft = true` (does not mark scheduled_question as answered)
- When `isDraft = false` (final submit): upsert with `is_draft = false` and mark the scheduled_question as `answered`
- Add time-window validation: check if `now()` is between the schedule's `start_date` and `end_date`; reject if outside window (unless admin override)

### 5. Employee Survey Portal -- Full Session Delivery with Draft Support

**File: `src/pages/employee/EmployeeSurvey.tsx`**

Major UX changes:
- Show ALL survey questions at once (not one-at-a-time pagination)
- Add a "Save as Draft" button that saves all current answers without final submission
- Add a "Submit Survey" button that validates all questions are answered, then submits
- On page load, fetch any existing draft responses and pre-populate answers
- Show a banner with the survey time window (start/end dates)
- After the end time, disable editing and show a "Survey Closed" message

**File: `src/hooks/useScheduledQuestions.ts`**

- Add a query to also fetch existing draft responses for the employee so the UI can resume from where they left off

**File: `src/hooks/useEmployeeResponses.ts`**

- Add a `saveDraft` mutation that sends all current answers with `isDraft: true`
- Add a `submitSurvey` mutation that sends all answers with `isDraft: false`
- Add a query to fetch draft responses for pre-population

### 6. Time Window Enforcement

**Frontend (`EmployeeSurvey.tsx`):**
- Fetch the schedule's `start_date` and `end_date` alongside the questions
- If `now < start_date`: show "Survey not yet open" message
- If `now > end_date`: show "Survey closed" message, disable all inputs
- If within window: show the survey normally with a countdown/deadline banner

**Backend (`submit-response/index.ts`):**
- On every submit (draft or final), validate the schedule's time window
- Reject submissions outside the window with a clear error message

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/admin/ScheduleManagement.tsx` | Hide questions-per-delivery stepper for surveys; use datetime-local for survey date inputs; set `questions_per_delivery: 0` for surveys |
| `supabase/functions/schedule-engine/index.ts` | Add survey-specific path that assigns all questions in one delivery slot |
| `supabase/functions/submit-response/index.ts` | Add draft support and time-window validation |
| `src/pages/employee/EmployeeSurvey.tsx` | Redesign to show all questions, add draft save, resume, time-window UI |
| `src/hooks/useScheduledQuestions.ts` | Fetch draft responses alongside scheduled questions |
| `src/hooks/useEmployeeResponses.ts` | Add `saveDraft` and `submitSurvey` mutations |

## New Database Objects

| Object | Type | Description |
|--------|------|-------------|
| `employee_responses.is_draft` | Column (boolean) | Marks response as draft or final |
| `employee_responses.survey_session_id` | Column (uuid) | Groups responses in a single survey session |
| Unique index on `(scheduled_question_id, employee_id) WHERE is_draft = false` | Index | Prevents duplicate final submissions |

## What Does NOT Change

- Daily Check-In scheduling, delivery, frequency, questions-per-delivery, mood configs
- Mood Pathway logic and `mood_entries` table
- Check-in UI at `/employee/home`
- Existing RLS policies (new column inherits existing row policies)

