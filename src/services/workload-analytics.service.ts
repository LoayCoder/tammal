/**
 * Workload Analytics Service
 *
 * Advanced analytics functions:
 * - Execution velocity
 * - Workload heatmap snapshots
 * - Initiative risk scoring
 * - Strategic alignment snapshots
 */

import { supabase } from '@/integrations/supabase/client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VelocityResult {
  departmentId: string | null;
  initiativeId: string | null;
  actionsCompleted: number;
  periodDays: number;
  velocityScore: number;
}

export interface HeatmapEntry {
  employeeId: string;
  departmentId: string | null;
  utilizationPct: number;
  classification: 'underutilized' | 'healthy' | 'high_load' | 'burnout_risk';
}

export interface InitiativeRiskResult {
  initiativeId: string;
  overdueScore: number;
  velocityScore: number;
  resourceScore: number;
  escalationScore: number;
  riskScore: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function classifyUtilization(pct: number): HeatmapEntry['classification'] {
  if (pct < 60) return 'underutilized';
  if (pct <= 90) return 'healthy';
  if (pct <= 110) return 'high_load';
  return 'burnout_risk';
}

/* ------------------------------------------------------------------ */
/*  Core functions                                                     */
/* ------------------------------------------------------------------ */

/**
 * Calculate execution velocity: completed actions / period days.
 * Groups by department and initiative.
 */
export async function calculateExecutionVelocity(
  tenantId: string,
  periodDays: number = 30,
): Promise<VelocityResult[]> {
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - periodDays);
  const periodStartStr = periodStart.toISOString();

  const { data: actions } = await supabase
    .from('objective_actions')
    .select('id, initiative_id, assignee_id, status, updated_at')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .eq('status', 'completed')
    .gte('updated_at', periodStartStr);

  // Get employee departments
  const { data: employees } = await supabase
    .from('employees')
    .select('id, department_id')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null);

  const empDeptMap: Record<string, string | null> = {};
  (employees ?? []).forEach(e => { empDeptMap[e.id] = e.department_id; });

  // Group by department
  const deptGroups: Record<string, number> = {};
  const initGroups: Record<string, number> = {};

  (actions ?? []).forEach(a => {
    const dept = empDeptMap[a.assignee_id ?? ''] ?? 'unassigned';
    deptGroups[dept] = (deptGroups[dept] ?? 0) + 1;
    if (a.initiative_id) {
      initGroups[a.initiative_id] = (initGroups[a.initiative_id] ?? 0) + 1;
    }
  });

  const results: VelocityResult[] = [];

  for (const [dept, count] of Object.entries(deptGroups)) {
    results.push({
      departmentId: dept === 'unassigned' ? null : dept,
      initiativeId: null,
      actionsCompleted: count,
      periodDays,
      velocityScore: Math.round((count / periodDays) * 100) / 100,
    });
  }

  for (const [initId, count] of Object.entries(initGroups)) {
    results.push({
      departmentId: null,
      initiativeId: initId,
      actionsCompleted: count,
      periodDays,
      velocityScore: Math.round((count / periodDays) * 100) / 100,
    });
  }

  return results;
}

/**
 * Generate workload heatmap for all employees.
 */
export async function generateWorkloadHeatmap(
  tenantId: string,
): Promise<HeatmapEntry[]> {
  const { data: employees } = await supabase
    .from('employees')
    .select('id, department_id')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .eq('status', 'active');

  const { data: capacities } = await supabase
    .from('employee_capacity')
    .select('user_id, daily_capacity_minutes')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null);

  const capMap: Record<string, number> = {};
  (capacities ?? []).forEach(c => { capMap[c.user_id] = c.daily_capacity_minutes; });

  const { data: actions } = await supabase
    .from('objective_actions')
    .select('assignee_id, estimated_hours')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .neq('status', 'completed');

  // Sum estimated hours per assignee
  const loadMap: Record<string, number> = {};
  (actions ?? []).forEach(a => {
    if (a.assignee_id) {
      loadMap[a.assignee_id] = (loadMap[a.assignee_id] ?? 0) + (a.estimated_hours ?? 0) * 60;
    }
  });

  return (employees ?? []).map(emp => {
    const capacity = capMap[emp.id] ?? 480;
    const activeMinutes = loadMap[emp.id] ?? 0;
    const pct = capacity > 0 ? Math.round((activeMinutes / capacity) * 100) : 0;

    return {
      employeeId: emp.id,
      departmentId: emp.department_id,
      utilizationPct: pct,
      classification: classifyUtilization(pct),
    };
  });
}

/**
 * Calculate initiative risk score using weighted composite.
 * Weights: overdue (40%), velocity (30%), resource (20%), escalations (10%).
 */
export async function calculateInitiativeRisk(
  tenantId: string,
  initiativeId: string,
): Promise<InitiativeRiskResult> {
  const todayStr = new Date().toISOString().split('T')[0];

  // Get actions for this initiative
  const { data: actions } = await supabase
    .from('objective_actions')
    .select('id, status, planned_end, assignee_id, estimated_hours')
    .eq('initiative_id', initiativeId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null);

  const total = (actions ?? []).length;
  const completed = (actions ?? []).filter(a => a.status === 'completed').length;
  const overdue = (actions ?? []).filter(
    a => a.planned_end && a.planned_end.split('T')[0] < todayStr && a.status !== 'completed'
  ).length;

  // Overdue score (0-100): % of incomplete actions that are overdue
  const incomplete = total - completed;
  const overdueScore = incomplete > 0 ? Math.round((overdue / incomplete) * 100) : 0;

  // Velocity score (0-100): inverse of completion rate
  const velocityScore = total > 0 ? Math.round((1 - completed / total) * 100) : 0;

  // Resource score: check if assignees are overloaded
  const assigneeIds = [...new Set((actions ?? []).map(a => a.assignee_id).filter(Boolean))];
  let resourceScore = 0;
  if (assigneeIds.length > 0) {
    const { data: metrics } = await supabase
      .from('workload_metrics')
      .select('utilization_percentage')
      .eq('tenant_id', tenantId)
      .in('employee_id', assigneeIds as string[])
      .is('deleted_at', null);

    const overloaded = (metrics ?? []).filter(m => m.utilization_percentage > 100).length;
    resourceScore = assigneeIds.length > 0 ? Math.round((overloaded / assigneeIds.length) * 100) : 0;
  }

  // Escalation score
  const actionIds = (actions ?? []).map(a => a.id);
  let escalationScore = 0;
  if (actionIds.length > 0) {
    const { data: escalations } = await supabase
      .from('escalation_events')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('task_id', actionIds)
      .is('deleted_at', null);

    escalationScore = Math.min((escalations ?? []).length * 20, 100);
  }

  // Composite: overdue 40%, velocity 30%, resource 20%, escalations 10%
  const riskScore = Math.round(
    overdueScore * 0.4 +
    velocityScore * 0.3 +
    resourceScore * 0.2 +
    escalationScore * 0.1
  );

  return {
    initiativeId,
    overdueScore,
    velocityScore,
    resourceScore,
    escalationScore,
    riskScore,
  };
}

/**
 * Snapshot alignment metrics for all employees in a tenant.
 */
export async function snapshotAlignmentMetrics(
  tenantId: string,
): Promise<{ userId: string; aligned: number; total: number; score: number }[]> {
  const { data: actions } = await supabase
    .from('objective_actions')
    .select('assignee_id, initiative_id')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null);

  // Group by assignee
  const userMap: Record<string, { total: number; linked: number }> = {};
  (actions ?? []).forEach(a => {
    if (!a.assignee_id) return;
    if (!userMap[a.assignee_id]) userMap[a.assignee_id] = { total: 0, linked: 0 };
    userMap[a.assignee_id].total++;
    if (a.initiative_id) userMap[a.assignee_id].linked++;
  });

  return Object.entries(userMap).map(([userId, data]) => ({
    userId,
    aligned: data.linked,
    total: data.total,
    score: data.total > 0 ? Math.round((data.linked / data.total) * 100) : 100,
  }));
}
