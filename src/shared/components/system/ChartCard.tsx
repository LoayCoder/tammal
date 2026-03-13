import { ReactNode, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { cardVariants, spacing, typography } from "@/theme/tokens";
import { cn } from "@/shared/utils/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

const ChartCard = memo(function ChartCard({
  title,
  description,
  actions,
  children,
  className,
}: ChartCardProps) {
  return (
    <Card className={cn(cardVariants.glass, className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div>
          <CardTitle className={typography.cardTitle}>{title}</CardTitle>
          {description && (
            <CardDescription className="mt-1">{description}</CardDescription>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </CardHeader>
      <CardContent className={spacing.cardStandard}>
        {children}
      </CardContent>
    </Card>
  );
});

export default ChartCard;
