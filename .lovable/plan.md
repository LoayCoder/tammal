

# Strategic System Enhancement: Dashboard-Ready Data Integrity

## Overview

This enhancement transforms the AI question generation system from a free-form tool into a structured, analytically-aligned pipeline. It ensures every generated question carries machine-readable metadata (actual IDs, not just names) and follows a balanced distribution pattern for smooth dashboard visualization.

---

## Current Gaps

| Gap | Current State | Target State |
|---|---|---|
| Category/Subcategory IDs | AI returns `category_name` (text) -- no actual UUID linkage | Every question tagged with real `category_id` and `subcategory_id` UUIDs |
| Period Lock | No concept of periods -- categories can change every generation | Admin locks categories/subcategories for a period (monthly/quarterly) |
| Affective State Balance | Questions generated without emotional distribution control | Balanced across Positive/Neutral/Negative per subcategory |
| Semantic Dedup | Only word-overlap duplicate check within current batch | Cross-period semantic memory against all questions in the same generation period |
| Mood Score | mood_levels are string arrays | Numeric `mood_score` (1-5) added for dashboard aggregation |

---

## Step 1: Database Migration

### New Table: `generation_periods`

Stores locked category/subcategory selections for a defined time window.

```text
CREATE TABLE generation_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'monthly',  -- monthly, quarterly, annual
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  locked_category_ids JSONB NOT NULL DEFAULT '[]',
  locked_subcategory_ids JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',  -- active, completed, archived
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
-- RLS: tenant isolation + super_admin
```

### Alter `generated_questions` -- Add Analytical Columns

```text
ALTER TABLE generated_questions
  ADD COLUMN category_id UUID,
  ADD COLUMN subcategory_id UUID,
  ADD COLUMN mood_score INTEGER,              -- 1-5 numeric
  ADD COLUMN affective_state TEXT,            -- positive, neutral, negative
  ADD COLUMN generation_period_id UUID,
  ADD COLUMN question_hash TEXT;              -- for semantic dedup
```

### Alter `questions` -- Add Missing Columns

The unified `questions` table already has `category_id` but lacks:

```text
ALTER TABLE questions
  ADD COLUMN subcategory_id UUID,
  ADD COLUMN mood_score INTEGER,
  ADD COLUMN affective_state TEXT;
```

---

## Step 2: Edge Function Enhancement (`generate-questions`)

### 2a. Period-Aware Generation

- Accept optional `periodId` parameter
- If provided, fetch `generation_periods` row and enforce `locked_category_ids` / `locked_subcategory_ids` (ignore any UI overrides)
- If no period exists, behave as today (freeform)

### 2b. Affective State Matrixing

Add to system prompt:

```text
# Affective State Distribution (MANDATORY):
For each subcategory, distribute questions across three affective states:
- "positive" (Engaged/Thriving) - questions exploring strengths, satisfaction, growth
- "neutral" (Passive/Observational) - questions measuring baseline, routine, factual state
- "negative" (Stressed/At-Risk) - questions detecting burnout, dissatisfaction, risk

Aim for balanced distribution: ~33% each per subcategory.
Tag each question with its affective_state.
```

Add `affective_state` to the tool definition:

```text
affective_state: { type: "string", enum: ["positive", "neutral", "negative"] }
```

### 2c. Mood Score Assignment

Add to tool definition:

```text
mood_score: { type: "integer", description: "Numeric wellness score 1-5 where 1=distress, 5=thriving" }
```

Map mood_levels to numeric scores automatically if AI doesn't provide one.

### 2d. Category/Subcategory ID Resolution

After generation, resolve `category_name` and `subcategory_name` returned by the AI back to actual UUIDs by matching against the fetched category/subcategory data. Embed `category_id` and `subcategory_id` in the response.

### 2e. Semantic Dedup (Cross-Period Memory)

Before returning questions, fetch existing questions from the same `generation_period_id`:

```sql
SELECT question_text FROM generated_questions
WHERE generation_period_id = $1 AND tenant_id = $2
```

Compute a simple hash (lowercase, stripped, sorted words) for each new question and compare against existing hashes. Flag duplicates with `ambiguity_flag` and add a `semantic_duplicate` validation issue.

### 2f. Question Hash

Generate a normalized hash for each question (lowercase, remove punctuation, sort words) and store in `question_hash` for fast future lookups.

---

## Step 3: Validation Enhancement (`validate-questions`)

### New Check: Distribution Balance

Verify that questions are roughly evenly distributed across:
- Categories (if multiple selected)
- Subcategories (within each category)
- Affective states (positive/neutral/negative per subcategory)

Flag as `warning` if any bucket has less than 20% of its fair share.

### New Check: Cross-Period Semantic Similarity

If `periodId` provided, compare new questions against all existing questions in that period using word-overlap similarity (already implemented pattern). Flag questions with >60% similarity to existing period questions.

---

## Step 4: UI Changes

### ConfigPanel.tsx -- Period Selector

Add a "Generation Period" section at the top of the config panel:
- A dropdown showing active periods for the tenant (or "Freeform" for no period lock)
- When a period is selected, category/subcategory selectors become read-only, showing the locked selections
- A "Create Period" button that opens a dialog to define: period type (monthly/quarterly/annual), date range, and select categories/subcategories to lock

### ConfigPanel.tsx -- Distribution Preview

Below the subcategory selector, show a small matrix preview:
- Rows: selected subcategories
- Columns: Positive / Neutral / Negative
- Cells: expected question count based on `questionCount` and distribution

### QuestionCard.tsx -- New Metadata Badges

Add badges for:
- `affective_state` (color-coded: green/gray/red)
- `mood_score` (numeric badge)
- `category_name` and `subcategory_name` (already shown if present, but now always present)

### AIQuestionGenerator.tsx

- Pass `periodId` to the generate function
- Update export to include `category_id`, `subcategory_id`, `mood_score`, `affective_state`

---

## Step 5: Save Flow Updates

### `useEnhancedAIGeneration.ts`

When saving to `generated_questions`, include the new columns:
- `category_id`, `subcategory_id`, `mood_score`, `affective_state`, `generation_period_id`, `question_hash`

When saving to the unified `questions` table (wellness flow), include:
- `subcategory_id`, `mood_score`, `affective_state`

---

## Files to Modify

| Action | File |
|---|---|
| Migration | New table `generation_periods`, alter `generated_questions`, alter `questions` |
| Modify | `supabase/functions/generate-questions/index.ts` (period lock, matrixing, ID resolution, dedup, hash) |
| Modify | `supabase/functions/validate-questions/index.ts` (distribution + semantic checks) |
| Modify | `src/components/ai-generator/ConfigPanel.tsx` (period selector, distribution preview) |
| Modify | `src/components/ai-generator/QuestionCard.tsx` (affective state + mood score badges) |
| Modify | `src/pages/admin/AIQuestionGenerator.tsx` (period state, pass to generate) |
| Modify | `src/hooks/useEnhancedAIGeneration.ts` (new fields in save mutations) |
| New | `src/hooks/useGenerationPeriods.ts` (CRUD hook for generation_periods) |
| Modify | `src/locales/en.json` and `src/locales/ar.json` (new translation keys) |

---

## Technical Notes

- The "Longitudinal Lock" is opt-in. Admins can still generate without a period (freeform mode).
- The affective state distribution is a prompt directive -- the AI targets ~33% balance but exact ratios depend on question count and subcategory count.
- Semantic dedup uses word-overlap (Jaccard similarity) which is already proven in the validation engine. No external embedding service needed.
- Mood score mapping: great=5, good=4, okay=3, struggling=2, need_help=1. If a question spans multiple moods, use the average.
- Category/subcategory ID resolution is deterministic: exact name match against the fetched DB records. If no match, falls back to null with a validation warning.

