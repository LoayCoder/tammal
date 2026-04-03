import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Flame, TrendingUp, CalendarCheck, Activity, BarChart3,
  ClipboardList, RefreshCw, Wind, SmilePlus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersonalMoodDashboard } from "@/hooks/analytics/usePersonalMoodDashboard";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, PieChart as RechartsPie, Pie, Cell, Legend,
} from "recharts";
import { format, subDays } from "date-fns";
import { TOOLKIT, ZONE_COLORS, DONUT_COLORS } from "@/config/toolkit-colors";
import { cardVariants, typography } from "@/theme/tokens";
import { cn } from "@/lib/utils";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function PersonalMoodDashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const dashboard = usePersonalMoodDashboard();

  const chartData = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
    const entry = dashboard.last14.find((e) => e.date === d);
    const moodDef = entry ? dashboard.moodDefs.find((m) => m.key === entry.level) : null;
    return {
      date: d,
      label: format(subDays(new Date(), 13 - i), "dd/MM"),
      score: entry?.score ?? null,
      emoji: moodDef?.emoji ?? "",
      orgAvg: dashboard.orgAvgMap[d] ?? null,
    };
  }), [dashboard.last14, dashboard.moodDefs, dashboard.orgAvgMap]);

  const donutData = useMemo(() => Object.entries(dashboard.distribution).map(([level, count]) => {
    const def = dashboard.moodDefs.find((m) => m.key === level);
    const label = def ? (isRTL ? def.label_ar : def.label_en) : level;
    return { name: `${def?.emoji ?? ""} ${label}`, value: count };
  }), [dashboard.distribution, dashboard.moodDefs, isRTL]);

  const todayDef = dashboard.todayEntry
    ? dashboard.moodDefs.find((m) => m.key === dashboard.todayEntry!.level)
    : null;

  const noData = dashboard.moodHistory.length === 0;

  if (dashboard.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (noData) {
    return (
      <Card className={cn(cardVariants.glass, "rounded-xl border-dashed")}>
        <CardContent className="py-12 text-center space-y-2">
          <SmilePlus className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className={typography.sectionTitle}>
            {t("mentalToolkit.moodDashboard.noDataYet")}
          </p>
          <p className={typography.subtitle}>
            {t("mentalToolkit.moodDashboard.startCheckinPrompt")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(cardVariants.premiumVip, "overflow-hidden")}>
      <CardContent className="p-0">
        {/* ── Unified Metrics Row ── */}
        <div className="grid grid-cols-4 divide-x divide-border/40 rtl:divide-x-reverse px-1 py-4">
          {/* Streak */}
          <div className="flex flex-col items-center justify-start gap-0.5 px-1 text-center">
            <Flame className="h-3.5 w-3.5 text-toolkit-lavender" strokeWidth={1.5} />
            <span className="text-lg font-bold tracking-tight text-foreground">{dashboard.streak}</span>
            <span className="text-[9px] text-muted-foreground leading-tight">{t("mentalToolkit.moodDashboard.currentStreak")}</span>
          </div>

          {/* 7-Day Average */}
          <div className="flex flex-col items-center justify-start gap-0.5 px-1 text-center">
            <TrendingUp className="h-3.5 w-3.5" style={{ color: ZONE_COLORS[dashboard.burnoutZone] }} strokeWidth={1.5} />
            <span className="text-lg font-bold tracking-tight text-foreground">{dashboard.avgMood7d}</span>
            <span className="text-[9px] text-muted-foreground leading-tight">{t("mentalToolkit.moodDashboard.avgMood7d")}</span>
          </div>

          {/* Monthly Check-ins */}
          <div className="flex flex-col items-center justify-start gap-0.5 px-1 text-center">
            <CalendarCheck className="h-3.5 w-3.5 text-toolkit-sage" strokeWidth={1.5} />
            <span className="text-lg font-bold tracking-tight text-foreground">
              {dashboard.monthlyCheckins}<span className="text-[10px] font-normal text-muted-foreground">/{dashboard.daysInMonth}</span>
            </span>
            <span className="text-[9px] text-muted-foreground leading-tight">{t("mentalToolkit.moodDashboard.monthlyCheckins")}</span>
          </div>

          {/* Today's Mood */}
          <div className="flex flex-col items-center justify-start gap-0.5 px-1 text-center min-w-0">
            {todayDef ? (
              <>
                <span className="text-base leading-none">{todayDef.emoji}</span>
                <span className="text-[10px] font-medium text-foreground truncate max-w-full">{isRTL ? todayDef.label_ar : todayDef.label_en}</span>
              </>
            ) : (
              <>
                <Activity className="h-3.5 w-3.5 text-toolkit-sky" strokeWidth={1.5} />
                <span className="text-[9px] text-muted-foreground leading-tight text-center">{t("mentalToolkit.moodDashboard.notCheckedIn")}</span>
              </>
            )}
            <span className="text-[9px] text-muted-foreground leading-tight">{t("mentalToolkit.moodDashboard.todayMood")}</span>
          </div>
        </div>

        {/* ── Separator ── */}
        <div className="border-t border-border/30" />

        {/* ── Chart Area (dominant) ── */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-3.5 w-3.5 text-toolkit-lavender" strokeWidth={1.5} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("mentalToolkit.moodDashboard.moodTrend")}</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashMoodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TOOLKIT.lavender} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={TOOLKIT.lavender} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{payload[0]?.payload?.emoji || "—"}</span>
                          <div>
                            <div className="font-medium text-foreground">
                              {t("mentalToolkit.moodDashboard.yourMood")}: {payload[0]?.value ?? "—"}
                            </div>
                            {payload[0]?.payload?.orgAvg != null && (
                              <div className="text-xs text-muted-foreground">
                                {t("mentalToolkit.moodDashboard.orgAverage")}: {payload[0].payload.orgAvg}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null
                  }
                />
                <Area type="monotone" dataKey="score" stroke={TOOLKIT.lavender} fill="url(#dashMoodGrad)" strokeWidth={2.5} dot={{ r: 3, fill: TOOLKIT.lavender, strokeWidth: 0 }} activeDot={{ r: 5, fill: TOOLKIT.lavender, strokeWidth: 2, stroke: "hsl(var(--card))" }} connectNulls />
                {dashboard.hasOrgData && (
                  <Area type="monotone" dataKey="orgAvg" stroke={TOOLKIT.sage} fill="none" strokeWidth={1.5} strokeDasharray="5 3" dot={false} connectNulls />
                )}
                <ReferenceLine y={3} stroke="hsl(var(--border) / 0.4)" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground justify-center">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: TOOLKIT.lavender }} />
              {t("mentalToolkit.moodDashboard.yourMood")}
            </span>
            {dashboard.hasOrgData && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-0.5 rounded border-dashed border-t" style={{ borderColor: TOOLKIT.sage }} />
                {t("mentalToolkit.moodDashboard.orgAverage")}
              </span>
            )}
          </div>
        </div>

        {/* ── Separator ── */}
        <div className="border-t border-border/30" />

        {/* ── Distribution + Weekly Activity ── */}
        <div className="flex flex-col gap-5 px-4 py-4">
          {/* Donut */}
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3 block">{t("mentalToolkit.moodDashboard.moodDistribution")}</span>
            {donutData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">{t("mentalToolkit.moodDashboard.noDataYet")}</p>
            ) : (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={30} outerRadius={50} paddingAngle={3}>
                      {donutData.map((_, idx) => (
                        <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10, lineHeight: '16px' }} />
                    <Tooltip formatter={(value: number) => [value, t("mentalToolkit.moodDashboard.days")]} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Weekly Activity */}
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3 block">{t("mentalToolkit.moodDashboard.weeklyActivity")}</span>
            <div className="flex justify-between gap-1.5 mt-1">
              {DAY_KEYS.map((dayKey, i) => {
                const count = dashboard.dayActivity[i];
                const max = Math.max(...dashboard.dayActivity, 1);
                const intensity = count / max;
                return (
                  <div key={dayKey} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-[10px] font-medium text-muted-foreground">{t(`wellness.days.${dayKey}`)}</span>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold"
                      style={{
                        backgroundColor: count === 0 ? "hsl(var(--muted) / 0.5)" : `hsl(var(--primary) / ${0.1 + intensity * 0.35})`,
                        color: count > 0 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Separator ── */}
        <div className="border-t border-border/30" />

        {/* ── Compact Stats ── */}
        <div className="px-4 py-4 space-y-3">
          {/* Survey */}
          <div className="flex items-center gap-2 pb-3 border-b border-border/20">
            <ClipboardList className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" strokeWidth={1.5} />
            <div className="flex-1 flex items-center divide-x divide-border/30 rtl:divide-x-reverse">
              <div className="flex-1 text-center">
                <p className="text-base font-bold text-foreground">{dashboard.surveyStats.totalAnswered}</p>
                <p className="text-[10px] text-muted-foreground">{t("mentalToolkit.moodDashboard.totalAnswered")}</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-base font-bold text-foreground">{dashboard.surveyStats.avgScore}</p>
                <p className="text-[10px] text-muted-foreground">{t("mentalToolkit.moodDashboard.avgResponseScore")}</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-base font-bold text-foreground">{dashboard.surveyStats.completionRate}%</p>
                <p className="text-[10px] text-muted-foreground">{t("mentalToolkit.moodDashboard.completionRate")}</p>
              </div>
            </div>
          </div>

          {/* Reframe */}
          <div className="flex items-center gap-2 pb-3 border-b border-border/20">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" strokeWidth={1.5} />
            <div className="flex-1 flex items-center divide-x divide-border/30 rtl:divide-x-reverse">
              <div className="flex-1 text-center">
                <p className="text-base font-bold text-foreground">{dashboard.reframeStats.total}</p>
                <p className="text-[10px] text-muted-foreground">{t("mentalToolkit.moodDashboard.totalReframes")}</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-base font-bold text-foreground">{dashboard.reframeStats.thisMonth}</p>
                <p className="text-[10px] text-muted-foreground">{t("mentalToolkit.moodDashboard.reframesThisMonth")}</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-base font-bold text-foreground">{dashboard.reframeStats.streak}d</p>
                <p className="text-[10px] text-muted-foreground">{t("mentalToolkit.moodDashboard.reframeStreak")}</p>
              </div>
            </div>
          </div>

          {/* Breathing */}
          <div className="flex items-center gap-2">
            <Wind className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" strokeWidth={1.5} />
            <div className="flex-1 flex items-center divide-x divide-border/30 rtl:divide-x-reverse">
              <div className="flex-1 text-center">
                <p className="text-base font-bold text-foreground">{dashboard.breathingStats.totalSessions}</p>
                <p className="text-[10px] text-muted-foreground">{t("mentalToolkit.moodDashboard.breathingSessions")}</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-base font-bold text-foreground">{dashboard.breathingStats.thisMonth}</p>
                <p className="text-[10px] text-muted-foreground">{t("mentalToolkit.moodDashboard.breathingThisMonth")}</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-base font-bold text-foreground">{dashboard.breathingStats.currentStreak}d</p>
                <p className="text-[10px] text-muted-foreground">{t("mentalToolkit.moodDashboard.breathingStreak")}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
