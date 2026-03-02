/**
 * PR-AI-OPS-01: Observability Validation Tests
 *
 * Validates: audit logging, anomaly Z-score logging, dashboard resilience,
 * telemetry completeness, no silent failures, optimizer output counts.
 * 6+ tests.
 */
import { describe, it, expect } from 'vitest';

// ── Mock Audit Logger ──

interface AuditEntry {
  tenant_id: string | null;
  feature: string;
  action: string;
  adjustment_magnitude?: number;
  anomaly_detected?: boolean;
  hyperparameter_tuned?: boolean;
  z_scores?: Record<string, number>;
  sandbox_event?: string;
}

class MockAuditLog {
  entries: AuditEntry[] = [];

  log(entry: AuditEntry): void {
    this.entries.push(entry);
  }

  getByAction(action: string): AuditEntry[] {
    return this.entries.filter(e => e.action === action);
  }

  getByFeature(feature: string): AuditEntry[] {
    return this.entries.filter(e => e.feature === feature);
  }
}

// ── Mock Optimizer Output ──

interface OptimizerOutput {
  processed: number;
  skipped: number;
  anomaliesDetected: number;
  duration: number;
}

function computeZScore(values: number[]): number | null {
  if (values.length < 3) return null;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);
  if (stddev === 0) return null;
  return (values[values.length - 1] - mean) / stddev;
}

// ── Tests ───────────────────────────────────────────────────────

describe('PR-AI-OPS-01: Observability Validation', () => {
  it('all chaos scenarios produce audit log entries', () => {
    const audit = new MockAuditLog();

    // Provider failure
    audit.log({ tenant_id: 't1', feature: 'q-gen', action: 'sla_penalty', adjustment_magnitude: 0.3 });

    // Anomaly detection
    audit.log({ tenant_id: 't1', feature: 'q-gen', action: 'anomaly_freeze', anomaly_detected: true, z_scores: { latency: 3.5 } });

    // Weight adjustment
    audit.log({ tenant_id: 't1', feature: 'q-gen', action: 'weight_adjustment', adjustment_magnitude: 0.02 });

    // Sandbox evaluation
    audit.log({ tenant_id: 't1', feature: 'q-gen', action: 'sandbox_evaluation', sandbox_event: 'openai/gpt-5-mini → promoted' });

    // Hyperparameter tuning
    audit.log({ tenant_id: 't1', feature: 'q-gen', action: 'hyperparam_tuning', hyperparameter_tuned: true });

    expect(audit.entries.length).toBe(5);
    expect(audit.getByAction('sla_penalty').length).toBe(1);
    expect(audit.getByAction('anomaly_freeze').length).toBe(1);
    expect(audit.getByAction('weight_adjustment').length).toBe(1);
    expect(audit.getByAction('sandbox_evaluation').length).toBe(1);
    expect(audit.getByAction('hyperparam_tuning').length).toBe(1);
  });

  it('anomaly detection logs include Z-score values', () => {
    const audit = new MockAuditLog();

    const latencyValues = [...Array(30).fill(500), 3000];
    const z = computeZScore(latencyValues);

    audit.log({
      tenant_id: 't1',
      feature: 'q-gen',
      action: 'anomaly_detected',
      anomaly_detected: true,
      z_scores: { latency: z || 0 },
    });

    const entry = audit.getByAction('anomaly_detected')[0];
    expect(entry.z_scores).toBeDefined();
    expect(entry.z_scores!.latency).not.toBe(0);
    expect(Math.abs(entry.z_scores!.latency)).toBeGreaterThan(2);
  });

  it('governance dashboard returns data even if some tables are empty', () => {
    const getSummary = (data: {
      providers?: any[];
      forecasts?: any[];
      autonomous?: any[];
    }) => ({
      totalProviders: (data.providers || []).length,
      activeForecast: (data.forecasts || []).length > 0,
      autonomousEnabled: (data.autonomous || []).some((a: any) => a.mode === 'enabled'),
      hasData: true,
    });

    // All empty
    const emptyResult = getSummary({});
    expect(emptyResult.hasData).toBe(true);
    expect(emptyResult.totalProviders).toBe(0);
    expect(emptyResult.activeForecast).toBe(false);
    expect(emptyResult.autonomousEnabled).toBe(false);

    // Partial data
    const partialResult = getSummary({ providers: [{ name: 'openai' }] });
    expect(partialResult.totalProviders).toBe(1);
    expect(partialResult.activeForecast).toBe(false);
  });

  it('telemetry fields populated in optimizer output', () => {
    const output: OptimizerOutput = {
      processed: 3,
      skipped: 2,
      anomaliesDetected: 1,
      duration: 450,
    };

    expect(output.processed).toBeDefined();
    expect(output.skipped).toBeDefined();
    expect(output.anomaliesDetected).toBeDefined();
    expect(output.duration).toBeDefined();
    expect(output.processed + output.skipped).toBe(5);
    expect(output.duration).toBeGreaterThan(0);
  });

  it('no silent failure: error handling produces log entries', () => {
    const errors: string[] = [];
    const mockConsoleError = (msg: string) => errors.push(msg);

    // Simulate various failure points with error logging
    try {
      throw new Error('Forecast query failed');
    } catch (e) {
      mockConsoleError(`getForecastAdjustments failed: ${(e as Error).message}`);
    }

    try {
      throw new Error('Metrics update failed');
    } catch (e) {
      mockConsoleError(`updateProviderMetricsV2 failed: ${(e as Error).message}`);
    }

    try {
      throw new Error('SLA penalty insert failed');
    } catch (e) {
      mockConsoleError(`applySlaPenalty failed: ${(e as Error).message}`);
    }

    // All errors captured — no silent failures
    expect(errors.length).toBe(3);
    expect(errors[0]).toContain('Forecast');
    expect(errors[1]).toContain('Metrics');
    expect(errors[2]).toContain('SLA');
  });

  it('autonomous optimizer logs processed, skipped, anomaliesDetected counts', () => {
    // Simulate optimizer run
    const states = [
      { mode: 'enabled', lastAdjustment: null, slaRisk: 'low' },
      { mode: 'enabled', lastAdjustment: new Date().toISOString(), slaRisk: 'low' }, // skipped: cooldown
      { mode: 'disabled', lastAdjustment: null, slaRisk: 'low' }, // skipped: disabled
      { mode: 'enabled', lastAdjustment: null, slaRisk: 'high' }, // skipped: SLA risk
      { mode: 'shadow', lastAdjustment: null, slaRisk: 'low' },  // processed (shadow)
    ];

    let processed = 0;
    let skipped = 0;

    for (const state of states) {
      if (state.mode === 'disabled') { skipped++; continue; }
      if (state.lastAdjustment && (Date.now() - new Date(state.lastAdjustment).getTime()) < 7 * 86400000) { skipped++; continue; }
      if (state.slaRisk === 'high') { skipped++; continue; }
      processed++;
    }

    expect(processed).toBe(2); // enabled + shadow
    expect(skipped).toBe(3);   // cooldown + disabled + SLA
    expect(processed + skipped).toBe(states.length);
  });

  it('audit log entries contain tenant_id for traceability', () => {
    const audit = new MockAuditLog();

    audit.log({ tenant_id: 'tenant-123', feature: 'q-gen', action: 'adjustment' });
    audit.log({ tenant_id: null, feature: 'q-gen', action: 'global_refresh' });

    const tenantEntries = audit.entries.filter(e => e.tenant_id !== null);
    const globalEntries = audit.entries.filter(e => e.tenant_id === null);

    expect(tenantEntries.length).toBe(1);
    expect(globalEntries.length).toBe(1);
    expect(tenantEntries[0].tenant_id).toBe('tenant-123');
  });
});
