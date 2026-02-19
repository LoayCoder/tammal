

# Fix: AI-Driven Mood Tag Selection in Question Generator

## Problem Found

After a full audit, there is **one critical gap**: The `generate-questions` edge function has **zero awareness of mood levels**. It does not:

1. Accept `moodLevels` in its request interface
2. Include mood context in the AI prompt
3. Return per-question `mood_levels` in its output schema

This means the AI **cannot** intelligently assign mood tags to individual questions. The frontend currently just copies the global selection to every question identically, which defeats the purpose of per-question mood ownership.

## What Works (Confirmed OK)

- `EnhancedGeneratedQuestion` interface has `mood_levels: string[]` -- OK
- `GenerateInput` has `moodLevels?: string[]` -- OK
- `QuestionCard` renders mood chips with add/remove when `purpose === 'wellness'` -- OK
- `saveWellnessMutation` reads `q.mood_levels` per question -- OK
- Translation keys (`moodTags`, `addMood`, `noMoodTags`, `moodTagsHint`) exist in both `en.json` and `ar.json` -- OK
- `handleRegenerateSingle` passes mood levels -- OK
- Props are correctly drilled to `QuestionCard` (`purpose`, `onRegenerate`, `selectedModel`) -- OK

## Solution: 3 Changes

### 1. Edge Function: `supabase/functions/generate-questions/index.ts`

**a) Add `moodLevels` to `GenerateRequest` interface:**
```ts
interface GenerateRequest {
  // ... existing fields ...
  moodLevels?: string[];  // NEW
}
```

**b) Destructure it from the request body (line ~67):**
```ts
const { ..., moodLevels = [] }: GenerateRequest = await req.json();
```

**c) Add mood context to the system prompt (after the category/subcategory block, before the source priority block):**
When `moodLevels` has entries, inject a prompt section instructing the AI to assign mood levels per question:
```
# Mood Level Tagging (MANDATORY for Wellness):
These questions are for a daily wellness check-in. Each question must be tagged 
with the most appropriate mood levels from the available set.

Available mood levels: great (feeling excellent), good (feeling positive), 
okay (feeling neutral), struggling (having difficulties), need_help (in distress)

The admin has pre-selected these mood levels: [great, okay]

For EACH question, choose which mood level(s) it is most relevant for as a 
follow-up question. A question about coping strategies fits "struggling" and 
"need_help". A question about gratitude fits "great" and "good". Assign 1-3 
mood levels per question based on psychological relevance.

Return the mood_levels array in each question object.
```

**d) Add `mood_levels` to the tool definition schema (line ~286):**
```ts
mood_levels: {
  type: "array",
  items: { type: "string", enum: ["great", "good", "okay", "struggling", "need_help"] },
  description: "Which mood levels this question is relevant for as a follow-up"
}
```

### 2. Hook: `src/hooks/useEnhancedAIGeneration.ts`

**Update `onSuccess` normalization (line ~104):**
Change from always falling back to `defaultMoods` to preferring AI-selected moods when available:
```ts
mood_levels: (Array.isArray(q.mood_levels) && q.mood_levels.length > 0)
  ? q.mood_levels
  : defaultMoods,
```
This is actually already the current logic (`q.mood_levels || defaultMoods`), but the explicit array check makes it more robust since the AI might return `null` or an empty array.

### 3. `handleRegenerateSingle` Fix in `AIQuestionGenerator.tsx`

Current `handleRegenerateSingle` calls `generate()` which **replaces all questions** with just 1 regenerated question. This is a bug -- regenerating a single question should replace only that question, not wipe the rest.

This needs to be fixed by either:
- Using a separate mutation that appends/replaces at index, OR
- Storing the current questions + index, and in `onSuccess` splicing the new question in

The fix: track pending single-regeneration state and merge on success.

## Data Flow After Fix

```text
1. Admin selects: Purpose = Wellness, Mood Tags = [Great, Okay]
2. Clicks Generate
   -> Edge function receives moodLevels: ['great', 'okay']
   -> AI prompt includes mood context + available levels
   -> AI returns each question with its own mood_levels:
      Q1: mood_levels: ['great', 'good']      (gratitude question)
      Q2: mood_levels: ['okay']                (neutral check-in)
      Q3: mood_levels: ['struggling', 'need_help'] (coping question)
3. Frontend onSuccess: uses AI-selected mood_levels per question
   -> Falls back to global selection only if AI didn't assign any
4. QuestionCard renders AI-selected tags (user can still edit)
5. Save uses each question's individual mood_levels
```

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/generate-questions/index.ts` | Add `moodLevels` to interface, destructure, inject prompt context, add to tool schema |
| `src/hooks/useEnhancedAIGeneration.ts` | Make mood_levels normalization more robust (array check) |
| `src/pages/admin/AIQuestionGenerator.tsx` | Fix `handleRegenerateSingle` to not wipe all questions |

## No Database Changes Required
