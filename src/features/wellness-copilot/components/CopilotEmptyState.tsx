import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Sparkles, ChevronRight } from "lucide-react";

interface Props {
  fallbackCta: string;
}

const ctaMap: Record<string, { route: string; labelKey: string }> = {
  complete_checkin: { route: "/employee", labelKey: "copilot.ctaCheckin" },
  review_workload: { route: "/employee/workload", labelKey: "copilot.ctaWorkload" },
  launch_survey: { route: "/admin/questions", labelKey: "copilot.ctaSurvey" },
  no_team_members: { route: "/admin/employees", labelKey: "copilot.ctaManageTeam" },
};

export function CopilotEmptyState({ fallbackCta }: Props) {
  const { t } = useTranslation();
  const cta = ctaMap[fallbackCta] ?? ctaMap.complete_checkin;

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/10">
        <Sparkles className="h-5 w-5 text-muted-foreground/50" strokeWidth={1.5} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
        {t("copilot.insufficientData")}
      </p>
      <Link
        to={cta.route}
        className="flex items-center gap-1 rounded-xl bg-primary/[0.06] hover:bg-primary/[0.1] px-4 py-2 text-xs font-semibold text-primary transition-all duration-200"
      >
        {t(cta.labelKey)}
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
      </Link>
    </div>
  );
}
