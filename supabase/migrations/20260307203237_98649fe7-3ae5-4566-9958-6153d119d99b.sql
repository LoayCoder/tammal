
-- Update existing trigger function to also handle restore (deleted_at going from NOT NULL back to NULL)
CREATE OR REPLACE FUNCTION public.cascade_soft_delete_cycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Cascade soft-delete
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE award_themes SET deleted_at = NEW.deleted_at
      WHERE cycle_id = NEW.id AND deleted_at IS NULL;

    UPDATE nominations SET deleted_at = NEW.deleted_at
      WHERE cycle_id = NEW.id AND deleted_at IS NULL;

    UPDATE votes SET deleted_at = NEW.deleted_at
      WHERE cycle_id = NEW.id AND deleted_at IS NULL;

    UPDATE nomination_criteria_evaluations SET deleted_at = NEW.deleted_at
      WHERE nomination_id IN (
        SELECT id FROM nominations WHERE cycle_id = NEW.id
      ) AND deleted_at IS NULL;

    UPDATE vote_criteria_evaluations SET deleted_at = NEW.deleted_at
      WHERE vote_id IN (
        SELECT id FROM votes WHERE cycle_id = NEW.id
      ) AND deleted_at IS NULL;

    UPDATE judging_criteria SET deleted_at = NEW.deleted_at
      WHERE theme_id IN (
        SELECT id FROM award_themes WHERE cycle_id = NEW.id
      ) AND deleted_at IS NULL;

    UPDATE theme_results SET deleted_at = NEW.deleted_at
      WHERE cycle_id = NEW.id AND deleted_at IS NULL;

    UPDATE nomination_rankings SET deleted_at = NEW.deleted_at
      WHERE theme_results_id IN (
        SELECT id FROM theme_results WHERE cycle_id = NEW.id
      ) AND deleted_at IS NULL;
  END IF;

  -- Cascade restore: when deleted_at goes from a value back to NULL
  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    UPDATE award_themes SET deleted_at = NULL
      WHERE cycle_id = NEW.id AND deleted_at = OLD.deleted_at;

    UPDATE nominations SET deleted_at = NULL
      WHERE cycle_id = NEW.id AND deleted_at = OLD.deleted_at;

    UPDATE votes SET deleted_at = NULL
      WHERE cycle_id = NEW.id AND deleted_at = OLD.deleted_at;

    UPDATE nomination_criteria_evaluations SET deleted_at = NULL
      WHERE nomination_id IN (
        SELECT id FROM nominations WHERE cycle_id = NEW.id
      ) AND deleted_at = OLD.deleted_at;

    UPDATE vote_criteria_evaluations SET deleted_at = NULL
      WHERE vote_id IN (
        SELECT id FROM votes WHERE cycle_id = NEW.id
      ) AND deleted_at = OLD.deleted_at;

    UPDATE judging_criteria SET deleted_at = NULL
      WHERE theme_id IN (
        SELECT id FROM award_themes WHERE cycle_id = NEW.id
      ) AND deleted_at = OLD.deleted_at;

    UPDATE theme_results SET deleted_at = NULL
      WHERE cycle_id = NEW.id AND deleted_at = OLD.deleted_at;

    UPDATE nomination_rankings SET deleted_at = NULL
      WHERE theme_results_id IN (
        SELECT id FROM theme_results WHERE cycle_id = NEW.id
      ) AND deleted_at = OLD.deleted_at;
  END IF;

  RETURN NEW;
END;
$$;
