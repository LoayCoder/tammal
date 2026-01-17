-- =====================================================
-- ENHANCED TENANT MANAGEMENT MIGRATION
-- =====================================================

-- 1. Extend tenants table with new columns
-- =====================================================

-- Contact & Business Info
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS contact_person text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS cr_number text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS vat_number text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS employee_count integer;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'SAR';

-- Subscription & Trial Fields
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS trial_start_date timestamptz;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS trial_end_date timestamptz;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS billing_email text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS max_users_override integer;

-- Security Fields
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS mfa_trust_duration_days integer DEFAULT 15;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS session_timeout_minutes integer DEFAULT 15;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS max_concurrent_sessions integer DEFAULT 1;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS glass_break_active boolean DEFAULT false;

-- 2. Create invitations table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  phone_number text,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id uuid,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  used_at timestamptz,
  used_by uuid,
  deleted_at timestamptz,
  delivery_status text DEFAULT 'pending',
  delivery_channel text DEFAULT 'email',
  email_sent_at timestamptz,
  whatsapp_sent_at timestamptz,
  last_send_error text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

-- Create indexes for invitations
CREATE INDEX IF NOT EXISTS idx_invitations_tenant_id ON public.invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(code);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

-- Enable RLS on invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
CREATE POLICY "Super admins can manage all invitations"
  ON public.invitations FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their invitations"
  ON public.invitations FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Anyone can verify invitation codes"
  ON public.invitations FOR SELECT
  USING (code IS NOT NULL AND deleted_at IS NULL);

-- 3. Add audit log entity types for new features
-- =====================================================

-- Update audit_logs to support new entity types (invitation, security)
-- This is just documentation as entity_type is text field