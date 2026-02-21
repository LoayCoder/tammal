

# Comprehensive Audit: Dashboard-Ready Data Integrity Implementation

## Audit Summary

The implementation is **largely correct** with proper database schema, RLS policies, edge function logic, and UI wiring. However, I identified **7 issues** ranging from bugs to gaps.

---

## Issue 1: `periodId` NOT Passed to Validation (BUG)

**Severity:** High -- Cross-period semantic dedup in `validate-questions` will NEVER run.

The `handleValidate` function in `AIQuestionGenerator.tsx` (line 153-164) does NOT pass `periodId` to the validation call:

```text
validate({
  questions, accuracyMode,
  model: selectedModel,
  enableCriticPass: ...,
  minWordLength: ...,
  selectedFrameworkIds: ...,
  knowledgeDocumentIds: ...,
  hasDocuments: ...,
  // MISSING: periodId: selectedPeriodId || undefined
});
```

The `validate-questions` edge function checks for `periodId` (line 266) and performs cross-period semantic similarity only when present. Without it, this entire validation check is dead code.

**Fix:** Add `periodId: selectedPeriodId || undefined` to the `handleValidate` call body.

---

## Issue 2: Export Missing New Analytical Fields (GAP)

**Severity:** Medium -- Plan explicitly stated "Update export to include category_id, subcategory_id, mood_score, affective_state."

The `handleExport` function (line 205-242) only exports basic fields:

```text
questions: questions.map(q => ({
  question_text, question_text_ar, type, complexity, tone,
  confidence_score, explanation, framework_reference,
  // MISSING: category_id, subcategory_id, mood_score, affective_state,
  //          category_name, subcategory_name, generation_period_id
})),
```

**Fix:** Add the analytical fields to the export mapping.

---

## Issue 3: `handleRegenerateFailedOnly` Missing `periodId` (BUG)

**Severity:** Medium -- Regenerated questions won't get period-aware dedup or period tagging.

In `AIQuestionGenerator.tsx` line 244-259, the `handleRegenerateFailedOnly` call does not include `periodId`.

**Fix:** Add `periodId: selectedPeriodId || undefined` to that generate call.

---

## Issue 4: `handleRegenerateSingle` Missing `periodId` (BUG)

**Severity:** Medium -- Same issue as above for single-question regeneration.

In `AIQuestionGenerator.tsx` line 261-276, `periodId` is not passed.

**Fix:** Add `periodId: selectedPeriodId || undefined` to that generate call.

---

## Issue 5: `CreatePeriodDialog` Does Not Close on Success (MINOR UX BUG)

**Severity:** Low -- The dialog closes immediately on confirm (line 613-615) without waiting for the mutation to succeed. If the mutation fails, the dialog has already closed and the user may not notice the error.

However, the current pattern is acceptable since the toast will show the error. No fix strictly needed, but ideally the dialog should wait for success.

---

## Issue 6: Duplicate `supabase.auth.getUser` Calls in `generate-questions` (PERFORMANCE)

**Severity:** Low -- The edge function calls `supabase.auth.getUser(token)` twice: once at line 598-601 for semantic dedup, and again at line 658-659 for logging. This wastes a roundtrip.

**Fix:** Extract the first call result and reuse it for logging.

---

## Issue 7: Validate Mutation Type Missing `periodId` (TYPE GAP)

**Severity:** Low -- The `validateMutation` in `useEnhancedAIGeneration.ts` (line 144) accepts a params object but does not include `periodId` in its type signature, which means TypeScript won't enforce passing it.

**Fix:** Add `periodId?: string` to the validate mutation params type.

---

## Implementation Plan

### File: `src/pages/admin/AIQuestionGenerator.tsx`

1. **Line ~153-164** (`handleValidate`): Add `periodId: selectedPeriodId || undefined` to the validate call
2. **Line ~205-242** (`handleExport`): Add `category_id`, `subcategory_id`, `mood_score`, `affective_state`, `category_name`, `subcategory_name` to the export mapping
3. **Line ~244-259** (`handleRegenerateFailedOnly`): Add `periodId: selectedPeriodId || undefined`
4. **Line ~261-276** (`handleRegenerateSingle`): Add `periodId: selectedPeriodId || undefined`

### File: `src/hooks/useEnhancedAIGeneration.ts`

5. **Line ~144** (`validateMutation`): Add `periodId?: string` to the params type definition

### File: `supabase/functions/generate-questions/index.ts`

6. **Lines ~596-615 and ~657-684**: Refactor to reuse the `getUser` result instead of calling it twice

---

## Verified as Correct

- Database schema: `generation_periods` table exists with proper columns, RLS enabled, policies for super_admin + tenant isolation
- `generated_questions` has all 6 new columns (category_id, subcategory_id, mood_score, affective_state, generation_period_id, question_hash)
- `questions` table has the 3 new columns (subcategory_id, mood_score, affective_state)
- Edge function `generate-questions`: period lock, affective state matrixing, mood score derivation, category/subcategory ID resolution, semantic dedup, question hash -- all implemented correctly
- Edge function `validate-questions`: distribution balance check and cross-period semantic similarity -- logic is correct (just not triggered due to missing periodId pass-through)
- `useGenerationPeriods` hook: CRUD operations correct with proper tenant isolation
- `useEnhancedAIGeneration`: save mutations include all new analytical fields for both `generated_questions` and `questions` tables
- `ConfigPanel`: Period selector, locking behavior, and distribution preview all wired correctly
- `QuestionCard`: Affective state and mood score badges render correctly
- `CreatePeriodDialog`: Category/subcategory selection with orphan cleanup works properly
- `DistributionPreview`: Matrix calculation and rendering correct
- Localization: Translation keys present in both en.json and ar.json

