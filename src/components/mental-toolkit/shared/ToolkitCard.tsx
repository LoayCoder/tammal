import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ToolkitCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "stat" | "dashed";
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  default: "glass-card border-0 rounded-2xl",
  stat: "glass-stat border-0 rounded-2xl",
  dashed: "glass-card border-0 rounded-2xl border-dashed",
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
