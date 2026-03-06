import { ReactNode } from "react";

interface ToolkitPageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  maxWidth?: "2xl" | "4xl";
}

export default function ToolkitPageHeader({
  icon,
  title,
  subtitle,
  actions,
  maxWidth = "2xl",
}: ToolkitPageHeaderProps) {
  const maxWClass = maxWidth === "4xl" ? "max-w-4xl" : "max-w-2xl";

  return (
    <div className="glass-card border-0 rounded-none border-b border-border/50 px-4 py-5 sm:px-6">
      <div className={`${maxWClass} mx-auto flex items-center gap-3`}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-primary/10">
          {icon}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
