import { useTranslation } from "react-i18next";
import { Shield, AlertTriangle, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamMemberPulse } from "../hooks/useTeamMemberPulse";

interface Props {
  members: TeamMemberPulse[];
}

export function TeamHealthSummary({ members }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const high = members.filter((m) => m.riskLevel === "high").length;
  const medium = members.filter((m) => m.riskLevel === "medium").length;
  const healthy = members.filter((m) => m.riskLevel === "healthy").length;
  const total = members.length;

  const highPct = total ? (high / total) * 100 : 0;
  const medPct = total ? (medium / total) * 100 : 0;
  const healthyPct = total ? (healthy / total) * 100 : 0;

  const overallStatus = highPct >= 30 ? "critical" : high > 0 || medPct >= 40 ? "at_risk" : "healthy";

  const statusConfig = {
    critical: {
      label: isAr ? "حرج" : "Critical",
      color: "text-destructive",
      bg: "bg-destructive/10",
      Icon: AlertTriangle,
    },
    at_risk: {
      label: isAr ? "يحتاج انتباه" : "At Risk",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      Icon: Shield,
    },
    healthy: {
      label: isAr ? "صحي" : "Healthy",
      color: "text-chart-2",
      bg: "bg-chart-2/10",
      Icon: Heart,
    },
  };

  const cfg = statusConfig[overallStatus];

  return (
    <div className={cn("rounded-xl p-3 border border-border/10", cfg.bg)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <cfg.Icon className={cn("h-4 w-4", cfg.color)} strokeWidth={1.5} />
          <span className={cn("text-xs font-bold", cfg.color)}>{cfg.label}</span>
        </div>
        <span className="text-2xs text-muted-foreground">
          {total} {isAr ? "عضو" : "members"}
        </span>
      </div>

      {/* Risk bar */}
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted/20">
        {healthyPct > 0 && (
          <div className="bg-chart-2 transition-all" style={{ width: `${healthyPct}%` }} />
        )}
        {medPct > 0 && (
          <div className="bg-amber-400 transition-all" style={{ width: `${medPct}%` }} />
        )}
        {highPct > 0 && (
          <div className="bg-destructive transition-all" style={{ width: `${highPct}%` }} />
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mt-2 text-2xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-chart-2" />
          {healthy} {isAr ? "سليم" : "healthy"}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          {medium} {isAr ? "متوسط" : "at risk"}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
          {high} {isAr ? "مرتفع" : "critical"}
        </span>
      </div>
    </div>
  );
}
