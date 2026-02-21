import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Flame, MessageSquare } from 'lucide-react';
import type { TopEngager } from '@/hooks/useOrgAnalytics';

interface Props {
  data: TopEngager[];
  isLoading: boolean;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-chart-1" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-muted-foreground" />;
  if (rank === 3) return <Award className="h-4 w-4 text-chart-4" />;
  return <span className="text-xs text-muted-foreground w-4 text-center">{rank}</span>;
}

export function TopEngagersCard({ data, isLoading }: Props) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.topEngagers')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : data.length > 0 ? (
          <div className="space-y-2">
            {data.map((eng, i) => (
              <div key={eng.employeeId} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
                <RankIcon rank={i + 1} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{eng.firstName}</p>
                  <p className="text-xs text-muted-foreground truncate">{eng.department}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 text-xs" title={t('orgDashboard.streak')}>
                    <Flame className="h-3.5 w-3.5 text-destructive" />
                    <span>{eng.streak}d</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs" title={t('orgDashboard.responses')}>
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{eng.responseCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-10">{t('common.noData')}</p>
        )}
      </CardContent>
    </Card>
  );
}
