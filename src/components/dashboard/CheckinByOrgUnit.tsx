import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import type { CheckinByOrgUnitItem } from '@/hooks/analytics/useOrgAnalytics';
import i18n from '@/shared/utils/i18n';
import { CHART_AXIS_TICK, CHART_AXIS_LABEL, CHART_TOOLTIP_STYLE, CHART_GRID_STROKE } from '@/config/chart-styles';

interface Props {
  data: CheckinByOrgUnitItem[];
  orgAvgScore: number;
  isLoading: boolean;
}

export function CheckinByOrgUnit({ data, orgAvgScore, isLoading }: Props) {
  const { t } = useTranslation();
  const isAr = i18n.language === 'ar';

  const chartData = data.map(d => ({
    name: isAr && d.nameAr ? d.nameAr : d.name,
    avgScore: d.avgScore,
  }));

  return (
    <Card className="glass-chart border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.checkinByOrgUnit')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
              <XAxis dataKey="name" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              {orgAvgScore > 0 && (
                <ReferenceLine y={orgAvgScore} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: t('orgDashboard.orgAverage'), position: 'insideTopRight', ...CHART_AXIS_LABEL, fill: 'hsl(var(--destructive))' }} />
              )}
              <Bar dataKey="avgScore" name={t('orgDashboard.avgScore')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-10">{t('common.noData')}</p>
        )}
      </CardContent>
    </Card>
  );
}
