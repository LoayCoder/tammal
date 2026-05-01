import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Vote, ChevronRight } from 'lucide-react';
import { useAwardCycles } from '@/hooks/recognition/useAwardCycles';
import { useVoting } from '@/hooks/recognition/useVoting';
import { cardVariants } from "@/theme/tokens";
import { cn } from "@/lib/utils";

function VotingCycleCard({ cycleId, cycleName }: { cycleId: string; cycleName: string }) {
  const { t } = useTranslation();
  const { pendingBallots, completedCount, totalCount, ballotsPending } = useVoting(cycleId);

  if (ballotsPending) {
    return (
      <Card className={cn(cardVariants.premiumVip, "border border-primary/30 rounded-2xl")}>
        <CardContent className="p-5">
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Hide if no ballots at all
  if (totalCount === 0) return null;

  const allDone = pendingBallots.length === 0;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card className={cn(cardVariants.premiumVip, "border border-primary/30 rounded-2xl")}>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Vote className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{t('home.votingWidget.title')}</h3>
            <p className="text-muted-foreground text-xs mt-0.5">{cycleName}</p>
          </div>
          {!allDone && (
            <Link to="/recognition/vote">
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                {t('home.votingWidget.voteNow')}
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </Button>
            </Link>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {allDone
                ? t('home.votingWidget.allDone')
                : t('home.votingWidget.pending', { count: pendingBallots.length })}
            </span>
            <span className="font-semibold text-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
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
