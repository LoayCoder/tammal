
-- AI Pending Requests — Admin Approval Gate for high-risk AI operations
CREATE TABLE public.ai_pending_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  user_id UUID NOT NULL,
  feature TEXT NOT NULL,
  request_payload_hash TEXT NOT NULL,
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  risk_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  decided_at TIMESTAMP WITH TIME ZONE,
  decided_by UUID
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_ai_pending_request_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid ai_pending_request status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_ai_pending_request_status
BEFORE INSERT OR UPDATE ON public.ai_pending_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_ai_pending_request_status();

-- Index for tenant + status lookup
CREATE INDEX idx_ai_pending_requests_tenant_status ON public.ai_pending_requests (tenant_id, status);

-- RLS
ALTER TABLE public.ai_pending_requests ENABLE ROW LEVEL SECURITY;

-- Tenant users can read their own pending requests
CREATE POLICY "Users can view own pending requests"
ON public.ai_pending_requests
FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND user_id = auth.uid()
);

-- Admins can view all tenant pending requests
CREATE POLICY "Admins can view all tenant pending requests"
ON public.ai_pending_requests
FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'tenant_admin')
  )
);

-- Only admins can update (approve/reject)
CREATE POLICY "Admins can update pending requests"
ON public.ai_pending_requests
FOR UPDATE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'tenant_admin')
  )
);

-- Insert is done via service role from edge function, but allow user insert for their own
CREATE POLICY "Users can insert own pending requests"
ON public.ai_pending_requests
FOR INSERT
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND user_id = auth.uid()
);
