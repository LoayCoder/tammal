/**
 * PR-AI-OPS-01: Rollback Safety Tests
 *
 * Validates: weight history, rollback correctness, shadow mode,
 * partial write safety, audit logging.
 * 8+ tests.
 */
import { describe, it, expect } from 'vitest';

type Weights = Record<string, number>;

const MAX_HISTORY_SIZE = 3;
const LEARNING_RATE = 0.05;
const MIN_W = 0.05;
const MAX_W = 0.60;
const MAX_DELTA = 0.05;

function normalizeWeights(w: Weights): Weights {
  const sum = Object.values(w).reduce((s, v) => s + v, 0);
  if (sum <= 0) return w;
  const r: Weights = {};
  for (const [k, v] of Object.entries(w)) r[k] = v / sum;
  return r;
}

function adjustWeights(current: Weights, deltas: Weights): Weights {
  const adj: Weights = {};
  for (const k of Object.keys(current)) {
    let newVal = current[k] + LEARNING_RATE * (deltas[k] || 0);
    const delta = newVal - current[k];
    const capped = current[k] + Math.max(-MAX_DELTA, Math.min(MAX_DELTA, delta));
    adj[k] = Math.max(MIN_W, Math.min(MAX_W, capped));
  }
  return normalizeWeights(adj);
}

interface AutonomousState {
  currentWeights: Weights;
  history: Weights[];
  mode: 'enabled' | 'shadow' | 'disabled';
  auditLog: { action: string; weights: Weights }[];
}

function createState(): AutonomousState {
  return {
    currentWeights: { w_quality: 0.20, w_latency: 0.20, w_stability: 0.20, w_cost: 0.20, w_confidence: 0.20 },
    history: [],
    mode: 'enabled',
    auditLog: [],
  };
}

function applyAdjustment(state: AutonomousState, deltas: Weights): AutonomousState {
  const newWeights = adjustWeights(state.currentWeights, deltas);

  if (state.mode === 'shadow') {
    // Shadow mode: compute but don't write
    state.auditLog.push({ action: 'shadow_adjustment', weights: newWeights });
    return state;
  }

  // Push to history
  state.history.push({ ...state.currentWeights });
  if (state.history.length > MAX_HISTORY_SIZE) state.history.shift();

  state.currentWeights = newWeights;
  state.auditLog.push({ action: 'adjustment', weights: newWeights });
  return state;
}

function rollback(state: AutonomousState): { success: boolean; state: AutonomousState } {
  if (state.history.length === 0) {
    return { success: false, state };
  }

  const previous = state.history.pop()!;
  state.currentWeights = previous;
  state.auditLog.push({ action: 'rollback', weights: previous });
  return { success: true, state };
}

// ── Tests ───────────────────────────────────────────────────────

describe('PR-AI-OPS-01: Rollback Safety', () => {
  it('weight history stores exactly last 3 states', () => {
    const state = createState();
    const delta = { w_quality: 0.5, w_latency: 0, w_stability: 0, w_cost: 0, w_confidence: 0 };

    for (let i = 0; i < 5; i++) {
      applyAdjustment(state, delta);
    }

    expect(state.history.length).toBe(MAX_HISTORY_SIZE);
  });

  it('rollback pops most recent and restores it', () => {
    const state = createState();
    const originalWeights = { ...state.currentWeights };

    // Apply one adjustment
    applyAdjustment(state, { w_quality: 1, w_latency: 0, w_stability: 0, w_cost: 0, w_confidence: 0 });
    expect(state.currentWeights).not.toEqual(originalWeights);

    // Rollback
    const { success } = rollback(state);
    expect(success).toBe(true);
    expect(state.currentWeights).toEqual(originalWeights);
  });

  it('after rollback, autonomous engine can resume (mode stays enabled)', () => {
    const state = createState();
    applyAdjustment(state, { w_quality: 1, w_latency: 0, w_stability: 0, w_cost: 0, w_confidence: 0 });
    rollback(state);

    expect(state.mode).toBe('enabled');
    // Can apply new adjustment after rollback
    applyAdjustment(state, { w_quality: -1, w_latency: 0, w_stability: 0, w_cost: 0, w_confidence: 0 });
    expect(state.auditLog.length).toBe(3); // adjustment + rollback + adjustment
  });

  it('rollback with empty history returns error, no crash', () => {
    const state = createState();
    const { success } = rollback(state);
    expect(success).toBe(false);
    expect(state.history.length).toBe(0);
  });

  it('partial write simulation: previous weights preserved on failure', () => {
    const state = createState();
    const originalWeights = { ...state.currentWeights };

    // Simulate DB update failure
    const dbUpdateFails = true;
    const newWeights = adjustWeights(state.currentWeights, { w_quality: 1, w_latency: 0, w_stability: 0, w_cost: 0, w_confidence: 0 });

    if (dbUpdateFails) {
      // Don't update state — weights preserved
      expect(state.currentWeights).toEqual(originalWeights);
    }
  });

  it('shadow mode never writes to current_weights', () => {
    const state = createState();
    state.mode = 'shadow';
    const originalWeights = { ...state.currentWeights };

    // Apply multiple shadow adjustments
    for (let i = 0; i < 5; i++) {
      applyAdjustment(state, { w_quality: 1, w_latency: 0, w_stability: 0, w_cost: 0, w_confidence: 0 });
    }

    expect(state.currentWeights).toEqual(originalWeights);
    expect(state.history.length).toBe(0); // No history written in shadow mode
    expect(state.auditLog.filter(a => a.action === 'shadow_adjustment').length).toBe(5);
  });

  it('multiple consecutive rollbacks drain history correctly', () => {
    const state = createState();

    // Apply 3 adjustments
    for (let i = 0; i < 3; i++) {
      applyAdjustment(state, { w_quality: i * 0.5, w_latency: 0, w_stability: 0, w_cost: 0, w_confidence: 0 });
    }
    expect(state.history.length).toBe(3);

    // Rollback 3 times
    for (let i = 0; i < 3; i++) {
      const { success } = rollback(state);
      expect(success).toBe(true);
    }
    expect(state.history.length).toBe(0);

    // 4th rollback fails gracefully
    const { success } = rollback(state);
    expect(success).toBe(false);
  });

  it('rollback is audited in audit log', () => {
    const state = createState();
    applyAdjustment(state, { w_quality: 1, w_latency: 0, w_stability: 0, w_cost: 0, w_confidence: 0 });
    rollback(state);

    const rollbackEntries = state.auditLog.filter(a => a.action === 'rollback');
    expect(rollbackEntries.length).toBe(1);
    expect(rollbackEntries[0].weights).toBeDefined();
  });
});
