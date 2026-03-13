import { supabase } from '@/integrations/supabase/client';

export async function manageSandbox(action: string, sandboxId: string) {
  const { data, error } = await supabase.functions.invoke('ai-governance', {
    body: { action, params: { sandbox_id: sandboxId } },
  });
  if (error) throw error;
  return data;
}

export async function toggleAutonomousMode(tenantId: string, feature: string, mode: string) {
  const { data, error } = await supabase.functions.invoke('ai-governance', {
    body: { action: 'toggle_autonomous_mode', params: { tenant_id: tenantId, feature, mode } },
  });
  if (error) throw error;
  return data;
}

export async function rollbackWeights(tenantId: string, feature: string) {
  const { data, error } = await supabase.functions.invoke('ai-governance', {
    body: { action: 'rollback_weights', params: { tenant_id: tenantId, feature } },
  });
  if (error) throw error;
  return data;
}
