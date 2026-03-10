import { useTranslation } from "react-i18next";
import { SmilePlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersonalMoodDashboard } from "@/hooks/analytics/usePersonalMoodDashboard";
import { format, subDays } from "date-fns";
import { TOOLKIT } from "@/config/toolkit-colors";
import { ToolkitPageHeader } from "@/components/mental-toolkit/shared";
import { MoodStatCards } from "@/components/mental-toolkit/mood/MoodStatCards";
import { MoodTrendChart } from "@/components/mental-toolkit/mood/MoodTrendChart";
import { MoodDistributionDonut } from "@/components/mental-toolkit/mood/MoodDistributionDonut";
import { MoodHeatmap } from "@/components/mental-toolkit/mood/MoodHeatmap";
import { MoodToolsSuggestions } from "@/components/mental-toolkit/mood/MoodToolsSuggestions";

export default function MoodTrackerPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const dashboard = usePersonalMoodDashboard();

  if (dashboard.isPending) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border px-4 py-5 sm:px-6">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-60" /></div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  const chartData = Array.from({ length: 14 }, (_, i) => {
    const d = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
    const entry = dashboard.last14.find(e => e.date === d);
    const moodDef = entry ? dashboard.moodDefs.find(m => m.key === entry.level) : null;
    return { date: d, label: format(subDays(new Date(), 13 - i), "dd/MM"), score: entry?.score ?? null, emoji: moodDef?.emoji ?? "", orgAvg: dashboard.orgAvgMap[d] ?? null };
  });

  const donutData = Object.entries(dashboard.distribution).map(([level, count]) => {
    const def = dashboard.moodDefs.find(m => m.key === level);
    const label = def ? (isRTL ? def.label_ar : def.label_en) : level;
    return { name: `${def?.emoji ?? ""} ${label}`, value: count };
  });

  const todayDef = dashboard.todayEntry ? dashboard.moodDefs.find(m => m.key === dashboard.todayEntry!.level) ?? null : null;
  const noData = dashboard.moodHistory.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <ToolkitPageHeader icon={<SmilePlus className="h-5 w-5 text-primary" />} title={t("mentalToolkit.moodDashboard.pageTitle")} subtitle={t("mentalToolkit.moodDashboard.pageSubtitle")} maxWidth="4xl" />

      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {noData ? (
          <Card className="glass-card border-0 rounded-2xl border-dashed">
            <CardContent className="py-10 text-center space-y-2">
              <SmilePlus className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-lg font-semibold text-foreground">{t("mentalToolkit.moodDashboard.noDataYet")}</p>
              <p className="text-sm text-muted-foreground">{t("mentalToolkit.moodDashboard.startCheckinPrompt")}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <MoodStatCards streak={dashboard.streak} avgMood7d={dashboard.avgMood7d} burnoutZone={dashboard.burnoutZone} monthlyCheckins={dashboard.monthlyCheckins} daysInMonth={dashboard.daysInMonth} todayDef={todayDef} isRTL={isRTL} />
            <MoodTrendChart data={chartData} hasOrgData={dashboard.hasOrgData} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MoodDistributionDonut data={donutData} />
              <MoodHeatmap dayActivity={dashboard.dayActivity} />
            </div>
            <MoodToolsSuggestions surveyStats={dashboard.surveyStats} reframeStats={dashboard.reframeStats} breathingStats={dashboard.breathingStats} />
          </>
        )}
      </div>
    </div>
  );
}
