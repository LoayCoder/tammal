import { ReactNode, memo } from "react";
import { layout } from "@/theme/tokens";
import { cn } from "@/lib/utils";

interface DashboardGridProps {
  columns?: 2 | 3 | 4 | 6;
  children: ReactNode;
  className?: string;
}

const gridMap: Record<number, string> = {
  2: layout.statGrid2,
  3: layout.statGrid3,
  4: layout.statGrid4,
  6: layout.statGrid6,
};

const DashboardGrid = memo(function DashboardGrid({
  columns = 4,
  children,
  className,
}: DashboardGridProps) {
  return (
    <div className={cn(gridMap[columns], className)}>
      {children}
    </div>
  );
});

export default DashboardGrid;
