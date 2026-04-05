import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useWorkloadAnalytics, type TeamMemberLoad } from '@/features/workload/hooks/useWorkloadAnalytics';
import { Users, Clock, AlertTriangle, Moon } from 'lucide-react';
import { cardVariants, typography } from '@/theme/tokens';
import { EmptyAnalyticsState } from './EmptyAnalyticsState';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';

/* ── Mini KPI Card ── */
interface KpiProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}

function MiniKpi({ icon, label, value, accent }: KpiProps) {
  return (
    <div className={`${cardVariants.stat} flex items-center gap-3 border-s-4 ${accent} p-4`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/50">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

/* ── Department aggregation ── */
function aggregateByDept(teamLoad: TeamMemberLoad[]) {
  const map: Record<string, { total: number; count: number }> = {};
  teamLoad.forEach(m => {
    const dept = m.department ?? 'N/A';
    if (!map[dept]) map[dept] = { total: 0, count: 0 };
    map[dept].total += m.estimatedMinutes;
    map[dept].count += 1;
  });
  return Object.entries(map)
    .map(([dept, { total, count }]) => ({
      department: dept,
      avgHours: Math.round((total / count / 60) * 10) / 10,
    }))
    .sort((a, b) => b.avgHours - a.avgHours);
}

function barColor(hours: number) {
  if (hours > 8) return 'hsl(var(--destructive))';
  if (hours > 6) return 'hsl(var(--chart-4))';
  return 'hsl(var(--chart-1))';
}

const GLASS_TOOLTIP = {
  background: 'hsl(var(--card) / 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid hsl(var(--border) / 0.25)',
  borderRadius: '12px',
  fontSize: 12,
  boxShadow: '0 8px 32px hsl(0 0% 0% / 0.08)',
};

/* ── Main ── */
export function OrgWorkloadIndicator() {
  const { t } = useTranslation();
  const {
    teamLoad, isPending,
    totalEmployees, avgLoadMinutes, atRiskCount, offHoursWorkers,
  } = useWorkloadAnalytics();

  const deptData = useMemo(() => aggregateByDept(teamLoad), [teamLoad]);
  const overloaded = useMemo(
    () => [...teamLoad].sort((a, b) => b.estimatedMinutes - a.estimatedMinutes).slice(0, 5),
    [teamLoad],
  );

  if (isPending) {
    return (
      <Card className={cardVariants.glass}>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const avgHours = (avgLoadMinutes / 60).toFixed(1);

  return (
    <Card className={`${cardVariants.glass} rounded-2xl`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          {t('orgDashboard.workloadHealth')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniKpi
            icon={<Clock className="h-4.5 w-4.5 text-chart-1" strokeWidth={1.5} />}
            label={t('orgDashboard.avgDailyLoad')}
            value={`${avgHours}h`}
            accent="border-chart-1"
          />
          <MiniKpi
            icon={<AlertTriangle className="h-4.5 w-4.5 text-destructive" strokeWidth={1.5} />}
            label={t('orgDashboard.atRiskEmployees')}
            value={atRiskCount}
            accent="border-destructive"
          />
          <MiniKpi
            icon={<Moon className="h-4.5 w-4.5 text-chart-4" strokeWidth={1.5} />}
            label={t('orgDashboard.offHoursWorkers')}
            value={offHoursWorkers}
            accent="border-chart-4"
          />
          <MiniKpi
            icon={<Users className="h-4.5 w-4.5 text-chart-2" strokeWidth={1.5} />}
            label={t('orgDashboard.totalWorkforce')}
            value={totalEmployees}
            accent="border-chart-2"
          />
        </div>

        {/* ── Two columns ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department breakdown */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              {t('orgDashboard.hoursPerDay')}
            </h4>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(deptData.length * 40, 120)}>
                <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="department"
                    width={100}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}h`, t('orgDashboard.hoursPerDay')]}
                    contentStyle={GLASS_TOOLTIP}
                  />
                  <Bar dataKey="avgHours" radius={[0, 6, 6, 0]} barSize={18}>
                    {deptData.map((entry, idx) => (
                      <Cell key={idx} fill={barColor(entry.avgHours)} />
                    ))}
                    <LabelList dataKey="avgHours" position="right" formatter={(v: number) => `${v}h`} style={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyAnalyticsState />
            )}
          </div>

          {/* Overloaded employees */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              {t('orgDashboard.overloadedEmployees')}
            </h4>
            {overloaded.length > 0 ? (
              <div className="space-y-3">
                {overloaded.map(emp => {
                  const pct = Math.min(Math.round((emp.estimatedMinutes / 480) * 100), 100);
                  return (
                    <div key={emp.employeeId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate max-w-[60%]">{emp.employeeName}</span>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {(emp.estimatedMinutes / 60).toFixed(1)}h / 8h
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className="h-2"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyAnalyticsState />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
