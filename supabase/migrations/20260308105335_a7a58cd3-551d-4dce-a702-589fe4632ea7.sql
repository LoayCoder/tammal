
CREATE TABLE public.endorsement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  nomination_id UUID NOT NULL REFERENCES public.nominations(id) ON DELETE CASCADE,
  requested_user_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  UNIQUE (nomination_id, requested_user_id)
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_endorsement_request_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'completed', 'declined') THEN
    RAISE EXCEPTION 'Invalid endorsement_request status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_endorsement_request_status
  BEFORE INSERT OR UPDATE ON public.endorsement_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_endorsement_request_status();

-- RLS
ALTER TABLE public.endorsement_requests ENABLE ROW LEVEL SECURITY;

-- Users can see requests for their tenant
CREATE POLICY "tenant_isolation" ON public.endorsement_requests
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));

-- Nominator can insert requests
CREATE POLICY "nominator_can_insert" ON public.endorsement_requests
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
    AND requested_by = auth.uid()
  );

-- Requested user or nominator can update
CREATE POLICY "can_update_own" ON public.endorsement_requests
  FOR UPDATE USING (
    requested_user_id = auth.uid() OR requested_by = auth.uid()
  );

-- Index for fast lookups
CREATE INDEX idx_endorsement_requests_requested_user ON public.endorsement_requests(requested_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_endorsement_requests_nomination ON public.endorsement_requests(nomination_id) WHERE deleted_at IS NULL;
