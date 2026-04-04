import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTaskTimeTracking } from '@/features/tasks/hooks/useTaskTimeTracking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Square, Plus, Trash2, Clock, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function LiveTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const calc = () => Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    setElapsed(calc());
    const interval = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return (
    <span className="font-mono text-sm font-semibold text-primary tabular-nums">
      {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </span>
  );
}

export function TaskTimeTrackingPanel({ taskId }: { taskId: string }) {
  const { t } = useTranslation();
  const { entries, isPending, activeEntry, totalMinutes, startTimer, stopTimer, addManualEntry, removeEntry, isStarting, isStopping } = useTaskTimeTracking(taskId);
  const [showManual, setShowManual] = useState(false);
  const [manualMinutes, setManualMinutes] = useState(30);
  const [manualDesc, setManualDesc] = useState('');

  const handleManualAdd = () => {
    if (manualMinutes < 1) return;
    addManualEntry(
      { minutes: manualMinutes, description: manualDesc },
      { onSuccess: () => { setShowManual(false); setManualDesc(''); toast.success(t('timeTracking.entryAdded')); } } as any,
    );
  };

  if (isPending) return <Skeleton className="h-16" />;

  return (
    <div className="space-y-3">
      {/* Main row: total + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-xs text-muted-foreground">{t('timeTracking.title')}</span>
          <span className="text-xs font-semibold">{formatDuration(totalMinutes)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {activeEntry ? (
            <>
              <LiveTimer startedAt={activeEntry.started_at} />
              <Button size="sm" variant="destructive" onClick={() => stopTimer()} disabled={isStopping} className="h-7 gap-1 text-xs px-2.5">
                <Square className="h-3 w-3" />{t('timeTracking.stop')}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" onClick={() => startTimer()} disabled={isStarting} className="h-7 gap-1 text-xs px-2.5">
                <Play className="h-3 w-3" />{t('timeTracking.start')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowManual(!showManual)} className="h-7 gap-1 text-xs px-2">
                <Plus className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Manual entry form */}
      {showManual && (
        <div className="flex items-end gap-2 ps-6">
          <div className="w-20">
            <label className="text-2xs text-muted-foreground">{t('timeTracking.minutes')}</label>
            <Input type="number" min={1} value={manualMinutes} onChange={e => setManualMinutes(Number(e.target.value))} className="h-7 text-xs" />
          </div>
          <div className="flex-1">
            <label className="text-2xs text-muted-foreground">{t('timeTracking.description')}</label>
            <Input value={manualDesc} onChange={e => setManualDesc(e.target.value)} placeholder={t('timeTracking.descPlaceholder')} className="h-7 text-xs" />
          </div>
          <Button size="sm" onClick={handleManualAdd} className="h-7 text-xs">{t('common.save')}</Button>
        </div>
      )}

      {/* Entries list (compact) */}
      {entries.filter(e => !e.is_running).length > 0 && (
        <div className="space-y-0.5 ps-6">
          {entries.filter(e => !e.is_running).slice(0, 5).map(entry => (
            <div key={entry.id} className="flex items-center gap-2 py-1 group text-2xs">
              <span className="font-medium text-xs">{formatDuration(entry.duration_minutes ?? 0)}</span>
              <span className="text-muted-foreground truncate flex-1">{entry.description || format(new Date(entry.started_at), 'PP p')}</span>
              <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeEntry(entry.id)}>
                <Trash2 className="h-2.5 w-2.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
