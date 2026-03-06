import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkloadAnalytics, type TeamMemberLoad } from '@/features/workload/hooks/useWorkloadAnalytics';
import { Users, Clock, AlertTriangle, Moon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

/* ------------------------------------------------------------------ */
/*  Mini KPI Card                                                      */
/* ------------------------------------------------------------------ */
interface KpiProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string; // tailwind border color class
}

function MiniKpi({ icon, label, value, accent }: KpiProps) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border-s-4 ${accent} bg-card p-4 shadow-sm`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Department aggregation helper                                      */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Bar color by hours                                                 */
/* ------------------------------------------------------------------ */
function barColor(hours: number) {
  if (hours > 8) return 'hsl(var(--destructive))';
  if (hours > 6) return 'hsl(var(--chart-4))';
  return 'hsl(var(--chart-1))';
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
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
      <Card className="shadow-sm">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
          <Skeleton className="h-48" />
        </CardContent>
      </Card>
    );
  }

  const avgHours = (avgLoadMinutes / 60).toFixed(1);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          {t('orgDashboard.workloadHealth')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniKpi
            icon={<Clock className="h-5 w-5 text-chart-1" />}
            label={t('orgDashboard.avgDailyLoad')}
            value={`${avgHours}h`}
            accent="border-chart-1"
          />
          <MiniKpi
            icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
            label={t('orgDashboard.atRiskEmployees')}
            value={atRiskCount}
            accent="border-destructive"
          />
          <MiniKpi
            icon={<Moon className="h-5 w-5 text-chart-4" />}
            label={t('orgDashboard.offHoursWorkers')}
            value={offHoursWorkers}
            accent="border-chart-4"
          />
          <MiniKpi
            icon={<Users className="h-5 w-5 text-chart-2" />}
            label={t('orgDashboard.totalWorkforce')}
            value={totalEmployees}
            accent="border-chart-2"
          />
        </div>

        {/* ── Two columns: dept chart + overloaded list ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department breakdown */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              {t('orgDashboard.hoursPerDay')}
            </h4>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(deptData.length * 40, 120)}>
                <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="department"
                    width={100}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}h`, t('orgDashboard.hoursPerDay')]}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px hsl(var(--foreground) / 0.12)' }}
                  />
                  <Bar dataKey="avgHours" radius={[0, 6, 6, 0]} barSize={18}>
                    {deptData.map((entry, idx) => (
                      <Cell key={idx} fill={barColor(entry.avgHours)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">{t('orgDashboard.noSurveyData')}</p>
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
                  const color = pct > 90 ? 'bg-destructive' : pct > 70 ? 'bg-chart-4' : 'bg-chart-1';
                  return (
                    <div key={emp.employeeId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate max-w-[60%]">{emp.employeeName}</span>
                        <span className="text-muted-foreground text-xs">
                          {(emp.estimatedMinutes / 60).toFixed(1)}h / 8h
                        </span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/30">
                        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('orgDashboard.noSurveyData')}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
