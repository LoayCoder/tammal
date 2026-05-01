import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Trophy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cardVariants } from "@/theme/tokens";
import { cn } from "@/lib/utils";

interface ShortlistEntry {
  ranking_id: string;
  rank: number;
  theme_name: string;
  cycle_name: string;
  cycle_id: string;
  require_acknowledgment: boolean;
  points_earned: number;
}

export function DashboardShortlistWidget() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: entries = [], isPending } = useQuery({
    queryKey: ['my-shortlist-acknowledgments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all nominee_rankings for this user where acknowledged_at is null
      const { data: rankings, error } = await supabase
        .from('nominee_rankings')
        .select(`
          id,
          rank,
          acknowledged_at,
          nomination_id,
          theme_results_id,
          theme_results:theme_results_id (
            cycle_id,
            theme_id,
            award_themes:theme_id ( name ),
            award_cycles:cycle_id ( name, shortlist_count, require_acknowledgment, points_config, status )
          ),
          nominations:nomination_id ( nominee_id )
        `)
        .is('deleted_at', null)
        .is('acknowledged_at', null);

      if (error) throw error;
      if (!rankings) return [];

      // Filter to only this user's nominations and announced cycles within shortlist range
      const results: ShortlistEntry[] = [];
      for (const r of rankings) {
        const nom = r.nominations as any;
        const tr = r.theme_results as any;
        if (!nom || !tr) continue;
        if (nom.nominee_id !== user.id) continue;

        const cycle = tr.award_cycles as any;
        const theme = tr.award_themes as any;
        if (!cycle || cycle.status !== 'announced') continue;

        const shortlistCount = cycle.shortlist_count ?? 3;
        if (r.rank > shortlistCount) continue;

        // Determine points earned for this rank
        const pc = (cycle.points_config || {}) as Record<string, number>;
        let points = pc[`place_${r.rank}`] ?? 0;
        if (points === 0) {
          if (r.rank === 1) points = pc.first_place ?? 5000;
          else if (r.rank === 2) points = pc.second_place ?? 2000;
          else if (r.rank === 3) points = pc.third_place ?? 1000;
        }

        results.push({
          ranking_id: r.id,
          rank: r.rank,
          theme_name: theme?.name || '',
          cycle_name: cycle?.name || '',
          cycle_id: tr.cycle_id,
          require_acknowledgment: cycle.require_acknowledgment ?? true,
          points_earned: points,
        });
      }

      return results.sort((a, b) => a.rank - b.rank);
    },
    enabled: !!user?.id,
  });

  const acknowledge = useMutation({
    mutationFn: async (rankingId: string) => {
      const { error } = await supabase
        .from('nominee_rankings')
        .update({ acknowledged_at: new Date().toISOString() } as any)
        .eq('id', rankingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-shortlist-acknowledgments'] });
      toast.success(t('recognition.shortlist.acknowledged'));
    },
    onError: () => toast.error(t('recognition.shortlist.acknowledgeError')),
  });

  if (isPending) {
    return (
      <Card className={cn(cardVariants.premiumVip, "rounded-2xl border border-border/40")}>
        <CardContent className="flex items-center gap-4 p-5">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!entries.length) return null;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-7 w-7 text-chart-1" />;
    return <Award className="h-7 w-7 text-chart-2" />;
  };

  const getRankLabel = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={entry.ranking_id} className={cn(cardVariants.premiumVip, "border border-chart-1/30 overflow-hidden rounded-2xl")}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-chart-1/10 border border-chart-1/20">
              {getRankIcon(entry.rank)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">
                  {getRankLabel(entry.rank)} {t('recognition.shortlist.youPlaced', { rank: entry.rank })}
                </h3>
                {entry.points_earned > 0 && (
                  <Badge variant="secondary" className="text-2xs px-1.5 py-0">
                    +{entry.points_earned.toLocaleString()} {t('home.points')}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">
                {entry.theme_name} — {entry.cycle_name}
              </p>
            </div>
            {entry.require_acknowledgment ? (
              <Button
                size="sm"
                onClick={() => acknowledge.mutate(entry.ranking_id)}
                disabled={acknowledge.isPending}
                className="shrink-0 h-8 text-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5 me-1" />
                {t('recognition.shortlist.acknowledge')}
              </Button>
            ) : (
              <CheckCircle2 className="h-5 w-5 text-chart-1 shrink-0" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
