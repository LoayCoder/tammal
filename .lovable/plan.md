

# Deep Audit: Generation-to-Submission Pipeline

## Findings Summary

After tracing every file from AI generation through schedule delivery to employee submission, I identified **7 issues** across the pipeline. Some are bugs, some are data integrity gaps.

---

## Issue 1: Bilingual Options Not Resolved in Multiple Components

**Severity: HIGH (causes crash or shows `[object Object]`)**

The `questions` table stores options as `{text, text_ar}` objects. Several rendering paths cast them directly to `string[]` without resolving the bilingual format:

| Component | Location | Status |
|---|---|---|
| `MoodPathwayQuestions.tsx` | `renderPathwayInput` | FIXED (resolved recently) |
| `ScheduledQuestionsStep.tsx` | `renderInput` line 138 | BUG - casts `question.options as string[]` |
| `InlineDailyCheckin.tsx` | `renderScheduledInput` line 433 | BUG - casts `question.options as string[]` |
| `WellnessQuestionStep.tsx` | `renderWellnessInput` lines 65-71 | BUG - renders `opt` directly as JSX child |

**Fix:** Add the `resolveOption` helper to each component to handle both `string` and `{text, text_ar}` formats before rendering.

---

## Issue 2: Wellness Type Mismatch Between Tables

**Severity: MEDIUM (causes wrong UI controls)**

The AI generator uses `mapToWellnessType()` which maps `likert_5` and `numeric_scale` to `scale`, and `open_ended` to `text` when saving to `wellness_questions`. But the rendering components only check for `scale` and `text`, not the original types.

| Table | Type Values | Notes |
|---|---|---|
| `questions` | `likert_5`, `numeric_scale`, `yes_no`, `multiple_choice`, `open_ended` | Standard 5 types |
| `wellness_questions` | `scale`, `text`, `multiple_choice` | Simplified 3 types |

When the `useCheckinScheduledQuestions` hook fetches from `wellness_questions`, it maps `question_type` to `type`. So a `scale` type from wellness correctly renders as a slider. This part works.

However, the `submit-response` edge function validates types using the original table's type:
- For `wellness_questions` source: validates against `question_type` (e.g., `scale`)
- But the `validateAnswer` function doesn't know about `scale` -- it only handles `numeric_scale`

**Fix:** Add `scale` as an alias for `numeric_scale` in the `validateAnswer` function in `submit-response/index.ts`. Also add `text` as an alias for `open_ended`.

---

## Issue 3: `likert_5` Questions with Empty Options in Questions Table

**Severity: LOW**

5 out of 8 `likert_5` questions in the `questions` table have bilingual option objects (correct), but 3 have empty `options: []`. For those 3, the `MoodPathwayQuestions` likert renderer uses hardcoded labels (Strongly Disagree - Strongly Agree), which is correct behavior. No action needed.

---

## Issue 4: `yes_no` Questions with Object Options

**Severity: MEDIUM**

2 out of 4 `yes_no` questions have `{text, text_ar}` options, and 2 have empty options. In `ScheduledQuestionsStep.tsx` and `InlineDailyCheckin.tsx`, the `yes_no` renderer uses hardcoded Yes/No labels and ignores the `options` array entirely. The `MoodPathwayQuestions` component correctly resolves them. The fix for Issue 1 covers this.

---

## Issue 5: Schedule Engine Doesn't Filter by `questions_per_delivery` Per Day

**Severity: MEDIUM (explains "3 questions when 1 expected")**

The schedule engine at line 234 selects `questionsPerDelivery` questions per delivery slot, but for a 7-day generation window it creates one slot per day. The issue is that `selectedQuestions` is sliced from the **full** unassigned pool each day, meaning over 7 days the employee accumulates 7 questions total. When the employee checks in, the hook fetches ALL pending questions for today, which may include questions scheduled for today's slot.

However, the user reported seeing 3 questions. This likely comes from the **mood pathway** system, not the scheduled questions. The `useMoodPathwayQuestions` hook defaults to `maxQuestions = 2`, plus the daily wellness question makes 3 total. The scheduled questions are separate.

**Root cause of "3 questions":** The user is likely seeing:
1. Daily wellness question (from `daily_question_schedule`)
2. Two mood pathway follow-up questions (from `useMoodPathwayQuestions`)

These are NOT from the schedule engine at all. The mood pathway questions are unlimited by the schedule's `questions_per_delivery` setting since they come from a different system.

**No fix needed for schedule engine.** The mood pathway `maxQuestions = 2` is intentional.

---

## Issue 6: `DailyCheckin.tsx` (Multi-Step) Still Uses Legacy `MOODS` Array

**Severity: LOW**

The `DailyCheckin.tsx` page references the static `MOODS` array to find `moodObj` for score lookup, but `MoodStep` now uses dynamic `mood_definitions` from the database. If an admin adds a custom mood level not in the static `MOODS` array, `moodObj` will be `null` and submission will silently fail.

**Fix:** Look up the mood score from `mood_definitions` instead of the static `MOODS` array.

---

## Issue 7: `submit-response` Edge Function Type Validation Gaps

**Severity: MEDIUM**

The `validateAnswer` function in the edge function is strict but doesn't account for:
- `scale` type (used by `wellness_questions`)
- `text` type (used by `wellness_questions`)
- `likert_5` with string option labels instead of numeric values (pathway questions submit option text, not numbers)

When a pathway `likert_5` answer is submitted as `"Agree"` (a string), the validator expects a number 1-5 and will reject it.

**Fix:** Update the validator to accept both numeric and string values for `likert_5`.

---

## Implementation Plan

### Step 1: Fix bilingual option rendering (Issue 1)

Add a shared `resolveOption` utility and use it in:
- `src/components/checkin/ScheduledQuestionsStep.tsx` (multiple_choice case)
- `src/components/checkin/InlineDailyCheckin.tsx` (both `renderScheduledInput` and `renderWellnessInput`)
- `src/components/checkin/WellnessQuestionStep.tsx` (multiple_choice rendering)

### Step 2: Fix submit-response validation (Issues 2 and 7)

Update `supabase/functions/submit-response/index.ts`:
- Add `scale` as alias for `numeric_scale`
- Add `text` as alias for `open_ended`
- Allow `likert_5` to accept string values (option labels) in addition to numbers

### Step 3: Fix DailyCheckin.tsx mood lookup (Issue 6)

In `src/pages/employee/DailyCheckin.tsx`, fetch `mood_definitions` and use the dynamic score instead of relying on the static `MOODS` array.

---

## Technical Details

### Shared resolveOption helper

```text
function resolveOption(
  opt: string | { text: string; text_ar?: string },
  isRTL: boolean
): string {
  if (typeof opt === 'string') return opt;
  return isRTL && opt.text_ar ? opt.text_ar : opt.text;
}
```

### Updated validateAnswer in submit-response

```text
case "likert_5":
  // Accept number 1-5 or string option labels
  if (typeof value === 'number' && (value < 1 || value > 5)) {
    return { valid: false, error: "..." };
  }
  break;
case "numeric_scale":
case "scale":
  // unified handling
  break;
case "open_ended":
case "text":
  // unified handling
  break;
```

### Files to modify

1. `src/components/checkin/ScheduledQuestionsStep.tsx`
2. `src/components/checkin/InlineDailyCheckin.tsx`
3. `src/components/checkin/WellnessQuestionStep.tsx`
4. `supabase/functions/submit-response/index.ts`
5. `src/pages/employee/DailyCheckin.tsx`

