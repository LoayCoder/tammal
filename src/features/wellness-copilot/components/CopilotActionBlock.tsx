import { useTranslation } from "react-i18next";
import { Zap, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { ActionCta } from "../hooks/useCopilotInsight";

interface Props {
  action: string;
  actionCta: ActionCta;
}

const ctaRoutes: Record<ActionCta, string> = {
  complete_checkin: "/employee",
  review_workload: "/employee/workload",
  view_team: "/admin/analytics",
  launch_survey: "/admin/questions",
  view_insights: "/admin/analytics",
  take_break: "/employee/wellness-tools",
  review_tasks: "/employee/tasks",
};

const ctaLabels: Record<ActionCta, string> = {
  complete_checkin: "copilot.ctaCheckin",
  review_workload: "copilot.ctaWorkload",
  view_team: "copilot.ctaTeam",
  launch_survey: "copilot.ctaSurvey",
  view_insights: "copilot.ctaInsights",
  take_break: "copilot.ctaBreak",
  review_tasks: "copilot.ctaTasks",
};

export function CopilotActionBlock({ action, actionCta }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chart-1/[0.06]">
          <Zap className="h-4 w-4 text-chart-1" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <span className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("copilot.action")}
          </span>
          <p className="text-sm text-foreground leading-relaxed">{action}</p>
        </div>
      </div>
      <Link
        to={ctaRoutes[actionCta] ?? "/employee"}
        className="flex items-center justify-center gap-1.5 rounded-xl bg-primary/[0.06] hover:bg-primary/[0.1] px-4 py-2.5 text-xs font-semibold text-primary transition-all duration-200"
      >
        {t(ctaLabels[actionCta] ?? "copilot.ctaCheckin")}
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
      </Link>
    </div>
  );
}
