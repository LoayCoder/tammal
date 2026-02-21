import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { OrgComparison, OrgUnitComparison } from '@/hooks/useOrgAnalytics';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Cell, Legend,
} from 'recharts';

interface Props {
  data: OrgComparison;
  isLoading: boolean;
}

type TabKey = 'branches' | 'divisions' | 'departments' | 'sections';

export function OrgComparisonChart({ data, isLoading }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>('branches');

  const tabConfig: { key: TabKey; label: string }[] = [
    { key: 'branches', label: t('orgDashboard.compareTabs.branch') },
    { key: 'divisions', label: t('orgDashboard.compareTabs.division') },
    { key: 'departments', label: t('orgDashboard.compareTabs.department') },
    { key: 'sections', label: t('orgDashboard.compareTabs.section') },
  ];

  const units = data[tab] ?? [];

  const orgAvgScore = units.length > 0 ? Math.round(units.reduce((s, u) => s + u.avgScore, 0) / units.length * 10) / 10 : 0;
  const orgAvgParticipation = units.length > 0 ? Math.round(units.reduce((s, u) => s + u.participation, 0) / units.length) : 0;
  const orgAvgRisk = units.length > 0 ? Math.round(units.reduce((s, u) => s + u.riskPct, 0) / units.length) : 0;

  const chartData = units.map(u => ({
    name: u.name.length > 12 ? u.name.slice(0, 12) + '…' : u.name,
    fullName: u.name,
    [t('orgDashboard.wellnessScore')]: u.avgScore,
    [t('orgDashboard.participation')]: u.participation,
    [t('orgDashboard.riskPct')]: u.riskPct,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.orgComparison')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={v => setTab(v as TabKey)}>
          <TabsList className="mb-4">
            {tabConfig.map(tc => (
              <TabsTrigger key={tc.key} value={tc.key}>{tc.label}</TabsTrigger>
            ))}
          </TabsList>

          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barGap={2} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={orgAvgScore} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeWidth={1.5} />
                <Bar dataKey={t('orgDashboard.wellnessScore')} fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
                <Bar dataKey={t('orgDashboard.participation')} fill="hsl(var(--chart-4))" radius={[3, 3, 0, 0]} />
                <Bar dataKey={t('orgDashboard.riskPct')} fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">{t('common.noData')}</p>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
