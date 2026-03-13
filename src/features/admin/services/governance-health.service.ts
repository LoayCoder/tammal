import { supabase } from '@/integrations/supabase/client';

export interface HealthCheckResult {
  status: 'ok' | 'warning' | 'error';
  message: string;
  lastChecked: Date;
}

export async function checkQueueSync(tenantId: string): Promise<HealthCheckResult> {
  const now = new Date();
  try {
    // Check if recent actions have corresponding queue items
    const { data: actions } = await supabase
      .from('objective_actions')
      .select('id')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!actions || actions.length === 0) {
      return { status: 'ok', message: 'No actions to verify', lastChecked: now };
    }

    const actionIds = actions.map(a => a.id);
    const { data: queueItems } = await supabase
      .from('task_queue_items')
      .select('action_id')
      .in('action_id', actionIds)
      .is('deleted_at', null);

    const syncedCount = queueItems?.length ?? 0;
    if (syncedCount === actionIds.length) {
      return { status: 'ok', message: `${syncedCount}/${actionIds.length} actions synced`, lastChecked: now };
    }
    if (syncedCount > 0) {
      return { status: 'warning', message: `${syncedCount}/${actionIds.length} actions synced`, lastChecked: now };
    }
    return { status: 'error', message: 'No queue items found for recent actions', lastChecked: now };
  } catch {
    return { status: 'error', message: 'Failed to check queue sync', lastChecked: now };
  }
}

export async function checkSlaMonitor(tenantId: string): Promise<HealthCheckResult> {
  const now = new Date();
  try {
    const { data, error } = await supabase
      .from('objective_actions')
      .select('id, sla_status')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .not('sla_minutes', 'is', null)
      .limit(10);

    if (error) throw error;
    if (!data || data.length === 0) {
      return { status: 'ok', message: 'No SLA-tracked tasks found', lastChecked: now };
    }

    const withStatus = data.filter(d => d.sla_status !== null);
    if (withStatus.length === data.length) {
      return { status: 'ok', message: `${data.length} tasks have SLA status`, lastChecked: now };
    }
    return { status: 'warning', message: `${withStatus.length}/${data.length} tasks have SLA status`, lastChecked: now };
  } catch {
    return { status: 'error', message: 'Failed to check SLA monitor', lastChecked: now };
  }
}

export async function checkEscalationSystem(tenantId: string): Promise<HealthCheckResult> {
  const now = new Date();
  try {
    const { data, error } = await supabase
      .from('escalation_events')
      .select('id')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) {
      return { status: 'warning', message: 'No escalation events found (system idle)', lastChecked: now };
    }
    return { status: 'ok', message: 'Escalation events present', lastChecked: now };
  } catch {
    return { status: 'error', message: 'Failed to check escalation system', lastChecked: now };
  }
}

export async function checkAuditLogs(tenantId: string): Promise<HealthCheckResult> {
  const now = new Date();
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) {
      return { status: 'warning', message: 'No audit log entries found', lastChecked: now };
    }
    return { status: 'ok', message: `Last entry: ${new Date(data[0].created_at).toLocaleString()}`, lastChecked: now };
  } catch {
    return { status: 'error', message: 'Failed to check audit logs', lastChecked: now };
  }
}

export async function checkTenantIsolation(tenantId: string): Promise<HealthCheckResult> {
  const now = new Date();
  try {
    // Verify RLS is enforced by checking that queries only return tenant-scoped data
    const { data, error } = await supabase
      .from('objective_actions')
      .select('tenant_id')
      .limit(20);

    if (error) throw error;
    if (!data || data.length === 0) {
      return { status: 'ok', message: 'No data to verify isolation', lastChecked: now };
    }

    const crossTenant = data.filter(d => d.tenant_id !== tenantId);
    if (crossTenant.length > 0) {
      return { status: 'error', message: `RLS VIOLATION: ${crossTenant.length} cross-tenant rows detected`, lastChecked: now };
    }
    return { status: 'ok', message: `${data.length} rows verified, all tenant-scoped`, lastChecked: now };
  } catch {
    return { status: 'error', message: 'Failed to check tenant isolation', lastChecked: now };
  }
}

export async function checkCapacityCalculations(tenantId: string): Promise<HealthCheckResult> {
  const now = new Date();
  try {
    const { data, error } = await supabase
      .from('employee_capacity')
      .select('id')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) {
      return { status: 'warning', message: 'No capacity records configured', lastChecked: now };
    }
    return { status: 'ok', message: 'Capacity records present', lastChecked: now };
  } catch {
    return { status: 'error', message: 'Failed to check capacity', lastChecked: now };
  }
}

export type HealthCheckKey = 'queueSync' | 'slaMonitor' | 'escalation' | 'auditLogs' | 'tenantIsolation' | 'capacity';

export async function runAllHealthChecks(tenantId: string): Promise<Record<HealthCheckKey, HealthCheckResult>> {
  const [queueSync, slaMonitor, escalation, auditLogs, tenantIsolation, capacity] = await Promise.all([
    checkQueueSync(tenantId),
    checkSlaMonitor(tenantId),
    checkEscalationSystem(tenantId),
    checkAuditLogs(tenantId),
    checkTenantIsolation(tenantId),
    checkCapacityCalculations(tenantId),
  ]);

  return { queueSync, slaMonitor, escalation, auditLogs, tenantIsolation, capacity };
}
