
-- M1 FIX: Atomic increment RPC for usage_24h to eliminate race condition
CREATE OR REPLACE FUNCTION public.increment_usage_24h(p_provider text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO ai_provider_usage_24h (provider, calls_last_24h, last_updated)
  VALUES (p_provider, 1, now())
  ON CONFLICT (provider)
  DO UPDATE SET
    calls_last_24h = ai_provider_usage_24h.calls_last_24h + 1,
    last_updated = now();
END;
$$;
