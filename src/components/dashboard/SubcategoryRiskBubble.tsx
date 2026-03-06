import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis } from 'recharts';
import type { SubcategoryScore } from '@/hooks/analytics/useOrgAnalytics';
import { CHART_AXIS_TICK, CHART_AXIS_LABEL, CHART_TOOLTIP_STYLE, CHART_GRID_STROKE } from '@/config/chart-styles';

interface SubcategoryBubble extends SubcategoryScore {
  declineRate: number;
}

interface Props {
  data: SubcategoryBubble[];
  isLoading: boolean;
}

export function SubcategoryRiskBubble({ data, isLoading }: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t('orgDashboard.subcategoryRiskMatrix')}</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t('orgDashboard.subcategoryRiskMatrix')}</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm text-center py-10">{t('orgDashboard.noSurveyData')}</p></CardContent>
      </Card>
    );
  }

  const chartData = data.map(d => ({
    x: d.avgScore,
    y: d.responseCount,
    z: Math.max(50, d.declineRate * 100 + 50),
    name: isRTL && d.nameAr ? d.nameAr : d.name,
    category: isRTL && d.categoryNameAr ? d.categoryNameAr : d.categoryName,
    color: d.color,
    avgScore: d.avgScore,
    responses: d.responseCount,
    decline: d.declineRate,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.subcategoryRiskMatrix')}</CardTitle>
        <p className="text-xs text-muted-foreground">{t('orgDashboard.bubbleHint')}</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
            <XAxis
              dataKey="x" type="number" domain={[0, 5]}
              name={t('orgDashboard.avgScore')}
              tick={CHART_AXIS_TICK}
              axisLine={false} tickLine={false}
              label={{ value: t('orgDashboard.avgScore'), position: 'bottom', ...CHART_AXIS_LABEL }}
            />
            <YAxis
              dataKey="y" type="number"
              name={t('orgDashboard.responses')}
              tick={CHART_AXIS_TICK}
              axisLine={false} tickLine={false}
              label={{ value: t('orgDashboard.responses'), angle: -90, position: 'insideLeft', ...CHART_AXIS_LABEL }}
            />
            <ZAxis dataKey="z" range={[40, 400]} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(_val: any, _name: string, props: any) => {
                const d = props.payload;
                return [
                  <div key="tip" className="space-y-1">
                    <p className="font-medium">{d.name}</p>
                    <p className="text-muted-foreground">{d.category}</p>
                    <p>{t('orgDashboard.avgScore')}: {d.avgScore}/5</p>
                    <p>{t('orgDashboard.responses')}: {d.responses}</p>
                  </div>,
                  '',
                ];
              }}
            />
            <Scatter data={chartData} fill="hsl(var(--primary) / 0.6)" />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
