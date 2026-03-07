

# Cascade Soft-Delete on Award Cycle Deletion

## Problem
When a cycle is deleted, only the `award_cycles` row gets soft-deleted. All child records — themes, nominations, votes, endorsements, criteria evaluations, vote criteria evaluations, results — remain active and continue appearing to other users (e.g. in My Nominations, Voting Booth, etc.).

## Solution
Create a database function + trigger that automatically cascade-soft-deletes all child records when a cycle's `deleted_at` is set.

### 1. Database Migration — Cascade Soft-Delete Trigger

Create a `CASCADE_SOFT_DELETE` function triggered on `award_cycles` update. When `deleted_at` changes from NULL to a timestamp, it soft-deletes all related rows:

```sql
CREATE OR REPLACE FUNCTION cascade_soft_delete_cycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    -- Soft-delete themes
    UPDATE award_themes SET deleted_at = NEW.deleted_at
      WHERE cycle_id = NEW.id AND deleted_at IS NULL;

    -- Soft-delete nominations
    UPDATE nominations SET deleted_at = NEW.deleted_at
      WHERE cycle_id = NEW.id AND deleted_at IS NULL;

    -- Soft-delete votes
    UPDATE votes SET deleted_at = NEW.deleted_at
      WHERE cycle_id = NEW.id AND deleted_at IS NULL;

    -- Soft-delete endorsements (via nomination_id)
    UPDATE endorsements SET deleted_at = NEW.deleted_at
      WHERE nomination_id IN (
        SELECT id FROM nominations WHERE cycle_id = NEW.id
      ) AND deleted_at IS NULL;

    -- Soft-delete judging criteria (via theme_id)
    UPDATE judging_criteria SET deleted_at = NEW.deleted_at
      WHERE theme_id IN (
        SELECT id FROM award_themes WHERE cycle_id = NEW.id
      ) AND deleted_at IS NULL;

    -- Soft-delete nomination_criteria_evaluations
    UPDATE nomination_criteria_evaluations SET deleted_at = NEW.deleted_at
      WHERE nomination_id IN (
        SELECT id FROM nominations WHERE cycle_id = NEW.id
      ) AND deleted_at IS NULL;

    -- Soft-delete vote_criteria_evaluations
    UPDATE vote_criteria_evaluations SET deleted_at = NEW.deleted_at
      WHERE vote_id IN (
        SELECT id FROM votes WHERE cycle_id = NEW.id
      ) AND deleted_at IS NULL;

    -- Soft-delete theme_results + nomination_rankings
    UPDATE theme_results SET deleted_at = NEW.deleted_at
      WHERE cycle_id = NEW.id AND deleted_at IS NULL;

    UPDATE nomination_rankings SET deleted_at = NEW.deleted_at
      WHERE theme_results_id IN (
        SELECT id FROM theme_results WHERE cycle_id = NEW.id
      ) AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cascade_soft_delete_cycle
  AFTER UPDATE ON award_cycles
  FOR EACH ROW
  EXECUTE FUNCTION cascade_soft_delete_cycle();
```

### 2. Frontend — Invalidate Related Caches on Cycle Delete

In `useAwardCycles.ts`, expand the `deleteCycle.onSuccess` to also invalidate nomination, vote, endorsement, and theme query caches so the UI immediately reflects the cascade.

### 3. No Other File Changes Needed

All existing queries already filter by `.is('deleted_at', null)`, so once the cascade sets `deleted_at` on child rows, they automatically disappear from all views (My Nominations, Voting Booth, Monitor, Fairness Panel, etc.).

