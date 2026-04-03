import { ReactNode, memo } from "react";
import { Card } from "@/components/ui/card";
import { cardVariants, typography } from "@/theme/tokens";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  description?: string;
  className?: string;
}

/**
 * Dashboard metric card — flat Linear-style layout
 */
const MetricCard = memo(function MetricCard({
  title,
  value,
  icon,
  description,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn(cardVariants.stat, "p-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <p className={typography.statLabel}>{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className={typography.metric}>{value}</div>
      {description && (
        <p className={cn(typography.caption, "mt-1")}>{description}</p>
      )}
    </Card>
  );
});

export default MetricCard;
