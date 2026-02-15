

# Generation Pipeline Audit: Gaps Found and Fixes

## Audit Results

After tracing every setting from the UI through the hook to the edge function, the core pipeline is solid -- all 14 configuration parameters are correctly passed and consumed. However, three concrete gaps were found:

---

## Gap 1: `scenario_based` Still Offered in the UI (Critical)

**File:** `src/components/ai-generator/ConfigPanel.tsx` (line 337)

The Question Type dropdown still includes `scenario_based` as a selectable option. This type was removed from the AI tool definition and is normalized to `multiple_choice` on both the backend and frontend. However, the user can still explicitly select it, creating confusion (they choose "Scenario Based" but the badge shows "Multiple Choice").

**Fix:** Remove the `scenario_based` SelectItem from ConfigPanel. Users who want scenario-style questions can describe that in the custom prompt.

---

## Gap 2: `tenant_id` Missing in Generation Logs

**File:** `supabase/functions/generate-questions/index.ts` (line 490)

The `ai_generation_logs` insert sets `user_id` but never sets `tenant_id`. This means tenant admins using the RLS policy `tenant_id = get_user_tenant_id(auth.uid())` cannot see their organization's generation logs.

**Fix:** Fetch the tenant_id via the `get_user_tenant_id` RPC before inserting the log record, and include it in the insert.

---

## Gap 3: `rewrite-question` Function Missing Model Propagation

**File:** `supabase/functions/rewrite-question/index.ts`

The rewrite function accepts an optional `model` parameter but the QuestionCard UI does not pass the user's selected model. It will default to `google/gemini-3-flash-preview`. For configuration integrity, the selected model from the page should be passed through.

**Fix:** Pass the `selectedModel` from the page state down to QuestionCard and include it in the rewrite function call.

---

## Verification Summary (What IS Working)

| Setting | Passed to Hook | Passed to Edge Fn | Used in Prompt | Status |
|---------|---------------|-------------------|----------------|--------|
| Question Count | Yes | Yes | Yes + retry mechanism | OK |
| Complexity | Yes | Yes | Yes | OK |
| Tone | Yes | Yes | Yes | OK |
| Question Type | Yes | Yes | Yes (type constraint) | OK (except scenario_based UI option) |
| AI Model | Yes | Yes | Yes (validated against DB) | OK |
| Accuracy Mode | Yes | Yes | Yes (controls temperature) | OK |
| Advanced Settings (6 flags) | Yes | Yes | Yes (all 6 in prompt) | OK |
| Language | Yes | Yes | Implicit (always 'both') | OK |
| Reference Frameworks | Yes | Yes | Yes (fetched + injected with docs) | OK |
| Knowledge Documents | Yes | Yes | Yes (fetched + injected) | OK |
| Custom Prompt | Yes | Yes | Yes (appended to system prompt) | OK |
| Category IDs | Yes | Yes | Yes (fetched with descriptions) | OK |
| Subcategory IDs | Yes | Yes | Yes (fetched + grouped) | OK |
| Source Priority Directive | N/A | N/A | Yes (auto-generated) | OK |

---

## Technical Changes

### File 1: `src/components/ai-generator/ConfigPanel.tsx`
- Remove `<SelectItem value="scenario_based">` from the question type dropdown

### File 2: `supabase/functions/generate-questions/index.ts`
- After getting `userData.user`, call `get_user_tenant_id` RPC
- Add `tenant_id` to the `ai_generation_logs` insert

### File 3: `src/components/ai-generator/QuestionCard.tsx`
- Accept an optional `selectedModel` prop
- Pass it in the `rewrite-question` invoke body

### File 4: `src/pages/admin/AIQuestionGenerator.tsx`
- Pass `selectedModel` to each `QuestionCard` component

