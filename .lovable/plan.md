

# Rebuild: AI Question Generator (Enterprise + Accuracy Controlled)

## Summary

Complete rebuild of the AI Question Generator page from a basic two-column layout into a production-grade, enterprise module with model selection, multi-pass validation, strict mode enforcement, structured logging, and export capabilities.

## Current State

The existing implementation is minimal:
- Simple focus area pills, 1-5 question count, basic complexity/tone selectors
- No model selection (hardcoded `gemini-2.5-flash`)
- No validation engine
- No confidence scores or explanations
- No export functionality
- No strict mode or accuracy controls
- Logging only captures basic metadata

## Architecture Overview

```text
+-----------------------------------------------------------------------+
| TOP CONTROL BAR                                                       |
| [Accuracy Mode ▼]  [AI Model ▼]           [Save Draft] [Export ▼]    |
+-----------------------------------------------------------------------+
|  LEFT PANEL (Config)           |  RIGHT PANEL (Results + Validation)   |
|  - Focus Areas (pills)        |  - Question Cards with scores         |
|  - Question Type              |  - Inline edit / regenerate           |
|  - Count (1-20)               |  - Validation Report summary          |
|  - Complexity                 |  - Export blocked if strict + failed   |
|  - Tone                       |                                       |
|  - Advanced Settings          |                                       |
|    (collapsible)              |                                       |
|  - [Generate] CTA             |                                       |
+--------------------------------+---------------------------------------+
```

## Implementation Plan

### Phase 1: Database Schema Changes

**Migration: Add new tables for the enterprise module**

1. **`ai_models`** table (reference table for available models):
   - `id` uuid PK
   - `model_key` text (e.g. `google/gemini-2.5-flash`)
   - `display_name` text
   - `accuracy_tier` text (`standard`, `high`, `premium`)
   - `cost_tier` text (`low`, `medium`, `high`)
   - `is_active` boolean default true
   - `created_at` timestamptz

2. **`question_sets`** table (groups of generated questions):
   - `id` uuid PK
   - `tenant_id` uuid FK tenants
   - `user_id` uuid
   - `model_used` text
   - `accuracy_mode` text
   - `settings` jsonb (full config snapshot)
   - `validation_result` jsonb
   - `critic_pass_result` jsonb
   - `status` text (`draft`, `validated`, `exported`)
   - `created_at`, `updated_at`, `deleted_at` timestamptz

3. **`generated_questions`** table (individual questions in a set):
   - `id` uuid PK
   - `question_set_id` uuid FK question_sets
   - `tenant_id` uuid FK tenants
   - `question_text` text
   - `question_text_ar` text
   - `type` text
   - `complexity` text
   - `tone` text
   - `explanation` text
   - `confidence_score` numeric
   - `bias_flag` boolean
   - `ambiguity_flag` boolean
   - `validation_status` text (`passed`, `warning`, `failed`)
   - `validation_details` jsonb
   - `options` jsonb
   - `created_at` timestamptz

4. **`validation_logs`** table:
   - `id` uuid PK
   - `question_set_id` uuid FK question_sets
   - `tenant_id` uuid FK tenants
   - `validation_type` text (`structure`, `duplicate`, `bias`, `ambiguity`, `length`, `critic`)
   - `result` text (`passed`, `warning`, `failed`)
   - `details` jsonb
   - `created_at` timestamptz

5. **Update `ai_generation_logs`**: Add columns `accuracy_mode`, `temperature`, `duration_ms`, `validation_result`, `critic_pass_result`, `settings` jsonb.

6. **Seed `ai_models`** with available Lovable AI models.

7. **RLS policies** on all new tables: tenant isolation + super_admin access.

### Phase 2: Backend - Enhanced Edge Function

**Rebuild `supabase/functions/generate-questions/index.ts`**

Changes:
- Accept `model`, `accuracyMode`, `questionType`, `advancedSettings` in request body
- Use the selected model instead of hardcoded one
- Request structured JSON with confidence scores, explanations, bias/ambiguity flags
- Implement tool-calling for structured output extraction
- Add timing measurement (`performance.now()`)
- Log full generation metadata (duration, tokens, temperature, model, settings)
- Return enriched question objects

**New edge function: `supabase/functions/validate-questions/index.ts`**

Dedicated validation endpoint that:
- Accepts array of generated questions + accuracy mode
- Runs structure completeness check
- Runs duplicate detection (sends pairs to AI for semantic similarity)
- Runs bias detection pass
- Runs ambiguity detection pass
- Checks minimum word length
- Checks MCQ option integrity
- If critic pass enabled: second AI call evaluating clarity, difficulty alignment, neutral wording, logical consistency
- Returns per-question validation status + overall validation report
- Logs to `validation_logs` table

### Phase 3: Frontend - Hook Layer

**Rewrite `src/hooks/useAIQuestionGeneration.ts`**

New expanded interface:
```typescript
interface EnhancedGeneratedQuestion {
  question_text: string;
  question_text_ar: string;
  type: string;
  complexity: string;
  tone: string;
  explanation: string;
  confidence_score: number;
  bias_flag: boolean;
  ambiguity_flag: boolean;
  validation_status: 'pending' | 'passed' | 'warning' | 'failed';
  validation_details: Record<string, any>;
  options?: { text: string; text_ar: string }[];
}
```

New state management for:
- `accuracyMode` (standard / high / strict)
- `selectedModel` (from ai_models table)
- `advancedSettings` (toggles for bias, ambiguity, duplicate, critic, min length)
- `validationReport` (aggregate results)
- `questionSet` (saved set metadata)

New mutations:
- `generateQuestions` - calls enhanced edge function
- `validateQuestions` - calls validation edge function
- `saveQuestionSet` - persists to `question_sets` + `generated_questions`
- `regenerateSingle` - regenerates one question
- `exportQuestionSet` - generates export (JSON/PDF/DOCX client-side)

**New hook: `src/hooks/useAIModels.ts`**
- Fetches available models from `ai_models` table
- Returns model list with display names, accuracy/cost tiers

### Phase 4: Frontend - Complete Page Rebuild

**Rewrite `src/pages/admin/AIQuestionGenerator.tsx`**

Component structure:
```text
AIQuestionGenerator (page)
  +-- TopControlBar
  |     +-- AccuracyModeSelector (dropdown + tooltip)
  |     +-- ModelSelector (dropdown with tier badges)
  |     +-- SaveDraftButton
  |     +-- ExportDropdown (PDF/DOCX/JSON)
  +-- ConfigPanel (left column)
  |     +-- FocusAreaSelector (multi-select pills)
  |     +-- QuestionTypeSelector (dropdown)
  |     +-- QuestionCountSelector (1-20)
  |     +-- ComplexitySelector
  |     +-- ToneSelector
  |     +-- AdvancedSettings (Collapsible)
  |     |     +-- Toggle: Require explanation
  |     |     +-- Toggle: Bias detection
  |     |     +-- Toggle: Ambiguity detection
  |     |     +-- Toggle: Duplicate detection
  |     |     +-- Toggle: Critic pass
  |     |     +-- Input: Min word length
  |     +-- GenerateButton (large CTA with progress)
  +-- ResultsPanel (right column)
        +-- EmptyState (professional, no i18n keys shown)
        +-- QuestionCardList
        |     +-- QuestionCard (per question)
        |           +-- Type/Complexity/Tone badges
        |           +-- Confidence score indicator
        |           +-- Collapsible explanation
        |           +-- Validation status icon
        |           +-- Regenerate / Edit / Copy buttons
        +-- ValidationReport (summary panel)
              +-- Structure check result
              +-- Duplicate check result
              +-- Bias check result
              +-- Ambiguity check result
              +-- Avg confidence score
              +-- Strict mode blocking message (if applicable)
```

All components will be inline in the page file or extracted to `src/components/ai-generator/` sub-components if they exceed ~80 lines.

### Phase 5: Strict Mode Logic

Client-side enforcement:
- If accuracy mode is "strict" AND any validation check failed:
  - Disable Save Draft button
  - Disable Export dropdown
  - Show red banner: "Strict validation mode is active. Fix all failed questions before saving or exporting."
  - Show "Regenerate Failed Only" button that re-generates only questions with `validation_status === 'failed'`
- Failed questions get red border highlight

### Phase 6: Export Implementation

Client-side export (no additional edge function needed):
- **JSON**: Direct download of question set + metadata
- **PDF**: Use browser print-to-PDF or a simple HTML-to-PDF approach via a hidden printable div
- **DOCX**: Use a lightweight library or structured HTML blob with `.doc` extension

Export metadata includes: model used, accuracy mode, settings snapshot, date, user ID, validation summary.

### Phase 7: Localization

Update `en.json` and `ar.json` with all new keys for:
- Accuracy modes, model names, validation labels
- Advanced settings labels
- Validation report labels
- Export options
- Strict mode messages
- Empty state text (real text, not key references)

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database Migration | Create | Add `ai_models`, `question_sets`, `generated_questions`, `validation_logs` tables; update `ai_generation_logs`; seed models; RLS |
| `supabase/functions/generate-questions/index.ts` | Rewrite | Model selection, structured output, enhanced logging |
| `supabase/functions/validate-questions/index.ts` | Create | Validation engine with multi-check + critic pass |
| `supabase/config.toml` | Modify | Add `validate-questions` function entry |
| `src/hooks/useAIQuestionGeneration.ts` | Rewrite | Full state management, validation, save, export |
| `src/hooks/useAIModels.ts` | Create | Fetch available AI models |
| `src/pages/admin/AIQuestionGenerator.tsx` | Rewrite | Complete enterprise UI rebuild |
| `src/components/ai-generator/QuestionCard.tsx` | Create | Rich question card with scores, edit, regenerate |
| `src/components/ai-generator/ValidationReport.tsx` | Create | Validation summary panel |
| `src/components/ai-generator/TopControlBar.tsx` | Create | Accuracy mode, model selector, save/export |
| `src/components/ai-generator/ConfigPanel.tsx` | Create | Left panel configuration form |
| `src/components/ai-generator/AdvancedSettings.tsx` | Create | Collapsible advanced toggles |
| `src/locales/en.json` | Modify | Add ~60 new translation keys |
| `src/locales/ar.json` | Modify | Add ~60 Arabic translations |

## Security

- All new tables have RLS with tenant isolation
- `question_sets` and `generated_questions` scoped to `tenant_id`
- Validation edge function requires auth
- No raw SQL, all parameterized queries
- Model selection validated server-side against `ai_models` table

