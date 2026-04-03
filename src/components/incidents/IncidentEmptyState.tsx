import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/utils";
import { Button } from "@/shared/components/ui/button";
import type { IncidentCategory } from "@/theme/tokens";
import { incidentCategories } from "@/theme/tokens";

interface IncidentEmptyStateProps {
  category?: IncidentCategory;
  onCreateNew?: () => void;
  className?: string;
}

export function IncidentEmptyState({
  category,
  onCreateNew,
  className,
}: IncidentEmptyStateProps) {
  const { t } = useTranslation();

  const CATEGORY_MESSAGES: Record<IncidentCategory, { headline: string; copy: string }> = {
    safety:        { headline: t('incidents.empty.safety.headline'),        copy: t('incidents.empty.safety.copy')        },
    injury:        { headline: t('incidents.empty.injury.headline'),        copy: t('incidents.empty.injury.copy')        },
    property:      { headline: t('incidents.empty.property.headline'),      copy: t('incidents.empty.property.copy')      },
    environmental: { headline: t('incidents.empty.environmental.headline'), copy: t('incidents.empty.environmental.copy') },
    security:      { headline: t('incidents.empty.security.headline'),      copy: t('incidents.empty.security.copy')      },
  };
  const DEFAULT_MESSAGE = {
    headline: t('incidents.empty.default.headline'),
    copy:     t('incidents.empty.default.copy'),
  };

  const message = category ? CATEGORY_MESSAGES[category] : DEFAULT_MESSAGE;
  const categoryToken = category ? incidentCategories[category] : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 py-16 px-6 text-center animate-calm-fade-in",
        className
      )}
    >
      {/* Soft icon */}
      <div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center",
          categoryToken ? categoryToken.bg : "bg-primary/8"
        )}
      >
        <ShieldCheck
          className={cn(
            "w-8 h-8",
            categoryToken ? categoryToken.color : "text-primary"
          )}
          strokeWidth={1.5}
        />
      </div>

      {/* Copy */}
      <div className="max-w-xs">
        <h3 className="text-base font-semibold text-foreground">{message.headline}</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{message.copy}</p>
      </div>

      {/* Soft CTA */}
      <Button
        variant="outline"
        onClick={onCreateNew}
        className="rounded-xl px-6 h-10 text-sm font-medium border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
      >
        {t('incidents.empty.reportAction')}
      </Button>
    </div>
  );
}
