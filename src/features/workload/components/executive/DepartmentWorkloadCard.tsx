import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, CartesianGrid,
} from 'recharts';

const GLASS_TOOLTIP = {
  background: 'hsl(var(--card) / 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid hsl(var(--border) / 0.25)',
  borderRadius: '12px',
  fontSize: 12,
};

interface DeptData {
  name: string;
  avgHours: number;
  atRisk: number;
  total: number;
}

interface Props {
  data: DeptData[];
  isPending: boolean;
}

export function DepartmentWorkloadCard({ data, isPending }: Props) {
  const { t } = useTranslation();

  return (
    <Card className="glass-chart border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('executive.departmentWorkload')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? <Skeleton className="h-[260px] w-full" /> : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={GLASS_TOOLTIP} />
              <Bar dataKey="avgHours" fill="hsl(var(--primary))" name={t('executive.avgHours')} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-10">{t('common.noData')}</p>
        )}
      </CardContent>
    </Card>
  );
}
