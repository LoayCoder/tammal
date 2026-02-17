

# Schedule Type Logic: Daily Check-in vs Survey

## Overview
Add a mandatory **Schedule Type** selector to the schedule creation/edit workflow. This type controls which batches are visible, which form fields appear, and ensures strict data separation between Daily Check-in and Survey schedules.

## Database Changes

### 1. Add columns to `question_schedules` table
- `schedule_type TEXT NOT NULL DEFAULT 'daily_checkin'` -- values: `daily_checkin` or `survey`
- `start_date DATE` -- required for survey type only
- `end_date DATE` -- required for survey type only

No destructive changes. Additive columns only.

## Frontend Changes

### 2. Update `useQuestionSchedules` hook (`src/hooks/useQuestionSchedules.ts`)
- Add `schedule_type`, `start_date`, `end_date` to the `QuestionSchedule` interface
- Include them in create/update mutation payloads

### 3. Update Schedule Management form (`src/pages/admin/ScheduleManagement.tsx`)

**New form state:**
- `scheduleType` (`'daily_checkin' | 'survey'`)
- `startDate` (string, for survey)
- `endDate` (string, for survey)

**Schedule Type selector (first field in form):**
- Two radio options: "Daily Check-in" and "Survey"
- Mandatory -- cannot proceed without selecting

**Conditional logic based on type:**

| Feature | Daily Check-in | Survey |
|---|---|---|
| Frequency selector | Shown (existing logic) | Hidden |
| Start/End date pickers | Hidden | Shown (required) |
| Preferred time | Shown | Shown |
| Batch list | Filtered to `purpose === 'wellness'` | Filtered to `purpose === 'survey'` |
| Weekend days | Shown | Hidden |

**Validation:**
- Survey type requires start date and end date (end >= start)
- At least one batch must be selected
- Submit button disabled until valid

### 4. Update batch filtering in the dialog
Currently all batches are listed. Change to:
- When `scheduleType === 'daily_checkin'`: show only batches with `purpose === 'wellness'`
- When `scheduleType === 'survey'`: show only batches with `purpose === 'survey'`

### 5. Update schedule table display
- Add a "Type" column showing a badge (Daily Check-in / Survey)
- Show date range for survey-type schedules in the table

### 6. Update `resetForm` and `openEditDialog`
- Include `scheduleType`, `startDate`, `endDate` in form reset/load logic

### 7. Translation keys
Add to both `en.json` and `ar.json`:
- `schedules.scheduleType` / `schedules.dailyCheckin` / `schedules.survey`
- `schedules.startDate` / `schedules.endDate`
- `schedules.selectType` / `schedules.dateRangeRequired`

## Technical Notes
- The existing `purpose` field on batches (`useQuestionBatches`) already differentiates between `survey` and `wellness`, so no batch-side changes are needed
- The schedule engine edge function does not need changes at this stage -- it reads from `question_schedules` and processes whatever batches are linked
- Existing schedules will default to `daily_checkin` type via the column default, maintaining backward compatibility

