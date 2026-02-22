
# Fix: Mood Follow-up Questions Shown When No Active Schedules Exist

## Problem
After deleting all Question Batches and Schedules, the Daily Check-in still shows Mood Follow-up Questions. This happens because `useMoodPathwayQuestions` fetches questions directly from the `questions` table based on `mood_levels` tags -- it has no awareness of whether any active schedules or batches exist.

## Root Cause
The `useMoodPathwayQuestions` hook (line 19-33) queries:
```text
questions WHERE deleted_at IS NULL AND is_active = true AND mood_levels @> '["great"]'
```
This returns questions purely based on their mood tags, ignoring whether the tenant has any active Daily Check-in schedules. Currently, 5 questions in the database have `mood_levels` set and are active, so they always appear.

## Solution
Add a validation check in the `useMoodPathwayQuestions` hook: before returning mood pathway questions, verify that at least one active `daily_checkin` schedule exists for the tenant. If none exists, return an empty array.

## Technical Details

### File: `src/hooks/useMoodPathwayQuestions.ts`
- Before querying for questions, first check if there is at least one active daily_checkin schedule for the tenant:
  - Query `question_schedules` where `schedule_type = 'daily_checkin'`, `status = 'active'`, `deleted_at IS NULL`, and `tenant_id` matches
  - Also validate `end_date`: if set, it must be >= today (not expired)
- If no active schedule is found, return an empty array immediately (no follow-up questions shown)
- If at least one valid schedule exists, proceed with the existing mood-tagged question fetch

This approach ensures:
- No follow-up questions appear when all schedules are deleted
- No follow-up questions appear when all schedules are expired
- Follow-up questions only appear when the tenant has a valid, active daily check-in schedule
