

# Fix: Mood Pathway Questions - Type-Aware Rendering and Count Control

## Problem Summary

Two issues identified in the Mood Follow-up section of the Daily Check-in:

1. **All questions render as free-text textareas** regardless of their actual type (`numeric_scale`, `yes_no`, `likert_5`). The component only distinguishes between "has options = radio buttons" vs "no options = textarea", ignoring the question's `type` field entirely.

2. **Too many questions appear** -- the `useMoodPathwayQuestions` hook defaults to `maxQuestions = 2`, but this is hardcoded and doesn't respect the pathway configuration or schedule settings.

## Root Cause

In `MoodPathwayQuestions.tsx`, the rendering logic at line 154 is:
```
options.length > 0 ? <RadioGroup> : <Textarea>
```

This ignores `q.type`. For example, a `numeric_scale` question has `options: []`, so it incorrectly falls back to a textarea instead of showing a 1-10 slider.

## Plan

### 1. Add type-aware rendering to `MoodPathwayQuestions.tsx`

Replace the simple "options vs textarea" check with a proper `renderPathwayInput` function that handles all 5 question types, matching the same pattern used in `renderScheduledInput` inside `InlineDailyCheckin.tsx`:

| Question Type | UI Control |
|---|---|
| `likert_5` | 5-point radio scale with labels (Strongly Disagree to Strongly Agree) |
| `numeric_scale` / `scale` | Slider (1-10) with value display |
| `yes_no` | Two buttons: Yes / No |
| `multiple_choice` | Radio group with bilingual option labels |
| `open_ended` (default) | Textarea |

For discrete inputs (`likert_5`, `yes_no`, `multiple_choice`), auto-advance after selection with a 400ms delay to match the check-in flow pattern.

### 2. Respect `maxQuestions` from pathway config

Update `useMoodPathwayQuestions` to accept a dynamic `maxQuestions` parameter. In `MoodPathwayQuestions.tsx`, read the mood config to determine how many questions to show (defaulting to 2 if not configured), and pass it to the hook.

## Technical Details

### File: `src/components/checkin/MoodPathwayQuestions.tsx`

- Import `Slider` component
- Create a `renderPathwayInput(question, answer, onSelect, isRTL, t)` helper function handling all 5 types
- Replace the existing options check (lines 153-197) with a call to `renderPathwayInput`
- For `multiple_choice` and `likert_5` with bilingual object options, resolve the display text using the existing `isRTL` logic
- Ensure `yes_no` questions with object options `{text, text_ar}` are handled as buttons, not radio groups

### File: `src/hooks/useMoodPathwayQuestions.ts`

- No structural change needed -- the `maxQuestions` parameter already exists and defaults to 2, which is correct for mood pathway follow-ups

