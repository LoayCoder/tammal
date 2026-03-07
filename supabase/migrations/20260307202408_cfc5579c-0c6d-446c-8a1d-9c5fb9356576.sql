
CREATE OR REPLACE FUNCTION public.cascade_soft_delete_cycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE award_themes SET deleted_at = NEW.deleted_at
      WHERE cycle_id = NEW.id AND deleted_at IS NULL;

    UPDATE nominations SET deleted_at = NEW.deleted_at
      WHERE cycle_id = NEW.id AND deleted_at IS NULL;

    UPDATE votes SET deleted_at = NEW.deleted_at
      WHERE cycle_id = NEW.id AND deleted_at IS NULL;

    UPDATE endorsements SET deleted_at = NEW.deleted_at
      WHERE nomination_id IN (
        SELECT id FROM nominations WHERE cycle_id = NEW.id
      ) AND deleted_at IS NULL;

    UPDATE judging_criteria SET deleted_at = NEW.deleted_at
      WHERE theme_id IN (
        SELECT id FROM award_themes WHERE cycle_id = NEW.id
      ) AND deleted_at IS NULL;

    UPDATE nomination_criteria_evaluations SET deleted_at = NEW.deleted_at
      WHERE nomination_id IN (
        SELECT id FROM nominations WHERE cycle_id = NEW.id
      ) AND deleted_at IS NULL;

    UPDATE vote_criteria_evaluations SET deleted_at = NEW.deleted_at
      WHERE vote_id IN (
        SELECT id FROM votes WHERE cycle_id = NEW.id
      ) AND deleted_at IS NULL;

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
  EXECUTE FUNCTION public.cascade_soft_delete_cycle();
