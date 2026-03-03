// ── Shared types for AI Governance feature ──

export interface GovernanceAuditLogEntry {
  id: string;
  action: string;
  target_entity: string | null;
  user_id: string;
  tenant_id: string | null;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export interface AutonomousAuditLogEntry {
  id: string;
  tenant_id: string | null;
  feature: string;
  previous_weights: Record<string, number> | null;
  new_weights: Record<string, number> | null;
  adjustment_magnitude: number | null;
  adjustment_reason: string | null;
  anomaly_detected: boolean;
  hyperparameter_tuned: boolean;
  sandbox_event: string | null;
  created_at: string;
}

export interface PenaltyRow {
  id: string;
  provider: string;
  feature: string;
  penalty_multiplier: number;
  penalty_expires_at: string;
  created_at: string;
}

export interface RoutingSettings {
  ai_routing_strategy?: string;
  ai_composite_sample_score?: number;
  ai_quality_sample?: number;
  ai_cost_sample?: number;
  ai_latency_sample?: number;
  ai_ts_alpha?: number;
  ai_ts_beta?: number;
  ai_posterior_updated?: boolean;
  ai_fallback_triggered?: boolean;
  ai_forecast_risk_level?: string;
  ai_forecast_cost_weight_multiplier?: number;
  [key: string]: unknown;
}
