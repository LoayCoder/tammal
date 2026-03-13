import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { AwardCycle } from '@/features/recognition/hooks/recognition/useAwardCycles';

const PHASES = [
  { key: 'nomination_start', labelKey: 'recognition.timeline.nominationStart' },
  { key: 'nomination_end', labelKey: 'recognition.timeline.nominationEnd' },
  { key: 'peer_endorsement_end', labelKey: 'recognition.timeline.endorsementEnd' },
  { key: 'voting_start', labelKey: 'recognition.timeline.votingStart' },
  { key: 'voting_end', labelKey: 'recognition.timeline.votingEnd' },
  { key: 'announcement_date', labelKey: 'recognition.timeline.announcement' },
] as const;

const STATUS_PHASE_INDEX: Record<string, number> = {
  configuring: -1,
  nominating: 0,
  voting: 3,
  calculating: 4,
  announced: 5,
  archived: 5,
};

export function CycleTimeline({ cycle }: { cycle: AwardCycle }) {
  const { t } = useTranslation();
  const now = new Date();
  const statusPhaseIdx = STATUS_PHASE_INDEX[cycle.status] ?? -1;

  return (
    <div className="flex flex-col gap-2">
      {PHASES.map((phase, idx) => {
        const date = new Date(cycle[phase.key as keyof AwardCycle] as string);
        const isPast = date < now || idx <= statusPhaseIdx;
        const prevPast = idx === 0
          ? true
          : new Date(cycle[PHASES[idx - 1].key as keyof AwardCycle] as string) < now || (idx - 1) <= statusPhaseIdx;
        const isNext = !isPast && prevPast;

        return (
          <div key={phase.key} className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full shrink-0 ${isNext ? 'bg-primary animate-pulse' : isPast ? 'bg-muted-foreground' : 'bg-muted'}`} />
            <div className="flex-1 flex items-center justify-between gap-2">
              <span className={`text-sm ${isNext ? 'font-semibold text-primary' : isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                {t(phase.labelKey)}
              </span>
              <span className="text-xs text-muted-foreground">{format(date, 'MMM d, yyyy')}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}


