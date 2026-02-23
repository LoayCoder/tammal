

# Unify Schedule Engine with Mood Pathway for Daily Check-in

## The Problem Today

The daily check-in currently shows **two separate question sections**:

1. **Mood Follow-up** (Mood Pathway) -- pulls random questions from the `questions` bank filtered by the selected mood's `mood_levels` tag. Controlled by `mood_question_configs.max_questions`.
2. **Scheduled Questions** -- pre-delivered by the schedule engine from batches, with **no mood awareness**. These appear as a second "Question 0/2" section.

This causes duplication and confusion. The user wants **one unified flow**: after selecting a mood, only mood-relevant questions appear, all governed by the schedule + mood config system.

## How It Will Work After the Fix

1. The **Scheduled Questions section is removed** from the daily check-in UI entirely.
2. The **Mood Pathway section becomes the single source** of follow-up questions.
3. Mood Pathway questions continue to be fetched from the `questions` bank filtered by the `mood_levels` column, limited by `mood_question_configs.max_questions`.
4. The schedule engine's `daily_checkin` type now only serves as a **gate** (does an active schedule exist?) rather than pre-delivering individual questions. This is already how `useMoodPathwayQuestions` works -- it checks for active schedules before querying.
5. Responses to Mood Pathway questions are saved directly into `mood_entries.answer_value` (as they already are), not through the `scheduled_questions` / `employee_responses` pipeline.

## Technical Changes

### 1. `src/components/checkin/InlineDailyCheckin.tsx`

**Remove all Scheduled Questions logic:**
- Remove import of `useCheckinScheduledQuestions`
- Remove import of `ScheduledAnswer` type
- Remove `scheduledQuestions`, `scheduledLoading` variables
- Remove `sqIndex`, `sqAnswer`, `sqAnswers`, `sqStartTime` state
- Remove `saveSqAndAdvance`, `sqSelectAndAdvance` functions
- Remove the entire "Scheduled Questions" UI section (lines 227-271)
- Remove `renderScheduledInput` helper function (lines 325-406)
- Remove scheduled question submission logic from `handleSubmit` (the loop that calls `submitResponse.mutateAsync` and the skipped question update)
- Remove `allSqAnswered` / `canSubmit` guards -- submit is enabled when mood is selected
- Remove related imports: `ClipboardList`, `SkipForward`, `Progress`, `ScheduledAnswer`, `CheckinScheduledQuestion`

**Keep intact:**
- Mood selection (MoodStep)
- Mood Pathway Questions (MoodPathwayQuestions component)
- Optional comment textarea
- Submit button and gamification logic

### 2. `src/pages/employee/DailyCheckin.tsx` (multi-step version)

**Remove Scheduled Questions step:**
- Remove `useCheckinScheduledQuestions` import and hook call
- Remove `ScheduledQuestionsStep` import and component usage
- Remove `scheduledAnswers` state
- Remove the `scheduled` step from the steps array
- Remove scheduled question submission from `handleSubmit`
- The flow becomes: Mood -> Support -> Submit (two steps only)

### 3. No changes needed to:
- `useMoodPathwayQuestions.ts` -- already works correctly, checks for active schedule as gate
- `useMoodQuestionConfig.ts` -- already controls max questions per mood
- `MoodPathwayQuestions.tsx` -- already renders mood-filtered questions
- Schedule engine -- continues to manage schedules; `daily_checkin` schedules serve as the activation gate
- `useCheckinScheduledQuestions.ts` -- kept for potential survey use, just no longer called from daily check-in

### 4. Localization cleanup

Remove or repurpose unused keys:
- `wellness.scheduledQuestion` -- no longer shown in daily check-in
- `wellness.allCompleted` -- no longer needed in daily check-in context

## Data Flow After Change

```text
User selects mood (e.g., "Great")
       |
       v
MoodPathwayQuestions component
       |
       +--> Checks: active daily_checkin schedule exists? (gate)
       |
       +--> Reads mood_question_configs for max_questions (e.g., 1)
       |
       +--> Queries questions table WHERE mood_levels @> ["great"]
       |
       +--> Shows N questions (N = max_questions from config)
       |
       v
User answers + submits
       |
       +--> Saves to mood_entries (mood + pathway answers + comment)
       +--> Gamification points awarded
```

## What This Means for Admins

- **Questions Per Delivery** in Schedule Management controls the default `max_questions` per mood (as built in the previous enhancement)
- **Questions Per Mood** overrides allow fine-tuning per mood level
- Questions must have the appropriate `mood_levels` tags in the Question Bank to appear as follow-ups
- The schedule itself acts as an on/off switch for the entire mood pathway feature

