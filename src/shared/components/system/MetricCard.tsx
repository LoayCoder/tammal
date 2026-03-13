import { ReactNode, memo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/card";
import { cardVariants, typography } from "@/theme/tokens";
import { cn } from "@/shared/utils/utils";

interface MetricCardProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  description?: string;
  className?: string;
}

/**
 * Dashboard metric card — follows the existing glass-stat pattern
 * used across TeamWorkload, PortfolioDashboard, OrgStatCards, etc.
 */
const MetricCard = memo(function MetricCard({
  title,
  value,
  icon,
  description,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn(cardVariants.stat, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={typography.statLabel}>{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={typography.metric}>{value}</div>
        {description && (
          <p className={cn(typography.caption, "mt-1")}>{description}</p>
        )}
      </CardContent>
    </Card>
  );
});

export default MetricCard;
