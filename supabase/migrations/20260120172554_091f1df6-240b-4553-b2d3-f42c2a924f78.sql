-- Create login_history table to track sign-in attempts
CREATE TABLE public.login_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id),
  event_type TEXT NOT NULL DEFAULT 'login', -- login, logout, failed_login
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT,
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own login history
CREATE POLICY "Users can view their own login history"
ON public.login_history
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own login events
CREATE POLICY "Users can insert their own login events"
ON public.login_history
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Super admins can view all login history
CREATE POLICY "Super admins can view all login history"
ON public.login_history
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Tenant admins can view login history in their tenant
CREATE POLICY "Tenant admins can view tenant login history"
ON public.login_history
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX idx_login_history_created_at ON public.login_history(created_at DESC);