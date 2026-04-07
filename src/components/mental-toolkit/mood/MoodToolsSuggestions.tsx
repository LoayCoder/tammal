import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, RefreshCw, ArrowRight, Wind, Activity } from "lucide-react";
import { TOOLKIT } from "@/config/toolkit-colors";
import { typography } from "@/theme/tokens";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface MoodToolsSuggestionsProps {
  surveyStats: { totalAnswered: number; avgScore: number; completionRate: number };
  reframeStats: { total: number; thisMonth: number; streak: number };
  breathingStats: { totalSessions: number; thisMonth: number; currentStreak: number; avgMoodImprovement: number };
}

export function MoodToolsSuggestions({ surveyStats, reframeStats, breathingStats }: MoodToolsSuggestionsProps) {
  const { t } = useTranslation();

  const sections = [
    {
      icon: <ClipboardList className="h-4 w-4" strokeWidth={1.5} />,
      color: TOOLKIT.lavender,
      title: t("mentalToolkit.moodDashboard.surveyStats"),
      stats: [
        { value: surveyStats.totalAnswered, label: t("mentalToolkit.moodDashboard.totalAnswered") },
        { value: surveyStats.avgScore, label: t("mentalToolkit.moodDashboard.avgResponseScore") },
        { value: `${surveyStats.completionRate}%`, label: t("mentalToolkit.moodDashboard.completionRate") },
      ],
      link: null,
    },
    {
      icon: <RefreshCw className="h-4 w-4" strokeWidth={1.5} />,
      color: TOOLKIT.sage,
      title: t("mentalToolkit.moodDashboard.reframeActivity"),
      stats: [
        { value: reframeStats.total, label: t("mentalToolkit.moodDashboard.totalReframes") },
        { value: reframeStats.thisMonth, label: t("mentalToolkit.moodDashboard.reframesThisMonth") },
        { value: `${reframeStats.streak}d`, label: t("mentalToolkit.moodDashboard.reframeStreak") },
      ],
      link: { to: "/mental-toolkit/thought-reframer", label: t("mentalToolkit.moodDashboard.goToReframer"), color: TOOLKIT.sage },
    },
    {
      icon: <Wind className="h-4 w-4" strokeWidth={1.5} />,
      color: TOOLKIT.lavender,
      title: t("mentalToolkit.moodDashboard.breathingActivity"),
      stats: [
        { value: breathingStats.totalSessions, label: t("mentalToolkit.moodDashboard.breathingSessions") },
        { value: breathingStats.thisMonth, label: t("mentalToolkit.moodDashboard.breathingThisMonth") },
        { value: `${breathingStats.currentStreak}d`, label: t("mentalToolkit.moodDashboard.breathingStreak") },
      ],
      link: { to: "/mental-toolkit/breathing", label: t("mentalToolkit.moodDashboard.goToBreathing"), color: TOOLKIT.lavender },
      extra: breathingStats.avgMoodImprovement !== 0 ? (
        <span className="text-xs" style={{ color: breathingStats.avgMoodImprovement > 0 ? TOOLKIT.sage : TOOLKIT.plum }}>
          {breathingStats.avgMoodImprovement > 0 ? "+" : ""}{breathingStats.avgMoodImprovement} avg mood change
        </span>
      ) : null,
    },
  ];

  return (
    <Card className={cn("premium-card rounded-2xl")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          {t("mentalToolkit.moodDashboard.toolsActivity", "Tools Activity")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {sections.map((section, idx) => (
          <div key={idx}>
            {idx > 0 && <Separator className="my-4" />}
            <div className="flex items-start gap-3">
              <div className="mt-0.5" style={{ color: section.color }}>{section.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{section.title}</span>
                  {section.link && (
                    <Link
                      to={section.link.to}
                      className="text-xs font-medium flex items-center gap-0.5 transition-opacity hover:opacity-70"
                      style={{ color: section.link.color }}
                    >
                      {section.link.label}
                      <ArrowRight className="h-3 w-3 rtl:-scale-x-100" />
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {section.stats.map((stat, si) => (
                    <div key={si} className="text-center">
                      <p className={typography.metric}>{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
                {(section as any).extra}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
