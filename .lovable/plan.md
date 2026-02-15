

# Enhanced Daily Check-in: Unified Mood + Wellness Questions Flow

## Overview

Currently, the Daily Check-in (`/employee/wellness`) only captures a mood rating and a single wellness question from the `daily_question_schedule` table. Meanwhile, scheduled survey questions (from `scheduled_questions` / `questions` tables) are handled on a completely separate page (`/employee/survey`). The enhancement merges these into one seamless flow.

## Architecture

The enhanced Daily Check-in will work as a multi-step flow:

```text
Step 1: Mood Rating (mandatory)
    |
Step 2: Daily Wellness Question (from wellness_questions table, if available)
    |
Step 3: Scheduled Batch Questions (from scheduled_questions with delivered/pending status)
    |
Step 4: Optional Comment + Support Actions (for low mood)
    |
Submit All --> mood_entries + employee_responses (via submit-response edge fn)
```

## Technical Changes

### 1. New Hook: `useCheckinScheduledQuestions`

Create `src/hooks/useCheckinScheduledQuestions.ts` that fetches pending/delivered `scheduled_questions` for the current employee, filtered to only today's scheduled deliveries. This avoids duplicating the full survey hook and focuses on the check-in context.

- Queries `scheduled_questions` joined with `questions` and `question_categories`
- Filters: `employee_id`, `status IN ('pending', 'delivered')`, `scheduled_delivery <= now()`
- Returns the questions with their type, text, text_ar, options, and category metadata
- Uses existing RLS policies (employees can view their own scheduled questions)

### 2. Rewrite `DailyCheckin.tsx` as a Multi-Step Flow

Replace the current single-page layout with a step-based flow:

**Step 1 - Mood Selection** (mandatory, always shown first)
- Keep the existing 5-mood selector
- User must select a mood before proceeding

**Step 2 - Daily Wellness Question** (from `wellness_questions` via existing `useDailyWellnessQuestions`)
- Same as today: scale/multiple_choice/text question
- If no wellness question is available, this step is skipped automatically

**Step 3 - Scheduled Batch Questions** (from `scheduled_questions`)
- Fetch using the new hook
- Render each question using the same answer input components as EmployeeSurvey (likert_5, numeric_scale, yes_no, open_ended, multiple_choice)
- User progresses through each question one at a time with Next/Skip buttons
- Track answer per question in local state

**Step 4 - Support Actions + Comment** (shown if mood is low, otherwise just comment)

**Submit button** triggers:
1. Insert `mood_entries` record (mood + daily wellness answer)
2. For each scheduled question answer, call `submit-response` edge function (reuse existing `useEmployeeResponses.submitResponse`)
3. Invalidate relevant query caches
4. Show gamification result + AI tip

### 3. State Management

All answers are collected in local state before final submission:

```text
{
  mood: { level, score },
  wellnessAnswer: { questionId, value, text },
  scheduledAnswers: [
    { scheduledQuestionId, answerValue, answerText, responseTimeSeconds }
  ],
  supportActions: string[],
  comment: string
}
```

### 4. Validation Rules

- Mood selection is mandatory (blocks progression)
- Daily wellness question answer is optional (can skip)
- Scheduled questions can be answered or skipped individually
- Duplicate prevention: check `mood_entries` for today's date before showing the form; check `scheduled_questions.status` to only show unanswered ones

### 5. Deduplication Logic

- Daily wellness question: cached by date in localStorage; `mood_entries` checked for `entry_date = today`
- Scheduled questions: only `pending`/`delivered` status are shown; once answered via `submit-response`, status changes to `answered` and they disappear from the list

### 6. Dashboard Reflection

Responses saved via the existing `submit-response` edge function already write to `employee_responses` and update `scheduled_questions.status` to `answered`. The admin dashboard's existing queries will automatically reflect these responses since they query the same tables.

### 7. Security

- All data writes go through authenticated channels (mood_entries has employee-based RLS; submit-response edge function verifies user ownership)
- Tenant isolation maintained through existing `tenant_id` columns and RLS policies
- No new tables or RLS changes needed

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useCheckinScheduledQuestions.ts` | Create | Fetch today's pending scheduled questions for employee |
| `src/pages/employee/DailyCheckin.tsx` | Rewrite | Multi-step flow: Mood -> Wellness Q -> Scheduled Qs -> Submit |
| `src/locales/en.json` | Update | Add new translation keys for step indicators |
| `src/locales/ar.json` | Update | Arabic translations for new keys |

## No Database Changes Required

All existing tables, RLS policies, and edge functions support this flow. The `scheduled_questions`, `employee_responses`, `mood_entries`, and `wellness_questions` tables already have the correct structure and security policies.

