/**
 * Workload Intelligence Service
 *
 * Pure async functions for computing workload metrics:
 * - Utilization percentage
 * - Burnout risk score
 * - Strategic alignment score
 * - Priority score (dynamic)
 *
 * No React imports — consumed by hooks only.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  DEFAULT_CAPACITY_MINUTES,
  UTILIZATION_THRESHOLDS,
  BURNOUT_FLAGS,
  BURNOUT_SCORE_WEIGHTS,
  BURNOUT_SCORE_NORMALIZATION,
} from '@/config/workload';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface UtilizationResult {
  employeeId: string;
  activeMinutes: number;
  capacityMinutes: number;
  utilization: number; // 0–999
  classification: 'underutilized' | 'healthy' | 'high_load' | 'burnout_risk';
}

export interface BurnoutRiskResult {
  employeeId: string;
  score: number; // 0–100
  flags: {
    overCapacity: boolean;
    overdueExcess: boolean;
    offHoursExcess: boolean;
  };
}

export interface AlignmentResult {
  employeeId: string;
  linkedActions: number;
  totalActions: number;
  score: number; // 0–100
}

export interface PriorityScoreInput {
  strategicImportance: number; // 0–10
  urgency: number;            // 0–10
  riskSeverity: number;       // 0–10
  managerPriority: number;    // 0–10
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function classifyUtilization(pct: number): UtilizationResult['classification'] {
  if (pct < UTILIZATION_THRESHOLDS.UNDERUTILIZED) return 'underutilized';
  if (pct <= UTILIZATION_THRESHOLDS.HEALTHY_MAX) return 'healthy';
  if (pct <= UTILIZATION_THRESHOLDS.HIGH_LOAD_MAX) return 'high_load';
  return 'burnout_risk';
}

/* ------------------------------------------------------------------ */
/*  Core functions                                                     */
/* ------------------------------------------------------------------ */

/**
 * Calculate utilization for one employee.
 * utilization = SUM(estimated_hours of active actions) / daily_capacity_minutes
 */
export async function calculateUtilization(
  employeeId: string,
  tenantId: string,
): Promise<UtilizationResult> {
  // Fetch capacity (or use default)
  const { data: cap } = await supabase
    .from('employee_capacity')
    .select('daily_capacity_minutes')
    .eq('user_id', employeeId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  const capacityMinutes = cap?.daily_capacity_minutes ?? DEFAULT_CAPACITY_MINUTES;

  // Sum estimated_hours from active objective_actions assigned to this employee
  const { data: actions } = await supabase
    .from('objective_actions')
    .select('estimated_hours')
    .eq('assignee_id', employeeId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .neq('status', 'completed');

  const activeMinutes = (actions ?? []).reduce(
    (sum, a) => sum + (a.estimated_hours ?? 0) * 60,
    0,
  );

  const utilization = capacityMinutes > 0
    ? Math.round((activeMinutes / capacityMinutes) * 100)
    : 0;

  return {
    employeeId,
    activeMinutes,
    capacityMinutes,
    utilization,
    classification: classifyUtilization(utilization),
  };
}

/**
 * Detect burnout risk for one employee.
 * Flags: daily_work > OVER_CAPACITY_MINUTES, overdue > OVERDUE_COUNT, off_hours > OFF_HOURS_MINUTES.
 * Score: 0-100 weighted composite.
 */
export async function detectBurnoutRisk(
  employeeId: string,
  tenantId: string,
): Promise<BurnoutRiskResult> {
  const todayStr = new Date().toISOString().split('T')[0];

  // Active + overdue actions
  const { data: actions } = await supabase
    .from('objective_actions')
    .select('estimated_hours, planned_end, status')
    .eq('assignee_id', employeeId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .neq('status', 'completed');

  const activeMinutes = (actions ?? []).reduce(
    (s, a) => s + (a.estimated_hours ?? 0) * 60,
    0,
  );

  const overdueCount = (actions ?? []).filter(
    a => a.planned_end && a.planned_end.split('T')[0] < todayStr,
  ).length;

  // Off-hours work
  const { data: offHours } = await supabase
    .from('off_hours_sessions')
    .select('total_minutes')
    .eq('employee_id', employeeId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null);

  const offHoursMinutes = (offHours ?? []).reduce(
    (s, o) => s + (o.total_minutes ?? 0),
    0,
  );

  const overCapacity = activeMinutes > BURNOUT_FLAGS.OVER_CAPACITY_MINUTES;
  const overdueExcess = overdueCount > BURNOUT_FLAGS.OVERDUE_COUNT;
  const offHoursExcess = offHoursMinutes > BURNOUT_FLAGS.OFF_HOURS_MINUTES;

  // Weighted score: capacity 40%, overdue 35%, off-hours 25%
  let score = 0;
  if (overCapacity) score += Math.min(((activeMinutes - BURNOUT_FLAGS.OVER_CAPACITY_MINUTES) / BURNOUT_SCORE_NORMALIZATION.CAPACITY) * BURNOUT_SCORE_WEIGHTS.CAPACITY, BURNOUT_SCORE_WEIGHTS.CAPACITY);
  if (overdueExcess) score += Math.min((overdueCount / BURNOUT_SCORE_NORMALIZATION.OVERDUE) * BURNOUT_SCORE_WEIGHTS.OVERDUE, BURNOUT_SCORE_WEIGHTS.OVERDUE);
  if (offHoursExcess) score += Math.min((offHoursMinutes / BURNOUT_SCORE_NORMALIZATION.OFF_HOURS) * BURNOUT_SCORE_WEIGHTS.OFF_HOURS, BURNOUT_SCORE_WEIGHTS.OFF_HOURS);
  score = Math.round(Math.min(score, 100));

  return {
    employeeId,
    score,
    flags: { overCapacity, overdueExcess, offHoursExcess },
  };
}

/**
 * Compute alignment score for one employee.
 * alignment = actions_linked_to_initiatives / total_actions
 */
export async function computeAlignmentScore(
  employeeId: string,
  tenantId?: string,
): Promise<AlignmentResult> {
  let query = supabase
    .from('objective_actions')
    .select('id, initiative_id')
    .eq('assignee_id', employeeId)
    .is('deleted_at', null);
  if (tenantId) query = query.eq('tenant_id', tenantId);
  const { data: actions } = await query;

  const total = (actions ?? []).length;
  const linked = (actions ?? []).filter(a => !!a.initiative_id).length;
  const score = total > 0 ? Math.round((linked / total) * 100) : 100;

  return { employeeId, linkedActions: linked, totalActions: total, score };
}

/**
 * Compute dynamic priority score.
 * Formula: (strategic_importance × 0.4) + (urgency × 0.3) + (risk × 0.2) + (manager_priority × 0.1)
 */
export function computePriorityScore(input: PriorityScoreInput): number {
  return +(
    input.strategicImportance * 0.4 +
    input.urgency * 0.3 +
    input.riskSeverity * 0.2 +
    input.managerPriority * 0.1
  ).toFixed(2);
}

/**
 * Persist computed metrics to the workload_metrics table (upsert).
 */
export async function upsertWorkloadMetrics(
  tenantId: string,
  employeeId: string,
  metrics: {
    utilization_percentage: number;
    burnout_risk_score: number;
    alignment_score: number;
  },
) {
  const { error } = await supabase
    .from('workload_metrics')
    .upsert(
      {
        tenant_id: tenantId,
        employee_id: employeeId,
        ...metrics,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,employee_id' },
    );
  if (error) throw error;
}
