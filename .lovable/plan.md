

# Unify Mood Follow-up Question Count with Admin Settings

## What Changes

Currently, the mood pathway follow-up count is hardcoded to `maxQuestions = 2` in the hook. This plan adds a **"Questions Per Mood"** setting to each mood card in the Mood Pathway Settings page (`/admin/mood-pathways`), stored in the `mood_question_configs` table. The check-in flow will read this setting dynamically instead of using the hardcoded default.

Additionally, the "Questions Per Delivery" input in Schedule Management will be changed to a proper stepper input with up/down arrow buttons.

---

## Step 1: Database Migration

Add a `max_questions` column to the `mood_question_configs` table:

```text
ALTER TABLE mood_question_configs 
ADD COLUMN max_questions integer NOT NULL DEFAULT 2;
```

This stores how many follow-up questions to show per mood level. Default is 2 (current behavior).

---

## Step 2: Update `useMoodQuestionConfig.ts`

- Add `max_questions: number` to the `MoodQuestionConfig` interface
- Include `max_questions` in the default config fallback (default: 2)
- Include `max_questions` in the upsert mutation

---

## Step 3: Update `MoodPathwaySettings.tsx`

Add a "Questions Per Mood" number input (stepper with up/down arrows) to each mood pathway card, between the "Enable Free Text" toggle and the "Linked Questions" section.

The input will:
- Min: 1, Max: 10
- Use a styled stepper with minus/plus buttons (matching the requested arrow up/down pattern)
- Be disabled when the pathway is disabled

---

## Step 4: Wire Dynamic Count Through the Check-in Flow

**`MoodPathwayQuestions.tsx`:**
- Read `max_questions` from the mood config (already fetches `useMoodQuestionConfig`)
- Pass it to `useMoodPathwayQuestions` instead of the hardcoded `2`

**`useMoodPathwayQuestions.ts`:**
- No changes needed -- it already accepts `maxQuestions` as a parameter

---

## Step 5: Fix "Questions Per Delivery" Input in `ScheduleManagement.tsx`

Replace the plain `<Input type="number">` with a styled stepper component featuring:
- A minus button on the left
- The number display in the center
- A plus button on the right
- Min: 1, Max: 10

---

## Files to Modify

| Action | File |
|---|---|
| Migration | Add `max_questions` column to `mood_question_configs` |
| Modify | `src/hooks/useMoodQuestionConfig.ts` |
| Modify | `src/pages/admin/MoodPathwaySettings.tsx` |
| Modify | `src/components/checkin/MoodPathwayQuestions.tsx` |
| Modify | `src/pages/admin/ScheduleManagement.tsx` |

