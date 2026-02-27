// ── Cycle Builder feature types ──
import type { CreateCycleInput } from '@/hooks/recognition/useAwardCycles';

export type CycleStep = 'basics' | 'themes' | 'fairness' | 'review';

export interface FairnessSettings {
  cliqueThreshold: number;
  demographicParityTarget: number;
  visibilityBiasCorrection: boolean;
  publishRawScores: boolean;
  allowAppeals: boolean;
}

export interface FairnessConfig {
  biasDetection: {
    cliqueThreshold: number;
    demographicParityTarget: number;
    visibilityBiasCorrection: boolean;
  };
  auditSettings: {
    publishRawScores: boolean;
    allowAppeals: boolean;
  };
}

export type { CreateCycleInput };

export const DEFAULT_FAIRNESS: FairnessSettings = {
  cliqueThreshold: 0.4,
  demographicParityTarget: 0.8,
  visibilityBiasCorrection: true,
  publishRawScores: true,
  allowAppeals: true,
};

export const DEFAULT_FORM: CreateCycleInput = {
  name: '',
  nomination_start: '',
  nomination_end: '',
  peer_endorsement_end: '',
  voting_start: '',
  voting_end: '',
  audit_review_days: 3,
  announcement_date: '',
};

export function buildFairnessConfig(fairness: FairnessSettings): FairnessConfig {
  return {
    biasDetection: {
      cliqueThreshold: fairness.cliqueThreshold,
      demographicParityTarget: fairness.demographicParityTarget,
      visibilityBiasCorrection: fairness.visibilityBiasCorrection,
    },
    auditSettings: {
      publishRawScores: fairness.publishRawScores,
      allowAppeals: fairness.allowAppeals,
    },
  };
}

export function isBasicsValid(form: CreateCycleInput): boolean {
  return !!(form.name && form.nomination_start && form.nomination_end &&
    form.peer_endorsement_end && form.voting_start && form.voting_end && form.announcement_date);
}
