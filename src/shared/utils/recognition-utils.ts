import type { TFunction } from 'i18next';
import type { CycleStatus } from '@/features/recognition/hooks/recognition/useAwardCycles';

const STATUS_WARNING_KEYS: Record<string, string> = {
  nominating: 'recognition.cycles.impactAlert.nominatingWarning',
  voting: 'recognition.cycles.impactAlert.votingWarning',
  calculating: 'recognition.cycles.impactAlert.calculatingWarning',
  announced: 'recognition.cycles.impactAlert.announcedWarning',
};

const NEXT_STATUS: Record<string, CycleStatus> = {
  configuring: 'nominating',
  nominating: 'voting',
  voting: 'calculating',
  calculating: 'announced',
  announced: 'archived',
};

export function getImpactWarning(status: string, t: TFunction): string | null {
  const key = STATUS_WARNING_KEYS[status];
  return key ? t(key) : null;
}

export function isInProcessStatus(status: string): boolean {
  return ['nominating', 'voting', 'calculating', 'announced'].includes(status);
}

export function getNextStatus(status: string): CycleStatus | null {
  return NEXT_STATUS[status] ?? null;
}


