import { ReactNode } from "react";
import { typography, layout, iconBox, cardVariants } from "@/theme/tokens";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  maxWidth?: "2xl" | "4xl";
  /** "flush" = edge-to-edge bar (rounded-none, border-b). "card" = rounded card with padding. */
  variant?: "flush" | "card";
}

export default function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  maxWidth = "4xl",
  variant = "flush",
}: PageHeaderProps) {
  const maxWClass = maxWidth === "2xl" ? layout.narrowMaxWidth : layout.contentMaxWidth;

  if (variant === "card") {
    return (
      <div className={cn(cardVariants.glass, "p-6")}>
        <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4")}>
          <div className="flex items-center gap-3">
            <div className={cn(iconBox.md, "bg-primary/10")}>
              {icon}
            </div>
            <div>
              <h1 className={typography.pageTitle}>{title}</h1>
              {subtitle && <p className={typography.subtitle}>{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(cardVariants.glass, "rounded-none border-b border-border/50 px-4 py-5 sm:px-6")}>
      <div className={cn(maxWClass, "flex items-center gap-3")}>
        <div className={cn(iconBox.md, "bg-primary/10")}>
          {icon}
        </div>
        <div className="flex-1">
          <h1 className={typography.pageTitle}>{title}</h1>
          {subtitle && <p className={typography.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}