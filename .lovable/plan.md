
# Fix: Mood Pathway Questions Ignoring "Questions Per Mood" Setting

## Problem
When you select a mood (e.g., "Great"), 2 follow-up questions appear even though "Questions Per Mood" is set to 1 in the database.

**Root Cause**: Two bugs in `useMoodPathwayQuestions`:

1. **Missing query key**: The `maxQuestions` parameter is NOT included in the React Query key `['mood-pathway-questions', moodLevel, tenantId]`. When configs load and `maxQuestions` changes from the default (2) to the correct value (1), React Query does not re-fetch because the key hasn't changed.

2. **Race condition**: On first render, configs haven't loaded yet, so `maxQuestions` defaults to `2` (the fallback in `config?.max_questions ?? 2`). The query fires immediately and returns 2 questions. Even when configs load, the missing key means no re-fetch occurs.

## Technical Changes

### File: `src/hooks/useMoodPathwayQuestions.ts`
- Add `maxQuestions` to the query key so changes trigger a re-fetch:
  ```
  queryKey: ['mood-pathway-questions', moodLevel, tenantId, maxQuestions]
  ```

### File: `src/components/checkin/MoodPathwayQuestions.tsx`
- Prevent the query from firing before configs have loaded by checking config availability:
  - Change the `maxQuestions` fallback: only compute it when `configs.length > 0`
  - Pass a flag to disable the query until configs are ready (e.g., set `maxQuestions` to `null` or add an `enabled` guard)

Specifically:
```typescript
const { configs, isLoading: configsLoading } = useMoodQuestionConfig(tenantId);
const config = configs.find(c => c.mood_level === moodLevel);
const maxQuestions = configsLoading ? 0 : (config?.max_questions ?? 2);
```

And in `useMoodPathwayQuestions`, add a guard:
```typescript
enabled: !!moodLevel && !!tenantId && maxQuestions > 0,
```

These two changes ensure questions are only fetched once the correct `maxQuestions` value is known, and any later changes to the config will trigger a proper re-fetch.
