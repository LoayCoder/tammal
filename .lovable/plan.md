

# Fix All AI Generator Gaps

## GAP 1: Update Default Model

**File:** `src/pages/admin/AIQuestionGenerator.tsx`
- Change line 43 from `'google/gemini-2.5-flash'` to `'google/gemini-3-flash-preview'`

---

## GAP 2 + 3: Pass Selected Model to Rewrite and Critic

**File:** `src/pages/admin/AIQuestionGenerator.tsx`
- In `handleRewritePrompt`, add `model: selectedModel` to the request body sent to `rewrite-prompt`
- In `handleValidate`, add `model: selectedModel` to the validate call

**File:** `supabase/functions/rewrite-prompt/index.ts`
- Accept `model` from request body, default to `google/gemini-3-flash-preview`
- Use it in the gateway fetch call instead of hardcoded value

**File:** `supabase/functions/validate-questions/index.ts`
- Accept `model` from request body, default to `google/gemini-3-flash-preview`
- Use it in the critic pass gateway fetch call instead of hardcoded value

**File:** `src/hooks/useEnhancedAIGeneration.ts`
- Add `model` to the validate mutation params type

---

## GAP 9: Add 429/402 Error Handling to Rewrite

**File:** `supabase/functions/rewrite-prompt/index.ts`
- After the gateway fetch, check `response.status` for 429 and 402
- Return specific JSON error messages: "Rate limit exceeded" / "Payment required"

**File:** `src/pages/admin/AIQuestionGenerator.tsx`
- In `handleRewritePrompt` catch block, detect rate limit and credit errors and show appropriate toast messages

---

## GAP 5: Enable Validation Logging Without questionSetId

**File:** `supabase/functions/validate-questions/index.ts`
- Remove the `questionSetId` requirement from the logging condition (line 320)
- Change to: if `tenantId` exists, log validation results with `question_set_id` set to `questionSetId` or `null`

**File:** `src/hooks/useEnhancedAIGeneration.ts`
- Update the `validateMutation` params type to accept optional `knowledgeDocumentIds`

---

## GAP 4: Preserve Document Context for Regeneration

**File:** `src/pages/admin/AIQuestionGenerator.tsx`
- Remove the immediate `deleteAllDocuments()` call after generate (lines 84-86)
- Instead, store active document IDs in a `useRef` or state variable when generating
- Only delete documents when the user explicitly clears all results or navigates away
- In `handleRegenerateFailedOnly`, pass the stored `knowledgeDocumentIds`
- Add cleanup in `clearAll` to delete documents at that point

---

## GAP 6: Add tenant_id Null Guard in Save Flow

**File:** `src/hooks/useEnhancedAIGeneration.ts`
- After the `get_user_tenant_id` RPC call, check if `tenantId` is null
- If null, throw a clear error: "No organization found. Please contact your administrator."

---

## GAP 7: Fix Misleading DOCX Export

**File:** `src/pages/admin/AIQuestionGenerator.tsx`
- Remove the `'docx'` option from the export dropdown/menu
- Keep only `'json'` and `'pdf'` (print-to-PDF) as export options
- Update the PDF export label to clarify it opens a print dialog

**File:** `src/locales/en.json` and `src/locales/ar.json`
- Update export-related i18n keys if needed (e.g., rename "PDF" to "Print / PDF")

---

## Technical Summary

| Gap | Files Changed | Effort |
|-----|--------------|--------|
| 1 | AIQuestionGenerator.tsx | 1 line |
| 2+3 | AIQuestionGenerator.tsx, rewrite-prompt, validate-questions, useEnhancedAIGeneration.ts | ~15 lines |
| 9 | rewrite-prompt, AIQuestionGenerator.tsx | ~15 lines |
| 5 | validate-questions | ~3 lines |
| 4 | AIQuestionGenerator.tsx | ~15 lines |
| 6 | useEnhancedAIGeneration.ts | ~3 lines |
| 7 | AIQuestionGenerator.tsx, locales | ~10 lines |

All edge functions (`rewrite-prompt`, `validate-questions`) will be redeployed automatically after changes.

