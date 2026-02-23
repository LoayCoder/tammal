

# Schedule Management Enhancement: Questions Per Delivery Controls Questions Per Mood

## Overview
Link the "Questions Per Delivery" setting in Schedule Management to automatically set the default "Questions Per Mood" for all mood levels. Admins can still override individual moods, with clear visual indicators showing default vs. customized states.

## How It Works

1. When creating/editing a **Daily Check-in** schedule, changing "Questions Per Delivery" will show a new collapsible section: **"Questions Per Mood Configuration"**
2. All moods default to the global value (Questions Per Delivery)
3. Admins can toggle individual moods to "custom" and set a different value
4. A badge shows "Default" or "Customized" next to each mood
5. On save, the system updates the `mood_question_configs` table for each mood

## Technical Details

### Database: Add column to `mood_question_configs`
Add an `is_custom_override` boolean column (default `false`) to track whether a mood's `max_questions` was manually overridden vs inherited from the schedule global.

```sql
ALTER TABLE mood_question_configs
ADD COLUMN is_custom_override boolean NOT NULL DEFAULT false;
```

### File: `src/pages/admin/ScheduleManagement.tsx`

**1. Add mood config state and imports:**
- Import `useMoodQuestionConfig` and `useMoodDefinitions`
- Add local state for per-mood overrides: `moodOverrides: Record<string, { enabled: boolean; value: number }>`

**2. Add "Questions Per Mood" collapsible section (only for `daily_checkin` type):**
- Placed below the Questions Per Delivery stepper
- Shows all active moods with their emoji and label
- Each mood row shows:
  - Mood emoji + label
  - A "Default" or "Customized" badge
  - The current value (inherited or overridden)
  - A toggle to enable/disable override
  - A stepper (min: 1, max: `questionsPerDelivery`) when override is enabled
- Validation: individual mood value cannot exceed `questionsPerDelivery`

**3. Update `questionsPerDelivery` change handler:**
- When admin changes the global value, reset all non-overridden moods to match
- If a mood's override value exceeds the new global, clamp it down

**4. Update `handleSubmit`:**
- After saving the schedule, upsert each mood's config in `mood_question_configs`:
  - If not overridden: set `max_questions = questionsPerDelivery`, `is_custom_override = false`
  - If overridden: set `max_questions = overriddenValue`, `is_custom_override = true`

**5. Update `openEditDialog`:**
- Load existing mood configs and populate the override state from `mood_question_configs` data

**6. Update `resetForm`:**
- Clear `moodOverrides` state

### File: `src/hooks/useMoodQuestionConfig.ts`

- Add `is_custom_override` to the `MoodQuestionConfig` interface
- Include it in the upsert mutation payload and default config generation

### File: `src/components/checkin/MoodPathwayQuestions.tsx`

No changes needed -- it already reads `max_questions` from `mood_question_configs`, so updates made by the schedule form will automatically take effect.

### Validation Rules
- Questions Per Mood cannot exceed Questions Per Delivery (clamped in UI)
- Questions Per Mood minimum is 1
- Questions Per Delivery maximum remains 10
- When Questions Per Delivery is reduced, any overridden mood value exceeding the new global is automatically clamped

### UI Visual Indicators
- **Default state**: Gray "Default" badge, value shows inherited number, stepper disabled
- **Customized state**: Primary-colored "Customized" badge, stepper enabled with custom value
- **Toggle**: Small switch per mood row to enable/disable override
- **Info text**: "Moods inherit the global Questions Per Delivery value unless overridden"

