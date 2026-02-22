import { useTranslation } from "react-i18next";
import { SmilePlus, Flame, TrendingUp, CalendarCheck, Activity, BarChart3, PieChart, Grid3X3, ClipboardList, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersonalMoodDashboard } from "@/hooks/usePersonalMoodDashboard";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, PieChart as RechartsPie, Pie, Cell, Legend,
} from "recharts";
import { format, subDays } from "date-fns";

const PALETTE = {
  lavender: "#C9B8E8",
  sage: "#A8C5A0",
  plum: "#4A3F6B",
  warmWhite: "#FAF8F5",
};

const ZONE_COLORS: Record<string, string> = {
  thriving: "#A8C5A0",
  watch: "#F5C563",
  atRisk: "#E57373",
};

const DONUT_COLORS = ["#C9B8E8", "#A8C5A0", "#7EC8E3", "#F5C563", "#E57373"];

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function MoodTrackerPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const dashboard = usePersonalMoodDashboard();

  if (dashboard.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border px-4 py-5 sm:px-6">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Build 14-day chart data
  const chartData = Array.from({ length: 14 }, (_, i) => {
    const d = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
    const entry = dashboard.last14.find((e) => e.date === d);
    const moodDef = entry
      ? dashboard.moodDefs.find((m) => m.key === entry.level)
      : null;
    return {
      date: d,
      label: format(subDays(new Date(), 13 - i), "dd/MM"),
      score: entry?.score ?? null,
      emoji: moodDef?.emoji ?? "",
      orgAvg: dashboard.orgAvgMap[d] ?? null,
    };
  });

  // Donut data
  const donutData = Object.entries(dashboard.distribution).map(([level, count]) => {
    const def = dashboard.moodDefs.find((m) => m.key === level);
    const label = def
      ? isRTL ? def.label_ar : def.label_en
      : level;
    return { name: `${def?.emoji ?? ""} ${label}`, value: count };
  });

  const todayDef = dashboard.todayEntry
    ? dashboard.moodDefs.find((m) => m.key === dashboard.todayEntry!.level)
    : null;

  const noData = dashboard.moodHistory.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-5 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${PALETTE.lavender}, ${PALETTE.sage})` }}
          >
            <SmilePlus className="h-5 w-5 text-card" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {t("mentalToolkit.moodDashboard.pageTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("mentalToolkit.moodDashboard.pageSubtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {noData ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="py-12 text-center space-y-2">
              <SmilePlus className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-lg font-semibold text-foreground">
                {t("mentalToolkit.moodDashboard.noDataYet")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("mentalToolkit.moodDashboard.startCheckinPrompt")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Streak */}
              <Card className="rounded-2xl">
                <CardContent className="pt-5 pb-4 px-4 flex flex-col items-center text-center gap-1">
                  <Flame className="h-6 w-6" style={{ color: PALETTE.lavender }} />
                  <span className="text-2xl font-bold text-foreground">{dashboard.streak}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("mentalToolkit.moodDashboard.currentStreak")}
                  </span>
                </CardContent>
              </Card>

              {/* 7-Day Avg */}
              <Card className="rounded-2xl">
                <CardContent className="pt-5 pb-4 px-4 flex flex-col items-center text-center gap-1">
                  <TrendingUp
                    className="h-6 w-6"
                    style={{ color: ZONE_COLORS[dashboard.burnoutZone] }}
                  />
                  <span className="text-2xl font-bold text-foreground">
                    {dashboard.avgMood7d}
                  </span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: ZONE_COLORS[dashboard.burnoutZone] + "22",
                      color: ZONE_COLORS[dashboard.burnoutZone],
                    }}
                  >
                    {t(`mentalToolkit.moodDashboard.${dashboard.burnoutZone}`)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("mentalToolkit.moodDashboard.avgMood7d")}
                  </span>
                </CardContent>
              </Card>

              {/* Monthly */}
              <Card className="rounded-2xl">
                <CardContent className="pt-5 pb-4 px-4 flex flex-col items-center text-center gap-1">
                  <CalendarCheck className="h-6 w-6" style={{ color: PALETTE.sage }} />
                  <span className="text-2xl font-bold text-foreground">
                    {dashboard.monthlyCheckins}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{dashboard.daysInMonth}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("mentalToolkit.moodDashboard.monthlyCheckins")}
                  </span>
                </CardContent>
              </Card>

              {/* Today */}
              <Card className="rounded-2xl">
                <CardContent className="pt-5 pb-4 px-4 flex flex-col items-center text-center gap-1">
                  {todayDef ? (
                    <>
                      <span className="text-3xl">{todayDef.emoji}</span>
                      <span className="text-sm font-medium text-foreground">
                        {isRTL ? todayDef.label_ar : todayDef.label_en}
                      </span>
                    </>
                  ) : (
                    <>
                      <Activity className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {t("mentalToolkit.moodDashboard.notCheckedIn")}
                      </span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {t("mentalToolkit.moodDashboard.todayMood")}
                  </span>
                </CardContent>
              </Card>
            </div>

            {/* ── Mood Trend Chart ── */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" style={{ color: PALETTE.lavender }} />
                  {t("mentalToolkit.moodDashboard.moodTrend")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PALETTE.lavender} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={PALETTE.lavender} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 5]}
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ active, payload }) =>
                          active && payload?.length ? (
                            <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-md">
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
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke={PALETTE.lavender}
                        fill="url(#moodGrad)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: PALETTE.lavender }}
                        connectNulls
                      />
                      {dashboard.hasOrgData && (
                        <Area
                          type="monotone"
                          dataKey="orgAvg"
                          stroke={PALETTE.sage}
                          fill="none"
                          strokeWidth={1.5}
                          strokeDasharray="5 3"
                          dot={false}
                          connectNulls
                        />
                      )}
                      <ReferenceLine y={3} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {dashboard.hasOrgData && (
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: PALETTE.lavender }} />
                      {t("mentalToolkit.moodDashboard.yourMood")}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-0.5 rounded border-dashed border-t-2" style={{ borderColor: PALETTE.sage }} />
                      {t("mentalToolkit.moodDashboard.orgAverage")}
                    </span>
                  </div>
                )}
                {!dashboard.hasOrgData && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {t("mentalToolkit.moodDashboard.orgComparisonNote")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* ── Two-column: Distribution + Activity ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Donut */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-4 w-4" style={{ color: PALETTE.sage }} />
                    {t("mentalToolkit.moodDashboard.moodDistribution")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {donutData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t("mentalToolkit.moodDashboard.noDataYet")}
                    </p>
                  ) : (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={donutData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={3}
                          >
                            {donutData.map((_, idx) => (
                              <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend
                            iconSize={10}
                            wrapperStyle={{ fontSize: 11 }}
                          />
                          <Tooltip
                            formatter={(value: number) => [value, t("mentalToolkit.moodDashboard.days")]}
                          />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weekly Activity Heatmap */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" style={{ color: PALETTE.plum }} />
                    {t("mentalToolkit.moodDashboard.weeklyActivity")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {DAY_KEYS.map((dayKey, i) => {
                      const count = dashboard.dayActivity[i];
                      const max = Math.max(...dashboard.dayActivity, 1);
                      const intensity = count / max;
                      return (
                        <div key={dayKey} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">
                            {t(`wellness.days.${dayKey}`)}
                          </span>
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium"
                            style={{
                              backgroundColor:
                                count === 0
                                  ? "hsl(var(--muted))"
                                  : `rgba(201, 184, 232, ${0.2 + intensity * 0.8})`,
                              color: count > 0 ? PALETTE.plum : "hsl(var(--muted-foreground))",
                            }}
                          >
                            {count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Survey Stats ── */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" style={{ color: PALETTE.lavender }} />
                  {t("mentalToolkit.moodDashboard.surveyStats")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {dashboard.surveyStats.totalAnswered}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("mentalToolkit.moodDashboard.totalAnswered")}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {dashboard.surveyStats.avgScore}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("mentalToolkit.moodDashboard.avgResponseScore")}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {dashboard.surveyStats.completionRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("mentalToolkit.moodDashboard.completionRate")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Reframe Activity ── */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" style={{ color: PALETTE.sage }} />
                  {t("mentalToolkit.moodDashboard.reframeActivity")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{dashboard.reframeStats.total}</p>
                    <p className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.totalReframes")}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{dashboard.reframeStats.thisMonth}</p>
                    <p className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.reframesThisMonth")}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{dashboard.reframeStats.streak}d</p>
                    <p className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.reframeStreak")}</p>
                  </div>
                </div>
                <Link to="/mental-toolkit/thought-reframer"
                  className="mt-3 block text-center text-sm font-medium hover:underline"
                  style={{ color: PALETTE.sage }}>
                  {t("mentalToolkit.moodDashboard.goToReframer")} →
                </Link>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
