
# AI Rewrite Question: Per-Question Refinement Button

## Overview

Add an AI rewrite button to each QuestionCard that lets users refine a single question using a prompt. The user provides instructions (manually or by copying from the explanation), and the AI rewrites only that question's English and Arabic text.

## Changes

### 1. New Edge Function: `rewrite-question`

A dedicated backend function that takes the current question text (EN + AR), the user's refinement prompt, and the question type/context, then returns improved versions of only that question.

**System prompt will instruct the AI to:**
- Refine/improve the existing question, not generate a new one
- Preserve meaning, type, and structure
- Return both English and Arabic versions
- Use tool calling to return structured output (`{ question_text, question_text_ar }`)

**Endpoint:** `supabase/functions/rewrite-question/index.ts`
**Config:** Add `[functions.rewrite-question]` with `verify_jwt = false` to `config.toml`

### 2. QuestionCard.tsx -- AI Rewrite UI

Add to the actions bar (next to Edit and Delete):
- A **Sparkles** (AI) icon button that opens a collapsible prompt input area above the actions row
- A `Textarea` for the user's refinement prompt
- The AI button stays **disabled** until the prompt has content
- On submit, call the edge function with the current question text + prompt
- While loading, show a spinner on the button
- On success, call `onUpdate(index, { question_text, question_text_ar })` to apply the rewrite inline
- The user can copy text from the "View Explanation" section and paste it as the prompt

### 3. Localization Keys (en.json + ar.json)

New keys:
- `aiGenerator.aiRewrite` -- "AI Rewrite"
- `aiGenerator.rewritePrompt` -- "Enter instructions for how to improve this question..."
- `aiGenerator.rewriting` -- "Rewriting..."
- `aiGenerator.rewriteSuccess` -- "Question rewritten successfully"
- `aiGenerator.rewriteError` -- "Failed to rewrite question"

---

## Technical Details

### Edge Function: `rewrite-question/index.ts`

Uses tool calling for structured output:

```text
Input:  { question_text, question_text_ar, type, prompt, model? }
Output: { question_text, question_text_ar, success }
```

The system prompt instructs the AI:
- "You are refining an existing survey question. Do NOT change the topic or type."
- "Improve clarity, reduce ambiguity, fix grammar, align with psychometric best practices."
- "Return the refined question in both English and Arabic."

Uses `tools` + `tool_choice` to force structured JSON output with `question_text` and `question_text_ar` fields.

### QuestionCard UI Flow

```text
[Actions Row]
  [Copy] [Edit] [AI Sparkles] [Regenerate] [Delete]
                    |
                    v (click toggles prompt area)
  +--------------------------------------------------+
  | Enter instructions for how to improve...         |
  | [textarea]                                       |
  | [Rewrite button - disabled until text entered]   |
  +--------------------------------------------------+
```

### Files to Create/Modify

| File | Change |
|------|--------|
| `supabase/functions/rewrite-question/index.ts` | New edge function for single-question AI rewrite |
| `supabase/config.toml` | Add `[functions.rewrite-question]` entry |
| `src/components/ai-generator/QuestionCard.tsx` | Add AI button, collapsible prompt input, rewrite logic |
| `src/locales/en.json` | Add rewrite-related translation keys |
| `src/locales/ar.json` | Add Arabic translations |
