import { ReactNode } from "react";
import { typography, layout, iconBox } from "@/theme/tokens";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  maxWidth?: "2xl" | "4xl";
}

export default function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  maxWidth = "4xl",
}: PageHeaderProps) {
  const maxWClass = maxWidth === "2xl" ? layout.narrowMaxWidth : layout.contentMaxWidth;

  return (
    <div className="glass-card border-0 rounded-none border-b border-border/50 px-4 py-5 sm:px-6">
      <div className={cn(maxWClass, "flex items-center gap-3")}>
        <div className={cn(iconBox.md, "bg-primary/10")}>
          {icon}
        </div>
        <div className="flex-1">
          <h1 className={typography.pageTitle}>{title}</h1>
          <p className={typography.subtitle}>{subtitle}</p>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
