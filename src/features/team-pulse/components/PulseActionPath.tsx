import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { typography } from "@/theme/tokens";
import { useEngagementActionLog } from "../hooks/useEngagementActionLog";

interface Props {
  recommendedAction: string;
  actionPath: string;
  actionCta: string;
}

export function PulseActionPath({ recommendedAction, actionPath, actionCta }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logAction } = useEngagementActionLog();

  return (
    <div className="space-y-2 animate-fade-in">
      <span className={typography.statLabel}>{t("pulse.recommendedAction")}</span>
      <p className="text-xs text-foreground/70">{recommendedAction}</p>
      <button
        onClick={() => {
          logAction.mutate({ actionType: "cta_clicked", source: "pulse_card", metadata: { path: actionPath } });
          if (actionPath && actionPath.startsWith("/")) {
            navigate(actionPath);
          }
        }}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl py-2.5",
          "bg-primary text-primary-foreground",
          "text-xs font-semibold shadow-sm",
          "hover:bg-primary/90 hover:-translate-y-0.5",
          "active:scale-[0.99] transition-all duration-200"
        )}
      >
        {actionCta || t("pulse.takeAction")}
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={2} />
      </button>
    </div>
  );
}
