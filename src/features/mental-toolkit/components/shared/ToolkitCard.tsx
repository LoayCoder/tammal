import * as React from "react";
import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/utils";

interface ToolkitCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "stat" | "dashed";
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  default: "glass-card border-0 rounded-lg",
  stat: "glass-stat border-0 rounded-lg",
  dashed: "glass-card border-0 rounded-lg border-dashed",
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
