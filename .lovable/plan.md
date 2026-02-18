
# Mood Pathway Implementation Audit — Findings & Fix Plan

## Audit Verdict

The implementation is **partially complete**. The database tables, edge function, admin settings page, i18n, routing, and sidebar are all correctly implemented. However, **one critical integration gap** and **two secondary issues** were identified during the review that prevent the feature from working as intended.

---

## Issues Found

### ISSUE-01 — CRITICAL: `MoodPathwayQuestions` Component Is Never Rendered

**File:** `src/components/checkin/InlineDailyCheckin.tsx`

**Diagnosis:** The component is imported on line 25 (`import { MoodPathwayQuestions, type PathwayAnswer } from '@/components/checkin/MoodPathwayQuestions'`) and `pathwayAnswers` state is declared on line 63. However, **the `<MoodPathwayQuestions ... />` JSX element is never placed anywhere in the render output** (lines 191–326). The entire JSX tree jumps from `<MoodStep>` directly to the Wellness Question section with no pathway component in between.

**Consequence:** The entire mood-specific AI question pathway feature is completely invisible to users. The edge function is never called. No questions are generated. No history is stored. The feature built in the last implementation does not function at all.

**Evidence:**
```
Search for 'MoodPathwayQuestions|pathwayAnswers|userId' in JSX body → 0 matches
```
The `userId` prop is declared in the interface but never used inside the component body.

---

### ISSUE-02 — CRITICAL: Edge Function Not Registered in `config.toml`

**File:** `supabase/config.toml`

**Diagnosis:** The `generate-mood-questions` edge function exists as a deployed file at `supabase/functions/generate-mood-questions/index.ts`, but it has **no entry in `supabase/config.toml`**. All other edge functions in the project have `verify_jwt = false` entries. Without this entry, the function runs with default JWT verification, which means calls from the frontend via `supabase.functions.invoke()` will be rejected with a 401 Unauthorized error when the anon token is used — or could fail silently depending on how the call is made.

**Evidence:** `supabase/config.toml` contains 13 other function entries but zero entries for `generate-mood-questions`.

---

### ISSUE-03 — MODERATE: `mood_question_history` RLS Has No INSERT Policy for Users

**Table:** `mood_question_history` (from the migration file)

**Diagnosis:** The migration creates three RLS policies:
- `SELECT` for own user
- `SELECT` for tenant admins
- `ALL` for super admins

There is **no INSERT policy for regular users or the service role bypass pattern**. The edge function uses the `SUPABASE_SERVICE_ROLE_KEY` to insert records, which bypasses RLS entirely — so the inserts themselves work. However, the missing INSERT policy for regular users means that if any future code attempts a client-side insert (e.g., for testing or alternative flows), it will silently fail with a policy violation. This is an inconsistency in the security model.

This is not causing a live bug (the edge function uses service role), but it is an architectural gap — the policy table has no user-facing INSERT path and the service role dependency is undocumented in the schema.

---

### ISSUE-04 — MINOR: `userId` Is Empty String When `user_id` Is Null

**File:** `src/pages/EmployeeHome.tsx` — Line 122

**Diagnosis:** The `InlineDailyCheckin` is rendered as:
```tsx
<InlineDailyCheckin
  employeeId={employee.id}
  tenantId={employee.tenant_id}
  userId={employee.user_id ?? ''}
/>
```

`employee.user_id` is typed as `string | null` in `useCurrentEmployee.ts`. When it is null (an employee record exists but has no linked auth user), `userId` becomes an empty string `''`. The edge function validates `if (!moodLevel || !tenantId || !userId)` — an empty string is falsy — so the edge function would return a 400 error. This scenario is rare but needs a guard.

---

## Fix Plan

### Fix 1 — Insert `<MoodPathwayQuestions>` into the check-in JSX (CRITICAL)

**File:** `src/components/checkin/InlineDailyCheckin.tsx`

Insert the `<MoodPathwayQuestions>` component into the JSX between `<MoodStep>` (step 1) and the Wellness Question section (step 2). Also ensure the `userId` prop flows correctly from the component interface into the rendered output.

The component should appear after mood selection and before the wellness question:

```tsx
{/* 1. Mood Selection */}
<MoodStep selectedMood={selectedMood} onSelect={setSelectedMood} />

{/* 2. AI Mood Pathway Questions — inserted HERE */}
{selectedMood && moodObj && (
  <MoodPathwayQuestions
    moodLevel={selectedMood}
    moodScore={moodObj.score}
    tenantId={tenantId}
    userId={userId}
    language={i18n.language}
    onAnswersChange={setPathwayAnswers}
  />
)}

{/* 3. Wellness Question — existing */}
{selectedMood && (question || questionLoading) && ( ... )}
```

---

### Fix 2 — Add `generate-mood-questions` to `supabase/config.toml` (CRITICAL)

**File:** `supabase/config.toml`

Add the missing function entry:

```toml
[functions.generate-mood-questions]
verify_jwt = false
```

This aligns the new function with all other edge functions in the project and prevents JWT verification failures.

---

### Fix 3 — Add INSERT RLS policy for `mood_question_history` (MODERATE)

**Migration:** New migration file

The edge function uses the service role key, which bypasses RLS. But the RLS model should be complete. Add an explicit acknowledgment policy that documents the service-role-only pattern, and optionally add an INSERT policy for users on their own records to align with the rest of the schema:

```sql
CREATE POLICY "Users can insert their own mood question history"
ON public.mood_question_history FOR INSERT
WITH CHECK (user_id = auth.uid());
```

This covers potential future client-side paths and makes the security model self-documenting.

---

### Fix 4 — Guard against empty `userId` in `EmployeeHome.tsx` (MINOR)

**File:** `src/pages/EmployeeHome.tsx`

Wrap the `InlineDailyCheckin` render condition to also require a valid `user_id`:

```tsx
{employee && !todayEntry && employee.user_id && (
  <InlineDailyCheckin
    employeeId={employee.id}
    tenantId={employee.tenant_id}
    userId={employee.user_id}
  />
)}
```

This prevents the edge function call from firing with an empty `userId` and avoids the 400 error silently degrading the user experience.

---

## File Change Summary

| File | Change | Severity |
|------|--------|---------|
| `src/components/checkin/InlineDailyCheckin.tsx` | Insert `<MoodPathwayQuestions>` JSX between MoodStep and Wellness Question | Critical |
| `supabase/config.toml` | Add `[functions.generate-mood-questions] verify_jwt = false` | Critical |
| `src/pages/EmployeeHome.tsx` | Guard `InlineDailyCheckin` to require non-null `user_id` | Minor |
| New migration SQL | Add `INSERT` RLS policy on `mood_question_history` for users | Moderate |

---

## What Is Already Correct (No Changes Needed)

- `supabase/functions/generate-mood-questions/index.ts` — complete, correct logic, SHA-256 hashing, theme rotation, safety overrides, retry engine, history store
- `supabase/functions/generate-daily-tip/index.ts` — correctly accepts and uses `pathwayAnswers`
- `src/components/checkin/MoodPathwayQuestions.tsx` — fully built, graceful degradation, RTL-aware, loading skeleton, free-text conditional
- `src/hooks/useMoodQuestionConfig.ts` — correct upsert with conflict resolution
- `src/pages/admin/MoodPathwaySettings.tsx` — complete admin configuration UI
- `supabase/migrations/20260218110857_*.sql` — both tables created with correct schema and RLS
- `src/App.tsx` — `/admin/mood-pathways` route correctly registered
- `src/components/layout/AppSidebar.tsx` — `Mood Pathways` link correctly placed in Survey System group
- `src/locales/en.json` and `ar.json` — all `moodPathway.*` keys present with accurate Arabic translations
- Database: All 3 tables (`mood_entries`, `mood_question_configs`, `mood_question_history`) confirmed to exist in the database
