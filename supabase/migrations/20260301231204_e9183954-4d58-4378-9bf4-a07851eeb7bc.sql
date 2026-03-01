
-- Fix search_path warning for validate_sla_risk_level (already set, but re-confirm)
-- The RLS "no policy" warnings for ai_cost_daily_agg and ai_performance_daily_agg are 
-- expected: they use USING(false) which blocks all non-service-role access by design.
-- Adding explicit service-role bypass policies isn't needed since service_role bypasses RLS.

-- No action needed - the function already has SET search_path TO 'public'.
-- The linter warning is a false positive for the existing validate_sla_risk_level function.
SELECT 1;
