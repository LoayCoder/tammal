import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { CheckinMoodOverTimePoint } from '@/hooks/analytics/useOrgAnalytics';

interface Props {
  data: CheckinMoodOverTimePoint[];
  isLoading: boolean;
}

const MOOD_COLORS = {
  great: 'hsl(var(--chart-1))',
  good: 'hsl(var(--chart-2))',
  okay: 'hsl(var(--chart-4))',
  struggling: 'hsl(var(--destructive))',
  need_help: 'hsl(var(--destructive) / 0.7)',
};

export function CheckinMoodOverTime({ data, isLoading }: Props) {
  const { t } = useTranslation();
  const hasData = data.some(d => d.great + d.good + d.okay + d.struggling + d.need_help > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.checkinMoodOverTime')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : hasData ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
              <Area type="monotone" dataKey="great" name={t('orgDashboard.moods.great')} stackId="1" stroke={MOOD_COLORS.great} fill={MOOD_COLORS.great} fillOpacity={0.8} />
              <Area type="monotone" dataKey="good" name={t('orgDashboard.moods.good')} stackId="1" stroke={MOOD_COLORS.good} fill={MOOD_COLORS.good} fillOpacity={0.8} />
              <Area type="monotone" dataKey="okay" name={t('orgDashboard.moods.okay')} stackId="1" stroke={MOOD_COLORS.okay} fill={MOOD_COLORS.okay} fillOpacity={0.8} />
              <Area type="monotone" dataKey="struggling" name={t('orgDashboard.moods.struggling')} stackId="1" stroke={MOOD_COLORS.struggling} fill={MOOD_COLORS.struggling} fillOpacity={0.8} />
              <Area type="monotone" dataKey="need_help" name={t('orgDashboard.moods.need_help')} stackId="1" stroke={MOOD_COLORS.need_help} fill={MOOD_COLORS.need_help} fillOpacity={0.8} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-10">{t('common.noData')}</p>
        )}
      </CardContent>
    </Card>
  );
}
