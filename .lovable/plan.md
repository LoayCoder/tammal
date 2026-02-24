

# Fix: "Failed to create schedule" -- Database Constraint Violation

## Problem

The database has a CHECK constraint on `question_schedules.questions_per_delivery` that enforces values between 1 and 5. The recent survey logic change sets this value to `0` for surveys, which violates this constraint and causes the insert to fail.

## Solution

Run a database migration to relax the CHECK constraint to allow `0` as a valid value. The value `0` serves as the signal meaning "deliver all questions at once" (used exclusively by survey schedules).

### Database Migration

Drop the existing constraint and recreate it allowing 0-5:

```text
ALTER TABLE question_schedules DROP CONSTRAINT question_schedules_questions_per_delivery_check;
ALTER TABLE question_schedules ADD CONSTRAINT question_schedules_questions_per_delivery_check
  CHECK (questions_per_delivery >= 0 AND questions_per_delivery <= 5);
```

## Files to Modify

| File | Change |
|------|--------|
| New migration SQL | Relax the `questions_per_delivery` CHECK constraint from `>= 1` to `>= 0` |

No code changes needed -- the frontend and backend already correctly send `0` for surveys.

