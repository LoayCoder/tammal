import type { TFunction } from 'i18next';

const STATUS_WARNING_KEYS: Record<string, string> = {
  nominating: 'recognition.cycles.impactAlert.nominatingWarning',
  voting: 'recognition.cycles.impactAlert.votingWarning',
  calculating: 'recognition.cycles.impactAlert.calculatingWarning',
  announced: 'recognition.cycles.impactAlert.announcedWarning',
};

export function getImpactWarning(status: string, t: TFunction): string | null {
  const key = STATUS_WARNING_KEYS[status];
  return key ? t(key) : null;
}

export function isInProcessStatus(status: string): boolean {
  return ['nominating', 'voting', 'calculating', 'announced'].includes(status);
}
