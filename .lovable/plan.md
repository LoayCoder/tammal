

# Survey System End-to-End Integration Fix Plan

## Identified Gaps

After thorough investigation, here are ALL the issues preventing the Survey System tabs/pages from being fully functional end-to-end:

---

## Gap 1: Missing i18n Keys (Both Systems)

### Employee Survey Page (`EmployeeSurvey.tsx`) -- 8 missing keys
The survey page references many translation keys that don't exist in `en.json` or `ar.json`:

- `survey.noProfile` -- shown when employee has no profile
- `survey.contactAdmin` -- below noProfile message
- `survey.noMoreQuestions` -- when all questions answered
- `survey.stronglyDisagree` -- Likert scale label (value 1)
- `survey.stronglyAgree` -- Likert scale label (value 5)
- `survey.typeYourAnswer` -- open-ended placeholder
- `survey.nextQuestion` -- next button text
- `survey.responseSubmitted` -- used in `useEmployeeResponses` hook
- `common.yes` -- yes/no question type
- `common.no` -- yes/no question type

### Arabic translations
The `ar.json` file also needs matching Arabic keys for both `survey.*` and `wellness.*` namespaces.

---

## Gap 2: Employee Survey & Daily Checkin Outside MainLayout

Both `/employee/survey` and `/employee/wellness` routes are defined **outside** the `MainLayout` wrapper (lines 60-61 in `App.tsx`). This means:
- No sidebar navigation
- No header
- No way for users to navigate back

**Fix**: Move both routes inside the `MainLayout` route group so employees get the full navigation experience.

---

## Gap 3: `as any` Type Casting in Wellness Hooks

The wellness hooks (`useDailyWellnessQuestions`, `useGamification`, `useQuestionBatchManagement`, `useWellnessScheduleSettings`) all use `.from('table_name' as any)` because the Supabase types file hasn't been regenerated with the new tables. This works at runtime but:
- Loses type safety
- No autocomplete in the IDE
- Error-prone for future changes

**Fix**: The types file should auto-regenerate after the migration was applied. If not, we should just ensure the `as any` casts don't cause runtime issues (they won't -- this is cosmetic).

---

## Gap 4: DailyCheckin `mood_entries` Insert Missing Type Safety

In `DailyCheckin.tsx` line 79, `.from('mood_entries' as any).insert(...)` bypasses type checking. The insert payload should be verified against the actual table schema. The current code looks correct structurally but has no compile-time safety.

---

## Gap 5: ScheduleManagement "Create Schedule" Button Does Nothing

In `ScheduleManagement.tsx` (line 52-55), the "Create Schedule" button has no `onClick` handler -- it renders a Button with no action. The `useQuestionSchedules` hook has a `createSchedule` mutation but no dialog/form to collect schedule data.

**Fix**: Add a schedule creation dialog with fields for name, frequency, preferred time, target audience, and active categories.

---

## Gap 6: BatchManagement Missing AI Generation Integration

The `BatchManagement.tsx` "Generate Batch" dialog only creates an empty batch record (with `status: 'draft'` and a question count). It does NOT trigger AI question generation. There's no edge function for `ai-generate-wellness-pool` and no client-side integration to populate the batch with actual wellness questions.

**Fix**: Either:
- (a) Create an `ai-generate-wellness-pool` edge function that generates wellness questions and inserts them into `wellness_questions` with the batch_id, OR
- (b) Integrate with the existing `generate-questions` edge function adapted for wellness question types

Option (a) is cleaner since wellness questions have a different schema (`question_text_en/ar`, `scale/multiple_choice/text` types).

---

## Gap 7: BatchManagement Missing "Review" Action

The batch table has Publish and Schedule actions but no "Review" action to view the questions inside a batch. The `useQuestionBatchManagement` hook has a `fetchQuestions` helper but the UI doesn't use it.

**Fix**: Add an expandable row or dialog to preview questions within a batch before publishing.

---

## Implementation Order

### Step 1: i18n Keys (Both `en.json` and `ar.json`)
Add all missing translation keys for the survey and wellness systems.

### Step 2: Route Layout Fix
Move `/employee/survey` and `/employee/wellness` inside the `MainLayout` route group.

### Step 3: Schedule Creation Dialog
Add a dialog form for creating new schedules on the Schedule Management page.

### Step 4: AI Wellness Question Generation Edge Function
Create `ai-generate-wellness-pool` edge function that:
- Accepts `{ batchId, count, tenantId }`
- Uses `google/gemini-3-flash-preview` with Tool Calling to generate bilingual wellness questions
- Inserts generated questions into `wellness_questions` table with the batch_id
- Updates the batch `question_count`

### Step 5: Batch Management UI Enhancements
- Wire the "Generate Batch" dialog to trigger AI generation after creating the batch record
- Add a "Review" dialog/expandable row to preview batch questions
- Show loading state during AI generation

### Step 6: Type Safety Cleanup
Remove `as any` casts where possible (depends on types regeneration).

---

## Technical Details

### New Edge Function: `ai-generate-wellness-pool`

```text
Input: { batchId, count, tenantId }
Model: google/gemini-3-flash-preview via Lovable AI Gateway
Output: Inserts `count` wellness questions into wellness_questions table

Tool Calling schema for strict JSON:
- question_text_en (string)
- question_text_ar (string)  
- question_type (enum: scale, multiple_choice, text)
- options (array of strings, only for multiple_choice)
```

### Schedule Creation Dialog Fields
- Name (text, required)
- Description (text, optional)
- Frequency (select: daily, twice daily, 3x/week, weekly, custom)
- Preferred Time (time picker)
- Target Audience (radio: all employees / specific departments)
- Questions Per Delivery (number, 1-5)
- Avoid Weekends (switch)

### Missing i18n Keys Summary

| Namespace | Key | English | Arabic |
|-----------|-----|---------|--------|
| common | yes | Yes | نعم |
| common | no | No | لا |
| survey | noProfile | No Employee Profile | لا يوجد ملف موظف |
| survey | contactAdmin | Contact your administrator | تواصل مع المسؤول |
| survey | noMoreQuestions | No more questions for now | لا مزيد من الأسئلة حالياً |
| survey | stronglyDisagree | Strongly Disagree | غير موافق بشدة |
| survey | stronglyAgree | Strongly Agree | موافق بشدة |
| survey | typeYourAnswer | Type your answer... | اكتب إجابتك... |
| survey | nextQuestion | Next Question | السؤال التالي |
| survey | responseSubmitted | Response submitted | تم إرسال الإجابة |

### Files Changed Summary

| Category | Files | Count |
|----------|-------|-------|
| i18n | en.json, ar.json | 2 |
| Routes | App.tsx | 1 |
| Edge Functions | ai-generate-wellness-pool (new) | 1 |
| Pages | ScheduleManagement.tsx, BatchManagement.tsx | 2 |
| Config | supabase/config.toml | 1 |
| Total | | ~7 files |

