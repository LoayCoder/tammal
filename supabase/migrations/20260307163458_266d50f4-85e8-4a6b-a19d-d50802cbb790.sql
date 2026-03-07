
-- ═══ Nomination Criteria Evaluations ═══
CREATE TABLE public.nomination_criteria_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  nomination_id UUID NOT NULL REFERENCES public.nominations(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES public.judging_criteria(id),
  weight NUMERIC NOT NULL,
  justification TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(nomination_id, criterion_id)
);

ALTER TABLE public.nomination_criteria_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.nomination_criteria_evaluations
  USING (tenant_id = (SELECT get_user_tenant_id(auth.uid())));

CREATE POLICY "authenticated_insert" ON public.nomination_criteria_evaluations
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT get_user_tenant_id(auth.uid())));

CREATE INDEX idx_nce_nomination ON public.nomination_criteria_evaluations(nomination_id) WHERE deleted_at IS NULL;

-- ═══ Vote Criteria Evaluations ═══
CREATE TABLE public.vote_criteria_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  vote_id UUID NOT NULL REFERENCES public.votes(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES public.judging_criteria(id),
  original_weight NUMERIC NOT NULL,
  adjusted_weight NUMERIC NOT NULL,
  rating INTEGER NOT NULL,
  justification TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(vote_id, criterion_id)
);

ALTER TABLE public.vote_criteria_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.vote_criteria_evaluations
  USING (tenant_id = (SELECT get_user_tenant_id(auth.uid())));

CREATE POLICY "authenticated_insert" ON public.vote_criteria_evaluations
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT get_user_tenant_id(auth.uid())));

CREATE INDEX idx_vce_vote ON public.vote_criteria_evaluations(vote_id) WHERE deleted_at IS NULL;

-- ═══ Add manager_criteria_adjustments to nominations ═══
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS manager_criteria_adjustments JSONB;
