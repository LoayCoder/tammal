import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, MessageSquare } from 'lucide-react';
import type { TopEngager } from '@/hooks/analytics/useOrgAnalytics';
import { cardVariants, typography } from '@/theme/tokens';
import { EmptyAnalyticsState } from '@/features/org-dashboard/components/EmptyAnalyticsState';
import { Users } from 'lucide-react';

interface Props {
  data: TopEngager[];
  isLoading: boolean;
}

const RANK_COLORS = [
  'bg-chart-4 text-card',     // gold
  'bg-muted-foreground/60 text-card', // silver
  'bg-chart-3/70 text-card',  // bronze
];

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${RANK_COLORS[rank - 1]}`}>
        {rank}
      </div>
    );
  }
  return <span className="text-xs text-muted-foreground w-6 text-center font-medium">{rank}</span>;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-semibold text-primary shrink-0">
      {initials}
    </div>
  );
}

export function TopEngagersCard({ data, isLoading }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <Card className={`${cardVariants.glass} rounded-2xl`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.topEngagers')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[200px] w-full rounded-xl" />
        ) : data.length > 0 ? (
          <div className="space-y-1">
            {data.map((eng, i) => (
              <div
                key={eng.employeeId}
                className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/30 transition-colors duration-150"
              >
                <RankBadge rank={i + 1} />
                <Avatar name={eng.firstName} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{eng.firstName}</p>
                  <span className="inline-block text-2xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md truncate">
                    {isAr ? (eng.departmentAr || eng.department) : eng.department}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 text-xs" title={t('orgDashboard.streak')}>
                    <Flame className="h-3.5 w-3.5 text-destructive" strokeWidth={1.5} />
                    <span className="tabular-nums">{eng.streak}d</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs" title={t('orgDashboard.responses')}>
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                    <span className="tabular-nums">{eng.responseCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyAnalyticsState icon={Users} />
        )}
      </CardContent>
    </Card>
  );
}
