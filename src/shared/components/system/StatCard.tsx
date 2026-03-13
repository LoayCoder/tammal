import { ReactNode, memo } from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cardVariants, spacing, typography, iconBox } from "@/theme/tokens";
import { cn } from "@/shared/utils/utils";

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  /** Optional trend or secondary info */
  trend?: ReactNode;
  className?: string;
}

const StatCard = memo(function StatCard({
  title,
  value,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn(cardVariants.stat, className)}>
      <CardContent className={cn(spacing.cardCompact, "flex items-start gap-3")}>
        {icon && (
          <div className={cn(iconBox.sm, "bg-primary/10 mt-0.5")}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={typography.statLabel}>{title}</p>
          <p className={typography.metric}>{value}</p>
          {trend && <div className="mt-1">{trend}</div>}
        </div>
      </CardContent>
    </Card>
  );
});

export default StatCard;
