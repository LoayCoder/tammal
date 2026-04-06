import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lightbulb, X } from 'lucide-react';

interface Props {
  todoCount: number;
  criticalCount: number;
  completedCount: number;
  employeeName: string;
}

const CACHE_KEY = 'vip-todo-daily-tip';

function getCachedTip(): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { date, tip } = JSON.parse(raw);
    const today = new Date().toISOString().split('T')[0];
    return date === today ? tip : null;
  } catch { return null; }
}

function cacheTip(tip: string) {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, tip }));
}

export const AIDailyTip = React.memo(function AIDailyTip({ todoCount, criticalCount, completedCount, employeeName }: Props) {
  const [tip, setTip] = useState<string | null>(getCachedTip);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tip || todoCount === 0) return;
    let cancelled = false;
    setLoading(true);

    supabase.functions.invoke('todo-daily-tip', {
      body: { todoCount, criticalCount, completedCount, employeeName },
    }).then(({ data, error }) => {
      if (cancelled) return;
      setLoading(false);
      if (error) return;
      const t = data?.tip;
      if (t) { setTip(t); cacheTip(t); }
    });

    return () => { cancelled = true; };
  }, [todoCount, criticalCount, completedCount, employeeName, tip]);

  if (dismissed || (!tip && !loading) || todoCount === 0) return null;

  return (
    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-chart-4/[0.06] border border-chart-4/10 text-sm min-h-[44px] animate-fade-in">
      <Lightbulb className="h-4 w-4 text-chart-4 shrink-0" strokeWidth={1.5} />
      <span className="flex-1 text-muted-foreground text-sm leading-relaxed">
        {loading ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-chart-4 animate-pulse" />
            <span className="h-1 w-1 rounded-full bg-chart-4 animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="h-1 w-1 rounded-full bg-chart-4 animate-pulse" style={{ animationDelay: '300ms' }} />
          </span>
        ) : tip}
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="p-1.5 rounded-lg hover:bg-muted/20 active:scale-[0.97] transition-all"
      >
        <X className="h-3 w-3 text-muted-foreground/50" />
      </button>
    </div>
  );
});
