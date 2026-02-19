
-- Create mood_definitions table for tenant-customizable mood levels
CREATE TABLE public.mood_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  key TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '😐',
  label_en TEXT NOT NULL,
  label_ar TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'text-muted-foreground',
  score INTEGER NOT NULL DEFAULT 3,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  UNIQUE(tenant_id, key)
);

-- Enable RLS
ALTER TABLE public.mood_definitions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Super admins can manage all mood definitions"
  ON public.mood_definitions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their mood definitions"
  ON public.mood_definitions FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view active mood definitions in their tenant"
  ON public.mood_definitions FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND is_active = true AND deleted_at IS NULL);

-- Updated_at trigger
CREATE TRIGGER update_mood_definitions_updated_at
  BEFORE UPDATE ON public.mood_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default mood levels for each existing tenant
INSERT INTO public.mood_definitions (tenant_id, key, emoji, label_en, label_ar, color, score, sort_order, is_default)
SELECT 
  t.id,
  m.key,
  m.emoji,
  m.label_en,
  m.label_ar,
  m.color,
  m.score,
  m.sort_order,
  true
FROM public.tenants t
CROSS JOIN (VALUES
  ('great',      '😄', 'Great',     'ممتاز',             'text-chart-1',    5, 0),
  ('good',       '🙂', 'Good',      'جيد',               'text-chart-2',    4, 1),
  ('okay',       '😐', 'Okay',      'عادي',              'text-chart-4',    3, 2),
  ('struggling', '😟', 'Struggling','أعاني',             'text-destructive', 2, 3),
  ('need_help',  '😢', 'Need Help', 'بحاجة للمساعدة',   'text-destructive', 1, 4)
) AS m(key, emoji, label_en, label_ar, color, score, sort_order)
WHERE t.deleted_at IS NULL;

-- Auto-seed defaults for new tenants
CREATE OR REPLACE FUNCTION public.seed_default_mood_definitions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.mood_definitions (tenant_id, key, emoji, label_en, label_ar, color, score, sort_order, is_default)
  VALUES
    (NEW.id, 'great',      '😄', 'Great',      'ممتاز',             'text-chart-1',     5, 0, true),
    (NEW.id, 'good',       '🙂', 'Good',       'جيد',               'text-chart-2',     4, 1, true),
    (NEW.id, 'okay',       '😐', 'Okay',       'عادي',              'text-chart-4',     3, 2, true),
    (NEW.id, 'struggling', '😟', 'Struggling',  'أعاني',             'text-destructive', 2, 3, true),
    (NEW.id, 'need_help',  '😢', 'Need Help',   'بحاجة للمساعدة',   'text-destructive', 1, 4, true);
  RETURN NEW;
END;
$$;

CREATE TRIGGER seed_mood_definitions_on_tenant_create
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_mood_definitions();
