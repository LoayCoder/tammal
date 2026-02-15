

# Add Question Purpose Selector: Survey vs Daily Check-in

## Overview

Add a "Purpose" selector at the top of the AI Question Generator configuration panel. This lets you choose whether the generated questions are for **Survey** delivery or **Daily Check-in (Wellness)** before generating. The save logic will then route questions to the correct database table.

---

## What Changes

### 1. New "Purpose" Selector in ConfigPanel

A prominent selector at the very top of the configuration card with two options:
- **Survey Questions** -- saved to `question_sets` + `generated_questions` (current behavior)
- **Daily Check-in** -- saved to `wellness_questions` table

When "Daily Check-in" is selected:
- Question type options are simplified (only scale, multiple_choice, text -- matching wellness question types)
- The batch save dialog is skipped (wellness questions don't use batches)
- Questions save directly to `wellness_questions` with `status: 'draft'`

### 2. Save Logic Changes

The `useEnhancedAIGeneration` hook's `saveSet` function will accept a `purpose` parameter:
- `purpose: 'survey'` -- existing behavior (save to `question_sets` + `generated_questions`)
- `purpose: 'wellness'` -- insert into `wellness_questions` table with mapped fields:
  - `question_text` maps to `question_text_en`
  - `question_text_ar` maps to `question_text_ar`
  - `type` maps to `question_type` (mapped: likert_5/numeric_scale to "scale", open_ended to "text")
  - `options` stays as-is
  - `status` = 'draft' (admin publishes later from Wellness Settings)

### 3. AIQuestionGenerator Page

- New state: `purpose` ('survey' | 'wellness')
- Pass purpose to ConfigPanel and save flow
- When purpose is 'wellness', skip batch dialog and call a direct wellness save
- When purpose is 'survey', existing batch dialog flow continues

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/ai-generator/ConfigPanel.tsx` | Add `purpose` prop and selector UI at top of config card |
| `src/pages/admin/AIQuestionGenerator.tsx` | Add `purpose` state, pass to ConfigPanel, branch save logic |
| `src/hooks/useEnhancedAIGeneration.ts` | Add `saveWellnessQuestions` mutation for wellness table inserts |
| `src/locales/en.json` | Add keys: `aiGenerator.purpose`, `aiGenerator.purposeSurvey`, `aiGenerator.purposeWellness`, `aiGenerator.purposeDescription` |
| `src/locales/ar.json` | Corresponding Arabic translations |

---

## Technical Details

### Purpose Selector UI (top of ConfigPanel)

A radio-style toggle group with two clear options showing icons:
- ClipboardList icon + "Survey Questions"
- Heart icon + "Daily Check-in"

### Wellness Save Mutation

```typescript
// Maps AI generator question types to wellness question types
function mapToWellnessType(type: string): string {
  if (['likert_5', 'numeric_scale'].includes(type)) return 'scale';
  if (type === 'open_ended') return 'text';
  if (type === 'multiple_choice') return 'multiple_choice';
  return 'scale'; // default
}

// Insert into wellness_questions
const wellnessInsert = questions.map(q => ({
  tenant_id: tenantId,
  question_text_en: q.question_text,
  question_text_ar: q.question_text_ar,
  question_type: mapToWellnessType(q.type),
  options: q.options || [],
  status: 'draft',
}));
await supabase.from('wellness_questions').insert(wellnessInsert);
```

### Conditional Question Types

When purpose is 'wellness', the question type dropdown shows only:
- Scale (maps to wellness 'scale')
- Multiple Choice
- Open Text (maps to wellness 'text')
- Mixed

When purpose is 'survey', all current types remain available.

