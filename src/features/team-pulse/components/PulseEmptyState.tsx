import { memo } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3 } from "lucide-react";

interface Props {
  fallbackCta?: string;
}

export const PulseEmptyState = memo(function PulseEmptyState({ fallbackCta }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/10">
        <BarChart3 className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground/70">{t("pulse.emptyTitle")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("pulse.emptyDescription")}</p>
      </div>
    </div>
  );
});
