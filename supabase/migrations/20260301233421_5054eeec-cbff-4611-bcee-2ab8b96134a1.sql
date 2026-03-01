
-- PR-AI-INT-05: Seed AI governance permissions (table + matview already created)

INSERT INTO public.permissions (code, name, description, category)
VALUES
  ('ai_governance.view', 'AI Governance View', 'View AI governance executive dashboard', 'ai_governance'),
  ('ai_governance.engineering', 'AI Governance Engineering', 'View AI routing internals and Thompson sampling data', 'ai_governance'),
  ('ai_governance.finance', 'AI Governance Finance', 'View AI cost data and manage budgets', 'ai_governance'),
  ('ai_governance.risk', 'AI Governance Risk', 'View AI SLA health and manage penalties', 'ai_governance')
ON CONFLICT (code) DO NOTHING;

-- Grant governance permissions to existing Administrator system roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.is_system_role = true
  AND r.base_role = 'tenant_admin'
  AND p.code IN ('ai_governance.view', 'ai_governance.engineering', 'ai_governance.finance', 'ai_governance.risk')
ON CONFLICT DO NOTHING;
