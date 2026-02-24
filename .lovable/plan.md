
# Fix: Survey Response Data Missing from Organization Wellness Dashboard

## Root Cause

The submitted survey responses reference questions from the `generated_questions` table (AI-generated wellness questions), but the analytics engine in `useOrgAnalytics.ts` only looks up question metadata from the `questions` table.

Since none of the 25 submitted response `question_id` values exist in `questions` (they all live in `generated_questions`), every join returns empty, resulting in:
- 0 category scores
- 0 subcategory scores
- 0 affective distribution data
- Empty survey structural metrics
- No data shown in the dashboard

The survey response rate KPI may show a value, but all the rich analytics (category health, subcategory breakdown, mood matrix, etc.) appear empty.

## Fix

Update `src/hooks/useOrgAnalytics.ts` to resolve question metadata from **both** `questions` and `generated_questions` tables.

### Changes to `src/hooks/useOrgAnalytics.ts`

**Section 10 (Category/Subcategory/Affective scores, ~line 416-420):**
Currently:
```typescript
const { data: questions } = await supabase
  .from('questions')
  .select('id, category_id, subcategory_id, affective_state')
  .in('id', questionIds);
```

Change to: Query both `questions` and `generated_questions`, then merge results into a single map. Generated questions have `category_id` and `subcategory_id` but no `affective_state` column, so default that to `null`.

**Section 15 (Per-category daily trends, ~line 524-526):**
Same pattern -- the second query to `questions` also needs to include `generated_questions` as a fallback.

**Specifically:**
1. After fetching from `questions`, collect any `questionIds` not found in the result
2. Query those missing IDs from `generated_questions` (selecting `id, category_id, subcategory_id`)
3. Merge both result sets into the `questionMap` / `q2Map`

This ensures all survey responses -- whether from hand-crafted or AI-generated questions -- are included in every analytics visualization.

### No other files need changes

The dashboard components (`OrgDashboard.tsx`, `CategoryHealthChart`, `SubcategoryChart`, etc.) already handle the data correctly once it's populated. The synthesis engine also derives its structural metrics from the same `categoryScores` array, so fixing the data source fixes everything downstream.

### Summary

| Location | Change |
|----------|--------|
| `src/hooks/useOrgAnalytics.ts` ~line 417 | Add fallback query to `generated_questions` for unresolved question IDs |
| `src/hooks/useOrgAnalytics.ts` ~line 524 | Same fallback for the per-category trend computation |
