import { useTranslation } from 'react-i18next';
import { Medal, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { cardVariants } from '@/theme/tokens';

interface EngagementRankBadgeProps {
  rank: number;
  totalEmployees: number;
  isPending: boolean;
  error?: Error | null;
}

const RANK_CONFIG: Record<number, { color: string; bg: string; label: string }> = {
  1: { color: 'text-[hsl(var(--rank-gold))]', bg: 'bg-[hsl(var(--rank-gold))]/10', label: '🥇' },
  2: { color: 'text-[hsl(var(--rank-silver))]', bg: 'bg-[hsl(var(--rank-silver))]/10', label: '🥈' },
  3: { color: 'text-[hsl(var(--rank-bronze))]', bg: 'bg-[hsl(var(--rank-bronze))]/10', label: '🥉' },
};

export function EngagementRankBadge({ rank, totalEmployees, isPending, error }: EngagementRankBadgeProps) {
  const { t } = useTranslation();

  if (error) return null;

  if (isPending) {
    return <Skeleton className="h-20 w-full rounded-2xl" />;
  }

  if (!rank || rank <= 0) return null;

  const isTopThree = rank <= 3;
  const config = RANK_CONFIG[rank];

  return (
    <Card className={cn(cardVariants.premiumVip, 'rounded-2xl overflow-hidden')}>
      <CardContent className="flex items-center gap-4 p-4">
        {/* Medal / Trophy icon */}
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            isTopThree ? config.bg : 'bg-primary/[0.06]',
          )}
        >
          {isTopThree ? (
            <span className="text-2xl">{config.label}</span>
          ) : (
            <Trophy className="h-5 w-5 text-primary/70" strokeWidth={1.5} />
          )}
        </div>

        {/* Rank info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                'text-2xl font-extrabold tracking-tight',
                isTopThree ? config.color : 'text-primary',
              )}
            >
              #{rank}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('home.outOfEmployees', { count: totalEmployees })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isTopThree ? t('home.topPerformer') : t('home.keepEngaging')}
          </p>
        </div>

        {/* Decorative medal for top 3 */}
        {isTopThree && (
          <Medal className={cn('h-5 w-5 shrink-0', config.color)} strokeWidth={1.5} />
        )}
      </CardContent>
    </Card>
  );
}
