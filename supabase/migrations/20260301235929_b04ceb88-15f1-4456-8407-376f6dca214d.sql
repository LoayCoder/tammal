
-- Fix WARN 5: Revoke direct API access to materialized view
REVOKE ALL ON public.ai_governance_summary FROM anon, authenticated;
