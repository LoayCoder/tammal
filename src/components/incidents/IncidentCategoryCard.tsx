import { ShieldCheck, HeartPulse, Building2, Leaf, Lock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/utils";
import type { IncidentCategory } from "@/theme/tokens";

const CATEGORY_ICONS = {
  safety:        ShieldCheck,
  injury:        HeartPulse,
  property:      Building2,
  environmental: Leaf,
  security:      Lock,
} as const;

const CATEGORY_STYLE = {
  safety:        { color: "text-incident-safety",        bg: "bg-incident-safety-bg",        iconBg: "bg-incident-safety/10"        },
  injury:        { color: "text-incident-injury",        bg: "bg-incident-injury-bg",        iconBg: "bg-incident-injury/10"        },
  property:      { color: "text-incident-property",      bg: "bg-incident-property-bg",      iconBg: "bg-incident-property/10"      },
  environmental: { color: "text-incident-environmental", bg: "bg-incident-environmental-bg", iconBg: "bg-incident-environmental/10" },
  security:      { color: "text-incident-security",      bg: "bg-incident-security-bg",      iconBg: "bg-incident-security/10"      },
} as const;

interface IncidentCategoryCardProps {
  category: IncidentCategory;
  count: number;
  openCount: number;
  trend: "up" | "down" | "neutral";
  trendValue?: number;
  onClick?: () => void;
  className?: string;
}

export function IncidentCategoryCard({
  category,
  count,
  openCount,
  trend,
  trendValue,
  onClick,
  className,
}: IncidentCategoryCardProps) {
  const { t } = useTranslation();
  const style = CATEGORY_STYLE[category];
  const Icon = CATEGORY_ICONS[category];
  const label       = t(`incidents.category.${category}.label`);
  const description = t(`incidents.category.${category}.description`);

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-toolkit-coral"
      : trend === "down"
      ? "text-success"
      : "text-muted-foreground";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl border border-border/50 p-5",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-md hover:border-border",
        "focus-visible:outline-none focus-calm",
        style.bg,
        className
      )}
    >
      {/* Icon + trend row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            style.iconBg
          )}
        >
          <Icon className={cn("w-5 h-5", style.color)} strokeWidth={1.75} />
        </div>
        {trendValue !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{trendValue}%</span>
          </div>
        )}
      </div>

      {/* Metric */}
      <p className="text-2xl font-bold text-foreground tabular-nums mb-0.5">
        {count}
      </p>
      <p className={cn("text-sm font-semibold mb-1", style.color)}>
        {label}
      </p>
      <p className="text-xs text-muted-foreground leading-snug">
        {description}
      </p>

      {/* Open count */}
      {openCount > 0 && (
        <div className="mt-3 pt-3 border-t border-border/40">
          <span className={cn("text-xs font-semibold", style.color)}>
            {t('incidents.openCount', { count: openCount })}
          </span>
        </div>
      )}
    </button>
  );
}
