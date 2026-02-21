

# Comprehensive End-to-End Pipeline Audit

## Scope

Traced every step: AI Generation -> Question Bank -> Schedule Engine -> Delivery Hook -> Rendering Components -> Submission (Edge Function) -> Database Storage.

---

## Remaining Issues Found

### Issue A: `InlineDailyCheckin.tsx` Uses Static `MOODS` Array for Score (BUG)

**Severity: HIGH -- causes silent submission failure for custom moods**

At line 77, `InlineDailyCheckin.tsx` still uses:
```
const moodObj = MOODS.find(m => m.level === selectedMood);
```

The static `MOODS` array only contains the 5 default mood keys. If a tenant admin adds a custom mood (e.g., `"exhausted"`) via the Mood Definitions settings, `moodObj` will be `null`, which blocks submission entirely (`if (!selectedMood || !moodObj) return;` at line 110).

**This was fixed in `DailyCheckin.tsx` (multi-step) but NOT in `InlineDailyCheckin.tsx` (the primary inline flow used on the Employee Home page).**

**Fix:** Import `useMoodDefinitions` and look up the score dynamically, matching the pattern already used in `DailyCheckin.tsx`.

---

### Issue B: `InlineDailyCheckin.tsx` `renderScheduledInput` Hardcodes `isRTL = false` (BUG)

**Severity: MEDIUM -- Arabic users see English option labels in scheduled questions**

At line 445, the `resolveOpt` call passes `false` instead of `isRTL`:
```
const label = resolveOpt(opt, false);  // <-- hardcoded false!
```

The component already computes `isRTL` at line 39, but it is not passed into the standalone `renderScheduledInput` function.

**Fix:** Pass `isRTL` to the `renderScheduledInput` function and use it in the `resolveOpt` call.

---

### Issue C: `EmployeeSurvey.tsx` Missing `multiple_choice` Rendering and Bilingual Support (BUG)

**Severity: HIGH -- survey questions with `multiple_choice` type render nothing**

The `EmployeeSurvey` page (standalone survey route) renders `null` for `multiple_choice` because it has no `case 'multiple_choice':` in its `renderAnswerInput` switch statement. The switch only handles `likert_5`, `numeric_scale`, `yes_no`, and `open_ended`. Additionally, it has no `resolveOption` helper for bilingual options.

It also does not handle `scale` or `text` type aliases from `wellness_questions`.

**Fix:** Add `multiple_choice`, `scale`, and `text` cases to `EmployeeSurvey.tsx`'s `renderAnswerInput`, with bilingual option resolution.

---

### Issue D: `EmployeeSurvey.tsx` `yes_no` Validation Mismatch (BUG)

**Severity: MEDIUM -- `yes_no` answers may fail validation**

`EmployeeSurvey.tsx` submits `yes_no` as `boolean` (`true`/`false`), which matches the edge function validator. However, `MoodPathwayQuestions.tsx` submits `yes_no` as string labels (`"Yes"` / `"No"` or Arabic equivalents). The edge function validator at line 211 strictly checks `typeof value !== "boolean"` for `yes_no`. This means pathway `yes_no` answers will be rejected.

**Fix:** Update the `validateAnswer` function in `submit-response/index.ts` to also accept string values for `yes_no` (since pathway questions submit labels, not booleans).

---

### Issue E: `useScheduledQuestions.ts` (Survey Hook) Missing `generated_questions` Source Handling (GAP)

**Severity: MEDIUM -- survey questions from generated_questions show without details**

The `useScheduledQuestions` hook (used by EmployeeSurvey page) only fetches from `questions` table and `wellness_questions` table (line 74-109). It treats any `question_source !== 'questions'` as wellness. But the schedule engine can assign `generated_questions` source too (line 107 of schedule-engine). These will be fetched from `wellness_questions` instead of `generated_questions`, resulting in null question details.

**Fix:** Add a separate fetch path for `generated_questions` source, matching the pattern already implemented in `useCheckinScheduledQuestions.ts`.

---

### Issue F: Mood Pathway Answers NOT Submitted to `submit-response` Edge Function (DATA GAP)

**Severity: LOW -- by design, but worth documenting**

Mood pathway answers are stored in `mood_entries.answer_value` as a JSON object (line 130-133 of InlineDailyCheckin), NOT through the `submit-response` edge function. This means they bypass the type validation and are not recorded in `employee_responses`. This is intentional -- pathway answers are part of the mood check-in flow, not the scheduled question system. No fix needed, but the data lives in a different table than scheduled question responses.

---

### Issue G: `WellnessQuestionStep.tsx` Missing `yes_no` Type Handling (BUG)

**Severity: MEDIUM -- `yes_no` wellness questions render nothing**

The component only handles `scale`/`numeric_scale`, `multiple_choice`, and `text`. If a wellness question has `question_type = 'yes_no'`, no UI renders. Although `wellness_questions` typically use simplified types (`scale`, `text`, `multiple_choice`), it is possible for a question to have `yes_no` type.

**Fix:** Add a `yes_no` case to `WellnessQuestionStep.tsx`.

---

## Implementation Plan

### Step 1: Fix `InlineDailyCheckin.tsx` (Issues A and B)

- Import `useMoodDefinitions` hook
- Fetch tenant's mood definitions and use dynamic score lookup instead of static `MOODS.find()`
- Pass `isRTL` to `renderScheduledInput` function
- Update `resolveOpt` call at line 445 to use `isRTL` parameter

### Step 2: Fix `EmployeeSurvey.tsx` (Issue C)

- Add `resolveOption` helper for bilingual support
- Add `multiple_choice` case with RadioGroup and bilingual options
- Add `scale` alias for `numeric_scale`
- Add `text` alias for `open_ended`

### Step 3: Fix `submit-response` edge function (Issue D)

- Update `yes_no` validation to accept both `boolean` and `string` values
- This ensures pathway-submitted labels and survey-submitted booleans both pass

### Step 4: Fix `useScheduledQuestions.ts` (Issue E)

- Add separate fetch path for `generated_questions` source
- Map `question_text` / `question_text_ar` to `text` / `text_ar` for consistency

### Step 5: Fix `WellnessQuestionStep.tsx` (Issue G)

- Add `yes_no` case with Yes/No buttons matching the pattern in other components

---

## Technical Details

### InlineDailyCheckin.tsx changes

```text
// Replace:
import { MoodStep, MOODS } from '@/components/checkin/MoodStep';
const moodObj = MOODS.find(m => m.level === selectedMood);

// With:
import { MoodStep } from '@/components/checkin/MoodStep';
import { useMoodDefinitions } from '@/hooks/useMoodDefinitions';
const { moods: moodDefinitions } = useMoodDefinitions(tenantId);
const moodDef = moodDefinitions?.find(m => m.key === selectedMood);
const moodObj = moodDef ? { level: moodDef.key, score: moodDef.score } : null;
```

### renderScheduledInput signature change

```text
// Add isRTL parameter:
function renderScheduledInput(question, answer, setAnswer, selectAndAdvance, t, isRTL)

// Fix resolveOpt call:
const label = resolveOpt(opt, isRTL);  // was: resolveOpt(opt, false)
```

### submit-response validateAnswer update

```text
case "yes_no":
  // Accept boolean OR string labels
  if (typeof value !== "boolean" && typeof value !== "string") {
    return { valid: false, error: "Yes/No value must be a boolean or string" };
  }
  break;
```

### Files to modify

1. `src/components/checkin/InlineDailyCheckin.tsx` (Issues A, B)
2. `src/pages/employee/EmployeeSurvey.tsx` (Issue C)
3. `supabase/functions/submit-response/index.ts` (Issue D)
4. `src/hooks/useScheduledQuestions.ts` (Issue E)
5. `src/components/checkin/WellnessQuestionStep.tsx` (Issue G)

