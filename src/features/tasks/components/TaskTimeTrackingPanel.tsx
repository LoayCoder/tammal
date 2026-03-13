import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTaskTimeTracking } from '@/features/tasks/hooks/useTaskTimeTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Skeleton } from '@/shared/components/ui/skeleton';
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
  return <span className="font-mono text-lg font-bold text-primary">{String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</span>;
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

  if (isPending) return <Skeleton className="h-32" />;

  return (
    <Card className="border-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Timer className="h-4 w-4" />
            {t('timeTracking.title')}
          </CardTitle>
          <span className="text-xs text-muted-foreground">{t('timeTracking.total')}: <span className="font-semibold text-foreground">{formatDuration(totalMinutes)}</span></span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Timer controls */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
          {activeEntry ? (
            <>
              <LiveTimer startedAt={activeEntry.started_at} />
              <Button size="sm" variant="destructive" onClick={() => stopTimer()} disabled={isStopping} className="gap-1.5">
                <Square className="h-3.5 w-3.5" />{t('timeTracking.stop')}
              </Button>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground flex-1">{t('timeTracking.notRunning')}</span>
              <Button size="sm" onClick={() => startTimer()} disabled={isStarting} className="gap-1.5">
                <Play className="h-3.5 w-3.5" />{t('timeTracking.start')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowManual(!showManual)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />{t('timeTracking.manual')}
              </Button>
            </>
          )}
        </div>

        {/* Manual entry form */}
        {showManual && (
          <div className="flex items-end gap-2 p-3 rounded-lg bg-muted/20">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">{t('timeTracking.minutes')}</label>
              <Input type="number" min={1} value={manualMinutes} onChange={e => setManualMinutes(Number(e.target.value))} className="h-8" />
            </div>
            <div className="flex-[2]">
              <label className="text-xs text-muted-foreground">{t('timeTracking.description')}</label>
              <Input value={manualDesc} onChange={e => setManualDesc(e.target.value)} placeholder={t('timeTracking.descPlaceholder')} className="h-8" />
            </div>
            <Button size="sm" onClick={handleManualAdd} className="h-8">{t('common.save')}</Button>
          </div>
        )}

        {/* Entries list */}
        {entries.length > 0 && (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {entries.filter(e => !e.is_running).slice(0, 20).map(entry => (
              <div key={entry.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 group text-xs">
                <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="font-medium">{formatDuration(entry.duration_minutes ?? 0)}</span>
                <span className="text-muted-foreground truncate flex-1">{entry.description || format(new Date(entry.started_at), 'PP p')}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeEntry(entry.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {entries.length === 0 && !activeEntry && (
          <p className="text-xs text-muted-foreground text-center py-4">{t('timeTracking.empty')}</p>
        )}
      </CardContent>
    </Card>
  );
}
