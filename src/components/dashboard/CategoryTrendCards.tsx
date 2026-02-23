import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';
import type { CategoryRiskScore, CategoryTrendPoint } from '@/lib/wellnessAnalytics';

interface Props {
  risks: CategoryRiskScore[];
  trends: Map<string, CategoryTrendPoint[]>;
  isLoading: boolean;
}

const STATUS_STYLES: Record<string, { variant: 'destructive' | 'secondary' | 'outline' | 'default'; label: string }> = {
  critical: { variant: 'destructive', label: 'orgDashboard.statusCritical' },
  watch: { variant: 'secondary', label: 'orgDashboard.statusWatch' },
  stable: { variant: 'outline', label: 'orgDashboard.statusStable' },
  improving: { variant: 'default', label: 'orgDashboard.statusImproving' },
};

export function CategoryTrendCards({ risks, trends, isLoading }: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t('orgDashboard.categoryRiskRanking')}</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[200px] w-full" /></CardContent>
      </Card>
    );
  }

  if (risks.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t('orgDashboard.categoryRiskRanking')}</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm text-center py-10">{t('orgDashboard.noSurveyData')}</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.categoryRiskRanking')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {risks.map(cat => {
            const trendData = (trends.get(cat.id) ?? []).filter(t => t.count > 0);
            const style = STATUS_STYLES[cat.trend] ?? STATUS_STYLES.stable;

            return (
              <div key={cat.id} className="border border-border/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {isRTL && cat.nameAr ? cat.nameAr : cat.name}
                  </span>
                  <Badge variant={style.variant} className="text-[10px]">
                    {t(style.label)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('orgDashboard.avgScore')}: {cat.avgScore}/5</span>
                  <span>{t('orgDashboard.riskPct')}: {cat.riskScore}%</span>
                </div>
                {trendData.length > 2 && (
                  <div className="h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id={`sparkGrad_${cat.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={cat.color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={cat.color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <YAxis domain={[0, 5]} hide />
                        <Area type="monotone" dataKey="avgScore" stroke={cat.color} strokeWidth={1.5} fill={`url(#sparkGrad_${cat.id})`} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
