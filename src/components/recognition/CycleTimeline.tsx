import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { AwardCycle } from '@/hooks/recognition/useAwardCycles';

const PHASES = [
  { key: 'nomination_start', labelKey: 'recognition.timeline.nominationStart' },
  { key: 'nomination_end', labelKey: 'recognition.timeline.nominationEnd' },
  { key: 'peer_endorsement_end', labelKey: 'recognition.timeline.endorsementEnd' },
  { key: 'voting_start', labelKey: 'recognition.timeline.votingStart' },
  { key: 'voting_end', labelKey: 'recognition.timeline.votingEnd' },
  { key: 'announcement_date', labelKey: 'recognition.timeline.announcement' },
] as const;

export function CycleTimeline({ cycle }: { cycle: AwardCycle }) {
  const { t } = useTranslation();
  const now = new Date();

  return (
    <div className="flex flex-col gap-2">
      {PHASES.map((phase, idx) => {
        const date = new Date(cycle[phase.key as keyof AwardCycle] as string);
        const isPast = date < now;
        const isNext = !isPast && (idx === 0 || new Date(cycle[PHASES[idx - 1].key as keyof AwardCycle] as string) < now);

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
