

# Fix: Auto-Deactivate Wellness Questions When Generation Period Expires

## Problem
When a Generation Period expires, the cascade in `useGenerationPeriods.ts` updates the `question_generation_batches` status to `inactive`, but it does NOT update the child `wellness_questions` within those batches. This means the individual questions remain in `published` status and can still be served during Daily Check-in.

## Solution
Enhance the `expirePeriod` mutation in `src/hooks/useGenerationPeriods.ts` to also deactivate all `wellness_questions` linked to the batches under the expiring period.

## Technical Details

### File: `src/hooks/useGenerationPeriods.ts`

In the `expirePeriod` mutation (around lines 92-117), after deactivating `question_generation_batches`, add a step to:

1. Fetch all batch IDs from `question_generation_batches` that belong to this period
2. Update all `wellness_questions` where `batch_id` is in that list, setting `status = 'inactive'`

The updated cascade order will be:
1. Set `generation_periods.status = 'expired'`
2. Set `question_sets.status = 'inactive'` (survey batches)
3. Set `question_generation_batches.status = 'inactive'` (wellness batches)
4. **NEW**: Fetch batch IDs from `question_generation_batches` for this period, then set `wellness_questions.status = 'inactive'` for all matching `batch_id`s
5. **NEW**: Set `generated_questions.validation_status = 'inactive'` for all questions linked to this period via `generation_period_id`
6. Set `question_schedules.status = 'paused'`

This ensures complete cascading deactivation from period down to individual questions.

