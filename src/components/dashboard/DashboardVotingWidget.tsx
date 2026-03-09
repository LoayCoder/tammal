import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Vote, ChevronRight } from 'lucide-react';
import { useAwardCycles } from '@/hooks/recognition/useAwardCycles';
import { useVoting } from '@/hooks/recognition/useVoting';

function VotingCycleCard({ cycleId, cycleName }: { cycleId: string; cycleName: string }) {
  const { t } = useTranslation();
  const { pendingBallots, completedCount, totalCount, ballotsPending } = useVoting(cycleId);

  if (ballotsPending) {
    return (
      <Card className="glass-card border-0 ring-1 ring-primary/20">
        <CardContent className="p-6">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Hide if no ballots at all
  if (totalCount === 0) return null;

  const allDone = pendingBallots.length === 0;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card className="glass-card border-0 ring-1 ring-primary/20">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Vote className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">{t('home.votingWidget.title')}</h3>
            <p className="text-muted-foreground text-sm mt-0.5">{cycleName}</p>
          </div>
          {!allDone && (
            <Link to="/recognition/vote">
              <Button size="sm" className="gap-1.5">
                {t('home.votingWidget.voteNow')}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {allDone
                ? t('home.votingWidget.allDone')
                : t('home.votingWidget.pending', { count: pendingBallots.length })}
            </span>
            <span className="font-medium">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardVotingWidget() {
  const { cycles, isPending } = useAwardCycles();
  const votingCycles = cycles.filter(c => c.status === 'voting');

  if (isPending || votingCycles.length === 0) return null;

  return (
    <>
      {votingCycles.map(c => (
        <VotingCycleCard key={c.id} cycleId={c.id} cycleName={c.name} />
      ))}
    </>
  );
}
