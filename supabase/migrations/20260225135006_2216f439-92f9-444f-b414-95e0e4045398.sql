
-- Create mh_risk_mappings table
CREATE TABLE public.mh_risk_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  intent text NOT NULL,
  risk_level text NOT NULL,
  action_description text,
  sort_order integer DEFAULT 0,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Validate risk_level
CREATE OR REPLACE FUNCTION public.validate_risk_mapping_level()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.risk_level NOT IN ('high', 'moderate', 'low') THEN
    RAISE EXCEPTION 'Invalid risk_level: %. Must be high, moderate, or low', NEW.risk_level;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_risk_mapping_level
BEFORE INSERT OR UPDATE ON public.mh_risk_mappings
FOR EACH ROW EXECUTE FUNCTION public.validate_risk_mapping_level();

-- Updated_at trigger
CREATE TRIGGER update_mh_risk_mappings_updated_at
BEFORE UPDATE ON public.mh_risk_mappings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index
CREATE INDEX idx_mh_risk_mappings_tenant ON public.mh_risk_mappings(tenant_id) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE public.mh_risk_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for risk mappings"
ON public.mh_risk_mappings FOR ALL
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Seed function for new tenants
CREATE OR REPLACE FUNCTION public.seed_default_risk_mappings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.mh_risk_mappings (tenant_id, intent, risk_level, sort_order, is_default)
  VALUES
    (NEW.id, 'self_harm',   'high',     0, true),
    (NEW.id, 'unsafe',      'high',     1, true),
    (NEW.id, 'overwhelmed', 'moderate', 2, true),
    (NEW.id, 'anxiety',     'moderate', 3, true),
    (NEW.id, 'work_stress', 'moderate', 4, true),
    (NEW.id, 'other',       'moderate', 5, true),
    (NEW.id, 'talk',        'low',      6, true);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_default_risk_mappings
AFTER INSERT ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.seed_default_risk_mappings();

-- Seed existing tenants
INSERT INTO public.mh_risk_mappings (tenant_id, intent, risk_level, sort_order, is_default)
SELECT t.id, v.intent, v.risk_level, v.sort_order, true
FROM public.tenants t
CROSS JOIN (VALUES
  ('self_harm',   'high',     0),
  ('unsafe',      'high',     1),
  ('overwhelmed', 'moderate', 2),
  ('anxiety',     'moderate', 3),
  ('work_stress', 'moderate', 4),
  ('other',       'moderate', 5),
  ('talk',        'low',      6)
) AS v(intent, risk_level, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.mh_risk_mappings m WHERE m.tenant_id = t.id AND m.intent = v.intent AND m.deleted_at IS NULL
);

-- Update map_intent_to_risk to query table with fallback
CREATE OR REPLACE FUNCTION public.map_intent_to_risk(p_intent text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(
    (SELECT risk_level FROM public.mh_risk_mappings
     WHERE intent = p_intent AND deleted_at IS NULL
     ORDER BY created_at DESC LIMIT 1),
    'moderate'
  );
$$;
