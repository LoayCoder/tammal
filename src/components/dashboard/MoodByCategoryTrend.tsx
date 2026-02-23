import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { CategoryScore } from '@/hooks/useOrgAnalytics';

interface MoodByCategoryData {
  date: string;
  label: string;
  great: number;
  good: number;
  okay: number;
  struggling: number;
  need_help: number;
}

interface Props {
  categories: CategoryScore[];
  moodByCategoryData: Map<string, MoodByCategoryData[]>;
  isLoading: boolean;
}

const MOOD_COLORS: Record<string, string> = {
  great: 'hsl(var(--chart-1))',
  good: 'hsl(var(--chart-2))',
  okay: 'hsl(var(--chart-4))',
  struggling: 'hsl(var(--destructive) / 0.7)',
  need_help: 'hsl(var(--destructive))',
};

export function MoodByCategoryTrend({ categories, moodByCategoryData, isLoading }: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const currentCategory = selectedCategory || categories[0]?.id || '';
  const chartData = moodByCategoryData.get(currentCategory) ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t('orgDashboard.moodByCategory')}</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[280px] w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t('orgDashboard.moodByCategory')}</CardTitle>
        {categories.length > 0 && (
          <Select value={currentCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {isRTL && cat.nameAr ? cat.nameAr : cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {Object.entries(MOOD_COLORS).map(([key, color]) => (
                <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={color} fill={color}
                  name={t(`orgDashboard.moods.${key}`)} fillOpacity={0.6} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-10">{t('orgDashboard.noSurveyData')}</p>
        )}
      </CardContent>
    </Card>
  );
}
