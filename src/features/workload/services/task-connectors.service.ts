import { supabase } from '@/integrations/supabase/client';

export interface Connector {
  id: string;
  provider: string;
  status: string;
  last_sync_at: string | null;
  config: Record<string, unknown>;
}

export async function fetchTaskConnectors(tenantId?: string): Promise<Connector[]> {
  const { data, error } = await supabase
    .from('task_connectors')
    .select('*')
    .is('deleted_at', null);
  
  // Note: If RLs requires tenantId, it's handled automatically or we can add .eq('tenant_id', tenantId). The original code didn't filter by tenantId, perhaps assuming RLS handles it, but let's be safe if it is passed.
  
  if (error) throw error;
  return (data || []) as Connector[];
}
