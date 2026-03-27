import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { cardVariants } from "@/theme/tokens";

interface ToolkitCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "stat" | "dashed";
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  default: cardVariants.glass,
  stat: cardVariants.stat,
  dashed: cardVariants.dashed,
};

const ToolkitCard = React.forwardRef<HTMLDivElement, ToolkitCardProps>(
  ({ variant = "default", className, children, ...props }, ref) => (
    <Card ref={ref} className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </Card>
  ),
);
ToolkitCard.displayName = "ToolkitCard";

export default ToolkitCard;
