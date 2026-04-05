import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  recommendedAction: string;
  actionPath: string;
  actionCta: string;
}

export function PulseActionPath({ recommendedAction, actionPath, actionCta }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <p className="text-xs text-foreground/70">{recommendedAction}</p>
      <button
        onClick={() => {
          if (actionPath && actionPath.startsWith("/")) {
            window.location.href = actionPath;
          }
        }}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl py-2.5",
          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
          "text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200",
          "hover:scale-[1.01] active:scale-[0.99]"
        )}
      >
        {actionCta || t("pulse.takeAction")}
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={2} />
      </button>
    </div>
  );
}
