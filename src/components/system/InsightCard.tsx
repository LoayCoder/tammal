import { ReactNode, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cardVariants, spacing, typography, iconBox } from "@/theme/tokens";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  /** Optional badge or action in the top-end corner */
  badge?: ReactNode;
  className?: string;
}

const InsightCard = memo(function InsightCard({
  icon,
  title,
  description,
  badge,
  className,
}: InsightCardProps) {
  return (
    <Card className={cn(cardVariants.glass, className)}>
      <CardContent className={cn(spacing.cardInteractive, "space-y-3")}>
        <div className="flex items-center justify-between gap-2">
          <div className={cn(iconBox.sm, "bg-primary/10")}>
            {icon}
          </div>
          {badge}
        </div>
        <div>
          <h3 className={typography.cardTitle}>{title}</h3>
          <p className={cn(typography.subtitle, "mt-1")}>{description}</p>
        </div>
      </CardContent>
    </Card>
  );
});

export default InsightCard;
