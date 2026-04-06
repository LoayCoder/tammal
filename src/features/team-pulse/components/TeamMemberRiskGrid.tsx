import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { TeamMemberPulse, RiskLevel } from "../hooks/useTeamMemberPulse";
import { TeamMemberActions } from "./TeamMemberActions";

interface Props {
  members: TeamMemberPulse[];
}

const riskConfig: Record<RiskLevel, { label: string; labelAr: string; dot: string; badge: string }> = {
  high: {
    label: "High",
    labelAr: "مرتفع",
    dot: "bg-destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
  },
  medium: {
    label: "At Risk",
    labelAr: "متوسط",
    dot: "bg-amber-400",
    badge: "bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-400/20",
  },
  healthy: {
    label: "Healthy",
    labelAr: "سليم",
    dot: "bg-chart-2",
    badge: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
};

const moodDotColor: Record<string, string> = {
  great: "bg-chart-2",
  good: "bg-chart-2/70",
  okay: "bg-amber-400",
  low: "bg-destructive",
};

export function TeamMemberRiskGrid({ members }: Props) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  if (!members.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-foreground">
        {isAr ? "أعضاء الفريق" : "Team Members"}
      </h4>
      <div className="space-y-2 max-h-[280px] overflow-y-auto pe-1 scrollbar-thin">
        {members.map((member) => {
          const risk = riskConfig[member.riskLevel];
          const moodDot = member.moodLevel ? moodDotColor[member.moodLevel] ?? "bg-muted" : "bg-muted";

          return (
            <div
              key={member.id}
              className="rounded-xl border border-border/10 bg-card/50 p-3 transition-all hover:bg-card/80"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Mood dot */}
                  <span className={cn("h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-background", moodDot)} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{member.fullName}</p>
                    {member.roleTitle && (
                      <p className="text-2xs text-muted-foreground truncate">{member.roleTitle}</p>
                    )}
                  </div>
                </div>

                {/* Risk badge */}
                <span className={cn("shrink-0 rounded-md border px-1.5 py-0.5 text-2xs font-semibold", risk.badge)}>
                  {isAr ? risk.labelAr : risk.label}
                </span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-2 text-2xs text-muted-foreground">
                {member.avgMoodScore !== null && (
                  <span>
                    {isAr ? "المزاج" : "Mood"}: {member.avgMoodScore}/5
                  </span>
                )}
                <span>
                  {isAr ? "المهام" : "Tasks"}: {member.activeTasks}
                </span>
                {member.overdueTasks > 0 && (
                  <span className="text-destructive font-semibold">
                    {member.overdueTasks} {isAr ? "متأخرة" : "overdue"}
                  </span>
                )}
              </div>

              {/* Manager actions */}
              <TeamMemberActions memberId={member.id} memberName={member.fullName} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
