

# Multi-Source Reference-Driven Question Generation

## Overview

Transform the AI Question Generator into a fully integrated multi-source system where Reference Frameworks, Custom Prompts, and Uploaded Documents work together seamlessly to produce high-quality, traceable, validated survey questions.

## Current State

The system already has:
- 6 hardcoded frameworks selectable via checkboxes (stored in memory, not DB)
- Custom prompt with AI rewrite capability
- Document upload with auto-cleanup after generation
- Validation engine with bias, ambiguity, duplicate, and critic checks
- Expert knowledge toggle

## What Changes

### Phase 1: Database -- Reference Frameworks Table

Create a `reference_frameworks` table to replace the hardcoded framework list:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | nullable (null = global/default) |
| name | text | English name |
| name_ar | text | Arabic name |
| description | text | Full description for prompt injection |
| description_ar | text | Arabic description |
| icon | text | Emoji or icon key |
| framework_key | text | Unique key (e.g., "ISO45003") |
| is_default | boolean | System-provided frameworks |
| is_active | boolean | Soft toggle |
| created_by | uuid | nullable |
| created_at | timestamptz | |
| deleted_at | timestamptz | Soft delete |

- Seed the 6 existing frameworks as default rows
- RLS: tenant isolation + super_admin full access + users can view defaults and their tenant's frameworks

### Phase 2: Reference Documents Table

Create a `reference_documents` table to link documents to question sets after generation:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| question_set_id | uuid | FK to question_sets |
| tenant_id | uuid | |
| file_name | text | |
| extracted_text | text | Truncated content used in prompt |
| created_at | timestamptz | |

- RLS: tenant isolation + super_admin access

### Phase 3: UI Changes -- KnowledgeBasePanel Refactor

**Reference Frameworks Section (separate card):**
- Fetch frameworks from DB via new `useReferenceFrameworks` hook
- Multi-select with chips showing selected frameworks
- Each framework row: checkbox, icon, name, expandable description
- "Add Custom Framework" button opens a dialog (name, name_ar, description, icon)
- Edit/delete buttons for custom frameworks (only if created_by matches user)
- Default frameworks cannot be deleted

**Custom Prompt Section:**
- Keep current textarea and AI Rewrite button
- AI Rewrite now sends selected framework descriptions + document summaries

**Upload Documents Section:**
- Keep current upload flow (max 100MB, max 5 docs)
- Documents remain one-time-use (auto-deleted after generation)

### Phase 4: Prompt Construction Logic (generate-questions edge function)

When "Generate" is clicked, build the prompt in strict order:

```text
1. [System Prompt] -- Base expert instructions
2. [Framework Block] -- Descriptions of selected frameworks (fetched from DB)
3. [Document Block] -- Extracted content from uploaded documents
4. [Custom Prompt Block] -- User's custom instructions
5. [Configuration Block] -- Type, complexity, tone, count, accuracy rules
```

Rules enforced:
- No duplicate framework descriptions
- Document content truncated to 16,000 chars per doc
- Custom prompt appended last (does not override framework rules)
- Full constructed prompt snapshot logged in `ai_generation_logs.settings`

### Phase 5: Rewrite Prompt Enhancement (rewrite-prompt edge function)

Accept:
- `selectedFrameworkIds` -- fetch descriptions from DB instead of hardcoded map
- `documentSummaries` -- already implemented
- Build context dynamically from DB data

### Phase 6: Validation Enhancements (validate-questions edge function)

Add new validation checks:
- **Framework alignment**: If frameworks were selected, verify each question's `framework_reference` field matches one of the selected frameworks
- **Document grounding**: If documents were uploaded, check that questions reference relevant content (via keyword overlap with extracted text)
- **Prompt consistency**: Flag if question tone/complexity contradicts the configured settings

Log all validation breakdowns to `validation_logs`.

### Phase 7: Strict Mode Enforcement

When `accuracyMode === 'strict'` AND any of these fail:
- Framework misalignment detected
- Document grounding missing (when docs were provided)
- Prompt conflict detected

Then:
- Disable Save button
- Disable Export button
- Show red warning banner at top of results
- Show "Regenerate Failed Only" button

### Phase 8: Save Flow Enhancement

When saving a question set, also:
- Store `selected_framework_ids` in `question_sets.settings`
- Store `custom_prompt` in `question_sets.settings`
- Copy document metadata to `reference_documents` table (linking to question_set_id)

### Phase 9: Localization

Add all new i18n keys for:
- Framework management (add, edit, delete, custom framework dialog)
- Validation messages (alignment, grounding, consistency)
- Strict mode warnings
- Document grounding status

Both `en.json` and `ar.json`.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useReferenceFrameworks.ts` | CRUD hook for reference_frameworks table |
| `src/components/ai-generator/FrameworkDialog.tsx` | Add/edit custom framework dialog |
| `src/components/ai-generator/FrameworkSelector.tsx` | New framework selection card component |

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/` | New migration: create `reference_frameworks`, `reference_documents` tables, seed defaults |
| `src/pages/admin/AIQuestionGenerator.tsx` | Wire up framework selector, pass framework IDs to generate/rewrite, save framework/doc refs on save |
| `src/components/ai-generator/ConfigPanel.tsx` | Add FrameworkSelector, pass through new props |
| `src/components/ai-generator/KnowledgeBasePanel.tsx` | Remove hardcoded frameworks, keep custom prompt + doc upload |
| `src/hooks/useEnhancedAIGeneration.ts` | Add `selectedFrameworkIds` to GenerateInput, update save to store refs |
| `supabase/functions/generate-questions/index.ts` | Fetch framework descriptions from DB, build structured prompt, log full prompt |
| `supabase/functions/rewrite-prompt/index.ts` | Fetch framework descriptions from DB instead of hardcoded |
| `supabase/functions/validate-questions/index.ts` | Add framework alignment, document grounding, prompt consistency checks |
| `src/locales/en.json` | New keys |
| `src/locales/ar.json` | New keys |

## Security

- All new tables have RLS with tenant isolation
- Custom frameworks: only creator or super_admin can edit/delete
- Default frameworks: read-only for all, manageable only by super_admin
- Documents remain in private `ai-knowledge` bucket
- No public access to extracted text

