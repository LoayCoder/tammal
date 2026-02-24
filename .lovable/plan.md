

# Full End-to-End System Audit Report

## Executive Summary

After a thorough code and database review, I identified **13 issues** across frontend, backend, and database layers. Most relate to the recent Survey/Draft implementation, with a few pre-existing concerns. Below is the full breakdown with severity classifications.

---

## Detected Issues

### CRITICAL (3 issues)

#### BUG-1: `employee_responses` table missing UPDATE and DELETE RLS policies

**Severity: CRITICAL**
**Layer: Database / Security**

The `employee_responses` table has RLS enabled but only has INSERT and SELECT policies for employees. There are **no UPDATE or DELETE policies** for employees.

- The `submit-response` edge function uses the **service role key**, so it bypasses RLS -- meaning the upsert/delete operations in the function itself work fine.
- However, the `useDraftResponses` hook in the frontend queries drafts directly via the client SDK. If any future client-side operation tries to update or delete a draft response directly, it will be silently blocked by RLS.
- The survey response rate query in `useOrgAnalytics` (line 388-394) counts **all** `employee_responses` including drafts (`is_draft = true`), which inflates the survey response rate. It should filter `WHERE is_draft = false`.

**Fix:**
1. Add UPDATE and DELETE RLS policies for employees on `employee_responses`.
2. Add `.eq('is_draft', false)` filter to the survey response rate query in `useOrgAnalytics.ts`.

---

#### BUG-2: `question_schedules.start_date` / `end_date` are `date` type, but the UI sends `datetime-local` values

**Severity: CRITICAL**
**Layer: Database / Backend**

The Admin UI was updated to use `datetime-local` inputs for survey schedules, but the database columns `start_date` and `end_date` remain as `date` type (not `timestamp with time zone`). This means:
- Time-of-day information is silently truncated on insert.
- The `validateSurveyTimeWindow` function in `submit-response` compares `new Date()` against a date-only value, making time-window enforcement inaccurate (it only works at day granularity, not hour/minute).
- The Employee Survey UI shows deadline times that don't actually get stored.

**Fix:**
Run a migration to alter `start_date` and `end_date` columns from `date` to `timestamp with time zone` on `question_schedules`.

---

#### BUG-3: `submit-response` upsert uses `onConflict: 'scheduled_question_id,employee_id'` but no matching unique constraint exists for all rows

**Severity: CRITICAL**
**Layer: Backend**

The single-submit path (line 153-168) uses `onConflict: 'scheduled_question_id,employee_id'` but the unique index `idx_employee_responses_unique_final` is a **partial index** with `WHERE is_draft = false`. This means:
- The upsert will fail to match existing draft rows (where `is_draft = true`) because the partial index doesn't cover them.
- The fallback insert (lines 175-196) may create duplicate draft rows.
- The bulk path (lines 279-289) works around this by explicitly deleting drafts before inserting, which is correct but uses a different pattern.

**Fix:**
Add a non-partial unique index: `CREATE UNIQUE INDEX idx_employee_responses_upsert ON employee_responses (scheduled_question_id, employee_id)` -- or change the single-submit path to use the same delete-then-insert pattern as the bulk path.

---

### MEDIUM (5 issues)

#### BUG-4: Console warning -- MoodStep cannot be given refs

**Severity: MEDIUM**
**Layer: Frontend**

The console shows: `Function components cannot be given refs. Check the render method of InlineDailyCheckin`. Looking at `InlineDailyCheckin.tsx` line 142, `MoodStep` is rendered without a ref, but the parent component or animation wrapper may be passing one. `MoodStep` is a plain function component that doesn't use `React.forwardRef`.

**Fix:** Wrap `MoodStep` with `React.forwardRef` or ensure the parent doesn't pass a ref to it.

---

#### BUG-5: Survey response rate includes drafts

**Severity: MEDIUM**
**Layer: Analytics**

In `useOrgAnalytics.ts` lines 388-394, the `answeredQuery` counts all `employee_responses` rows without filtering `is_draft = false`. This inflates survey response rates with incomplete/draft submissions.

**Fix:** Add `.eq('is_draft', false)` to the query.

---

#### BUG-6: `EmployeeSurvey.tsx` generates a new `surveySessionId` on every mount

**Severity: MEDIUM**
**Layer: Frontend**

Line 30: `const [surveySessionId] = useState(() => crypto.randomUUID())`. Every time the user navigates to the survey page, a new session ID is generated. If they previously saved a draft, the new session ID won't match the old one. While this doesn't break functionality (the bulk submit deletes old drafts and re-inserts), it means `survey_session_id` is not a reliable grouping key across sessions.

**Fix:** Load the `survey_session_id` from existing draft responses if available, falling back to a new UUID only for fresh sessions.

---

#### BUG-7: `EmployeeSurvey` doesn't handle already-submitted surveys

**Severity: MEDIUM**
**Layer: Frontend**

If an employee has already submitted the survey (all `scheduled_questions` are in `answered` status), the `useScheduledQuestions` hook fetches only `pending`/`delivered` statuses, so `pendingQuestions` will be empty. The UI shows "All caught up!" which is correct, but there's no distinction between "no survey assigned" and "survey already completed". There's also no way to view previously submitted answers.

**Fix:** Add a separate query to check if answered survey responses exist, and show a "Survey Completed" state instead of the generic "All caught up" message.

---

#### BUG-8: `question_schedules` table `start_date`/`end_date` date format mismatch with linked periods

**Severity: MEDIUM**
**Layer: Frontend**

When a Generation Period is linked to a survey schedule (lines 730-735 of `ScheduleManagement.tsx`), the period's `start_date`/`end_date` are plain date strings (e.g., `2026-03-01`), but the UI input is `datetime-local` which expects `YYYY-MM-DDTHH:mm`. This means the value won't render properly in the datetime-local input when pre-populated from a linked period.

**Fix:** Append `T00:00` to period dates when setting datetime-local values, or convert the period dates to the correct format.

---

### LOW (5 issues)

#### BUG-9: `useScheduledQuestions` hook fetches `question_source` but the type interface doesn't declare it

**Severity: LOW**
**Layer: Frontend / TypeScript**

The `ScheduledQuestion` interface (lines 5-23 of `useScheduledQuestions.ts`) doesn't include `question_source`, but the query uses it for polymorphic question fetching. This works at runtime due to `any` casts but lacks type safety.

**Fix:** Add `question_source: string` to the `ScheduledQuestion` interface.

---

#### BUG-10: `MoodStep` dynamic grid class generation won't work with Tailwind

**Severity: LOW**
**Layer: Frontend**

Line 89: `` const colsClass = `grid-cols-${displayMoods.length}` ``. Dynamic class names like `grid-cols-6` are not in Tailwind's safelist and won't be generated. However, line 98 uses inline `style={{ gridTemplateColumns: ... }}` which bypasses this, making the `colsClass` variable unused dead code.

**Fix:** Remove the unused `colsClass` variable.

---

#### BUG-11: `EmployeeSurvey` draft pre-population race condition

**Severity: LOW**
**Layer: Frontend**

The `useEffect` on line 33-43 merges drafts into answers with `{ ...drafts, ...prev }`, meaning user-typed answers override draft values. However, the dependency array only includes `draftResponses`, so if the user starts answering before drafts load, the user's answers take priority -- which is correct behavior. No action needed, but worth documenting.

---

#### BUG-12: Soft delete not enforced on `employee_responses`

**Severity: LOW**
**Layer: Architecture**

Per the project's SaaS standards, all management modules should use soft deletes (`deleted_at`). The `employee_responses` table doesn't have a `deleted_at` column. The bulk submit path in `submit-response` uses hard `DELETE` (line 281-285) to remove old drafts before re-inserting.

**Fix:** Consider adding a `deleted_at` column, or document this as an acceptable exception since drafts are transient.

---

#### BUG-13: `useScheduledQuestions` surveyMeta only returns the first schedule

**Severity: LOW**
**Layer: Frontend**

Line 143 of `useScheduledQuestions.ts`: `const s = schedules[0]` -- if an employee has questions from multiple survey schedules, only the first schedule's metadata is returned. This could show incorrect time windows.

**Fix:** Group by `schedule_id` and return metadata per schedule, or ensure the UI handles multiple active surveys.

---

## Data Integrity Check Results

| Check | Result |
|-------|--------|
| Orphaned `scheduled_questions` (no parent schedule) | 0 -- OK |
| Orphaned `employee_responses` (no parent scheduled_question) | 0 -- OK |
| Duplicate final responses | 0 -- OK (unique index protects) |
| Survey/Check-in cross-contamination in `scheduled_questions` | None detected -- schedule engine is properly scoped |
| RLS enabled on `employee_responses` | Yes |
| RLS policies cover INSERT/SELECT | Yes |
| RLS policies cover UPDATE/DELETE | **No -- Missing** |

---

## Summary by Severity

| Severity | Count | Issues |
|----------|-------|--------|
| CRITICAL | 3 | BUG-1, BUG-2, BUG-3 |
| MEDIUM | 5 | BUG-4, BUG-5, BUG-6, BUG-7, BUG-8 |
| LOW | 5 | BUG-9, BUG-10, BUG-11, BUG-12, BUG-13 |

---

## Recommended Fix Plan (Priority Order)

1. **Database migration**: Alter `question_schedules.start_date` and `end_date` from `date` to `timestamptz` (BUG-2)
2. **Database migration**: Add UPDATE/DELETE RLS policies for employees on `employee_responses` (BUG-1)
3. **Database migration**: Add a proper unique index for upsert support, or refactor single-submit to delete-then-insert (BUG-3)
4. **Code fix**: Filter `is_draft = false` in survey response rate analytics (BUG-5)
5. **Code fix**: Reuse existing `survey_session_id` from drafts (BUG-6)
6. **Code fix**: Fix datetime-local format when linking generation periods (BUG-8)
7. **Code fix**: Wrap `MoodStep` in `forwardRef` (BUG-4)
8. **Code fix**: Distinguish "survey completed" from "no survey" state (BUG-7)
9. **Code cleanup**: TypeScript types, dead code removal (BUG-9, BUG-10)

---

## What Passed Audit (No Issues Found)

- Daily Check-In workflow is fully isolated from Survey pipeline
- Schedule engine correctly scopes to `schedule_type = 'survey'`
- Mood Pathway and `mood_entries` table are untouched by survey changes
- Foreign key integrity is intact (0 orphans)
- AdminRoute RBAC guarding works correctly
- Soft delete pattern applied correctly on `question_schedules`
- Gamification/streak logic is independent and unaffected
- Crisis support workflow is isolated
- Spiritual module is fully independent
- RTL rendering uses logical properties correctly throughout

