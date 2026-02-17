

## Wellness Check-in Full Audit and Enhancement

### Issues Found

1. **No duplicate check-in guard** -- The user can submit multiple mood entries for the same day. Today's data already shows one entry, yet the form still appears. There is no check against `mood_entries` for `entry_date = today`.

2. **Question type mismatch** -- Wellness questions use type `scale`, but `ScheduledQuestionsStep` only handles `numeric_scale`, `likert_5`, `yes_no`, `open_ended`, `multiple_choice`. When a `scale`-type question arrives from `wellness_questions` via the scheduled pipeline, it falls through to a plain textarea instead of a slider.

3. **Stale scheduled questions** -- After submitting the check-in, the 2 scheduled questions for today remain `pending` in the database. The mood entry was saved but the scheduled question responses were never submitted (likely because the user skipped the scheduled step or it wasn't properly wired).

4. **Wellness question and scheduled questions can overlap** -- The daily wellness question (from `daily_question_schedule`) and scheduled questions (from `scheduled_questions`) can reference the same `wellness_questions` row, causing the user to see it twice.

5. **UI lacks micro-interactions and modern feel** -- No animated transitions between steps, no confetti or haptic feedback on selection, progress indicator is minimal.

---

### Plan

#### 1. Add "Already Checked In Today" Guard
- In `DailyCheckin.tsx`, query `mood_entries` for `employee_id + entry_date = today`.
- If an entry exists, show the `CheckinSuccess` screen immediately with today's data (streak, points, AI tip) and a message "You've already completed today's check-in."
- This prevents duplicate submissions at the UI level.

#### 2. Fix Question Type Mapping
- In `ScheduledQuestionsStep.tsx`, add `case 'scale':` as an alias for `numeric_scale` in the `renderInput` switch.
- In `WellnessQuestionStep.tsx`, verify the `scale` type renders a slider (it already does -- confirmed).
- In `submit-response/index.ts`, add `case 'scale':` to the `validateAnswer` function so it validates like `numeric_scale` (1-10 range).

#### 3. Deduplicate Wellness vs Scheduled Questions
- In `useCheckinScheduledQuestions.ts`, after fetching today's scheduled questions, filter out any question whose `question_id` matches the daily wellness question ID (passed as a parameter or fetched alongside).
- This prevents the same question appearing in both the Wellness step and the Scheduled step.

#### 4. Enhanced UI/UX
- **Animated step transitions**: Wrap each step in a CSS `animate-in` fade+slide using Tailwind's `animate-fade-in` or a simple `transition-all` with conditional rendering.
- **Mood selection micro-interaction**: Add a brief scale-up animation (`animate-[pop_0.3s_ease]`) when a mood is selected, plus a subtle background pulse.
- **Progress indicator upgrade**: Replace dots with a sleek segmented bar showing step labels (Mood, Question, Survey, Submit) with color fill animation.
- **Answer selection feedback**: Add checkmark icons and color transitions when an answer option is selected in radio groups and scales.
- **Success screen enhancement**: Add a confetti-style emoji burst animation, and display a motivational quote alongside the AI tip.
- **Card hover states**: Add `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200` to interactive cards.

#### 5. Error Handling Improvements
- Show inline error banners (not just toasts) if the submission fails, with a retry button.
- If the employee profile is missing, show a clear "Profile not found" card with guidance.
- If no questions are available, show a friendly illustration instead of plain text.

---

### Technical Details

**Files to modify:**

| File | Changes |
|------|---------|
| `src/pages/employee/DailyCheckin.tsx` | Add today's mood entry query, show "already done" state, animated transitions, improved progress bar |
| `src/components/checkin/MoodStep.tsx` | Add pop animation on select, enhanced visual feedback |
| `src/components/checkin/WellnessQuestionStep.tsx` | Add answer feedback animations, improved empty state |
| `src/components/checkin/ScheduledQuestionsStep.tsx` | Add `scale` case, answer selection animations, back button |
| `src/components/checkin/CheckinSuccess.tsx` | Enhanced success animation, show "already done" variant |
| `src/components/checkin/SupportStep.tsx` | Hover micro-interactions on action cards |
| `src/hooks/useCheckinScheduledQuestions.ts` | Accept wellness question ID param, filter duplicates |
| `supabase/functions/submit-response/index.ts` | Add `scale` to validation function |

**No database changes required** -- all fixes are in application logic and edge functions.

