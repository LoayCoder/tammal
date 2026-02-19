
# Fix: Mood Level Tag Clarity & Per-Question Control in AI Generator

## Problem Summary

When generating wellness questions, admins select Mood Level Tags globally in the Config Panel, but:

1. **No visual on generated cards** — after generation, the QuestionCard shows zero indication of which moods it will be tagged to. The admin cannot tell which mood a question is tied to.
2. **No per-question mood editing** — mood tags are a single global selection applied identically to every generated question. There is no way to assign different moods to different questions.
3. **`EnhancedGeneratedQuestion` interface lacks `mood_levels`** — the in-memory data model doesn't carry mood info at the question level.
4. **No save preview/confirmation** — before saving wellness questions, there is no summary showing "these questions → these moods".

## Solution Architecture

The fix introduces per-question mood level ownership. The global Config Panel selection becomes the **default** applied to all generated questions, but each card then allows the admin to override it individually.

```text
Config Panel (Wellness mode)
  ├── Mood Level Tags: [Great] [Good] [Okay]   ← Global default
  └── "Generate" → applies these as defaults to each question

QuestionCard (Wellness mode)
  ├── Inline mood tag chips: 😄 Great  🙂 Good  😐 Okay  [+ Add]
  └── Click chip → toggle mood on/off per question

Save flow
  └── saveWellness reads moodLevels from each question individually
```

## Exact Changes Required

### 1. `src/hooks/useEnhancedAIGeneration.ts`
**Add `mood_levels` to `EnhancedGeneratedQuestion` interface:**
```ts
export interface EnhancedGeneratedQuestion {
  // ... existing fields ...
  mood_levels: string[];   // NEW — per-question mood tags
}
```

**Update `generateMutation.onSuccess`:**
When normalizing returned questions, inject the `moodLevels` from the generation input as the default for each question:
```ts
// Store the input moodLevels so onSuccess can access them
// Pass moodLevels through generate input to GenerateInput interface
```

**Update `GenerateInput`:** Add optional `moodLevels?: string[]` field.

**Update `saveWellnessMutation`:** Change parameter from `moodLevels?: string[]` (global) to reading `q.mood_levels` from each question individually:
```ts
const questionsInsert = params.questions.map(q => ({
  // ...
  mood_levels: q.mood_levels || [],   // ← per-question now
}));
```

### 2. `src/pages/admin/AIQuestionGenerator.tsx`
**Pass `selectedMoodLevels` into `generate()` call:**
```ts
generate({
  ...existing params...,
  moodLevels: selectedMoodLevels,   // NEW
});
```
**Update `handleSaveClick`:**
```ts
saveWellness({ questions }, ...);  // moodLevels removed — now on each question
```

### 3. `src/components/ai-generator/QuestionCard.tsx`
**Add `mood_levels` and `purpose` props:**
```ts
interface QuestionCardProps {
  // ... existing ...
  purpose?: 'survey' | 'wellness';
}
```

**Add inline mood tag UI (visible only when `purpose === 'wellness'`):**
- Display current mood tags as colored pill chips below the question text
- Each chip has an X to remove that mood
- A `+ Mood` popover/dropdown to add more moods from the 5 options
- Uses the same `MOOD_LEVELS_META` constant (Great/Good/Okay/Struggling/Need Help)
- On change, calls `onUpdate(index, { mood_levels: newLevels })`

**Visual design:**
```
😄 Great ×   🙂 Good ×   [+ Mood]
```
Chips styled as small rounded badges with emoji + label + X button. Lavender tinted for wellness mode.

### 4. `src/pages/admin/AIQuestionGenerator.tsx`
**Pass `purpose` prop to each `QuestionCard`:**
```tsx
<QuestionCard 
  key={i} 
  question={q} 
  index={i} 
  purpose={purpose}        // NEW
  onRemove={removeQuestion} 
  onUpdate={updateQuestion} 
  selectedModel={selectedModel} 
/>
```

### 5. `src/locales/en.json` + `src/locales/ar.json`
Add missing keys:
- `aiGenerator.moodTags` = "Mood Tags"
- `aiGenerator.addMood` = "+ Mood"  
- `aiGenerator.noMoodTags` = "No mood tags — question will not appear in any pathway"
- `aiGenerator.moodTagsHint` = "This question will appear as a follow-up for these moods"

## Complete Data Flow (After Fix)

```text
1. Admin selects: Purpose = Wellness, Mood Tags = [Great, Okay]
2. Clicks Generate
   → generate() called with moodLevels: ['great', 'okay']
   → Edge function returns 5 questions
   → onSuccess: each question gets mood_levels: ['great', 'okay'] injected
3. QuestionCard renders:
   → Shows "😄 Great ×  😐 Okay ×  [+ Mood]" under each question
   → Admin can remove Okay from question #3
   → Admin can add Struggling to question #4
4. Admin clicks Save (Wellness)
   → saveWellness({ questions }) called
   → Each question inserted with its own mood_levels array
   → Question #3 → mood_levels: ['great']
   → Question #4 → mood_levels: ['great', 'struggling']
5. In Mood Pathway Settings, admin sees correct counts per mood
6. In Daily Check-in, employees see correct follow-up questions per mood
```

## Files to Modify (4 files only)

| File | Change |
|------|--------|
| `src/hooks/useEnhancedAIGeneration.ts` | Add `mood_levels` to interface + GenerateInput; inject defaults on success; read per-question on save |
| `src/pages/admin/AIQuestionGenerator.tsx` | Pass `moodLevels` to generate(); pass `purpose` to QuestionCard; fix saveWellness call |
| `src/components/ai-generator/QuestionCard.tsx` | Add `purpose` prop; render inline mood tag chips with add/remove per question |
| `src/locales/en.json` + `src/locales/ar.json` | Add 4 new i18n keys |

## No Database Changes Required
The `questions.mood_levels` column already exists as `jsonb` in the database. This is purely a frontend/hook layer fix.
