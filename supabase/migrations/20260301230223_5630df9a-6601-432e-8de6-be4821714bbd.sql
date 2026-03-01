
-- PR-AI-INT-03: Thompson Sampling Multi-Objective Bandit
-- Extends ai_provider_metrics_agg with Bayesian posterior columns
-- Adds routing_strategy support to tenant_ai_budget_config

-- 1. Extend ai_provider_metrics_agg with Thompson Sampling columns
ALTER TABLE public.ai_provider_metrics_agg
ADD COLUMN IF NOT EXISTS ts_alpha numeric NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS ts_beta numeric NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS ts_latency_mean numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ts_latency_variance numeric NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS ts_cost_mean numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ts_cost_variance numeric NOT NULL DEFAULT 1;

-- 2. Add routing_strategy to tenant_ai_budget_config
ALTER TABLE public.tenant_ai_budget_config
ADD COLUMN IF NOT EXISTS routing_strategy text NOT NULL DEFAULT 'cost_aware';

-- 3. Validation trigger for routing_strategy
CREATE OR REPLACE FUNCTION public.validate_routing_strategy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.routing_strategy NOT IN ('hybrid', 'cost_aware', 'thompson') THEN
    RAISE EXCEPTION 'Invalid routing_strategy: %. Must be hybrid, cost_aware, or thompson', NEW.routing_strategy;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_routing_strategy_trigger
BEFORE INSERT OR UPDATE ON public.tenant_ai_budget_config
FOR EACH ROW
EXECUTE FUNCTION public.validate_routing_strategy();

-- 4. Backfill existing rows: set Thompson priors from EWMA data where available
UPDATE public.ai_provider_metrics_agg
SET
  ts_alpha = GREATEST(1, ROUND(ewma_success_rate * sample_count)),
  ts_beta = GREATEST(1, ROUND((1 - ewma_success_rate) * sample_count)),
  ts_latency_mean = ewma_latency_ms,
  ts_latency_variance = GREATEST(0.01, POWER(ewma_latency_ms * 0.3, 2)),
  ts_cost_mean = COALESCE(cost_ewma, ewma_cost_per_1k),
  ts_cost_variance = GREATEST(0.0001, POWER(COALESCE(cost_ewma, ewma_cost_per_1k) * 0.3, 2))
WHERE sample_count > 0;
