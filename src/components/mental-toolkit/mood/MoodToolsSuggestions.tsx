import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, RefreshCw, ArrowRight, Wind } from "lucide-react";
import { TOOLKIT } from "@/config/toolkit-colors";

interface MoodToolsSuggestionsProps {
  surveyStats: { totalAnswered: number; avgScore: number; completionRate: number };
  reframeStats: { total: number; thisMonth: number; streak: number };
  breathingStats: { totalSessions: number; thisMonth: number; currentStreak: number; avgMoodImprovement: number };
}

export function MoodToolsSuggestions({ surveyStats, reframeStats, breathingStats }: MoodToolsSuggestionsProps) {
  const { t } = useTranslation();

  return (
    <>
      <Card className="glass-card border-0 rounded-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" style={{ color: TOOLKIT.lavender }} />
            {t("mentalToolkit.moodDashboard.surveyStats")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-bold text-foreground">{surveyStats.totalAnswered}</p><p className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.totalAnswered")}</p></div>
            <div><p className="text-2xl font-bold text-foreground">{surveyStats.avgScore}</p><p className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.avgResponseScore")}</p></div>
            <div><p className="text-2xl font-bold text-foreground">{surveyStats.completionRate}%</p><p className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.completionRate")}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" style={{ color: TOOLKIT.sage }} />
            {t("mentalToolkit.moodDashboard.reframeActivity")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-bold text-foreground">{reframeStats.total}</p><p className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.totalReframes")}</p></div>
            <div><p className="text-2xl font-bold text-foreground">{reframeStats.thisMonth}</p><p className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.reframesThisMonth")}</p></div>
            <div><p className="text-2xl font-bold text-foreground">{reframeStats.streak}d</p><p className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.reframeStreak")}</p></div>
          </div>
          <Link to="/mental-toolkit/thought-reframer" className="mt-3 block text-center text-sm font-medium hover:underline" style={{ color: TOOLKIT.sage }}>
            {t("mentalToolkit.moodDashboard.goToReframer")} <ArrowRight className="inline h-4 w-4 ms-1 rtl:-scale-x-100" />
          </Link>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wind className="h-4 w-4" style={{ color: TOOLKIT.lavender }} />
            {t("mentalToolkit.moodDashboard.breathingActivity")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-bold text-foreground">{breathingStats.totalSessions}</p><p className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.breathingSessions")}</p></div>
            <div><p className="text-2xl font-bold text-foreground">{breathingStats.thisMonth}</p><p className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.breathingThisMonth")}</p></div>
            <div><p className="text-2xl font-bold text-foreground">{breathingStats.currentStreak}d</p><p className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.breathingStreak")}</p></div>
          </div>
          {breathingStats.avgMoodImprovement !== 0 && (
            <p className="text-center text-xs mt-2" style={{ color: breathingStats.avgMoodImprovement > 0 ? TOOLKIT.sage : TOOLKIT.plum }}>
              {breathingStats.avgMoodImprovement > 0 ? "+" : ""}{breathingStats.avgMoodImprovement} avg mood change
            </p>
          )}
          <Link to="/mental-toolkit/breathing" className="mt-3 block text-center text-sm font-medium hover:underline" style={{ color: TOOLKIT.lavender }}>
            {t("mentalToolkit.moodDashboard.goToBreathing")} <ArrowRight className="inline h-4 w-4 ms-1 rtl:-scale-x-100" />
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
