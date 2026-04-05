import { useTranslation } from "react-i18next";
import { Activity } from "lucide-react";
import PageHeader from "@/components/system/PageHeader";
import { spacing } from "@/theme/tokens";
import { cn } from "@/lib/utils";
import { useCurrentEmployee } from "@/hooks/auth/useCurrentEmployee";
import { usePulseModes } from "@/features/team-pulse/hooks/usePulseModes";
import { useTeamPulse } from "@/features/team-pulse/hooks/useTeamPulse";
import { useEngagementTrends } from "@/features/team-pulse/hooks/useEngagementTrends";
import { PulseModeSwitcher } from "@/features/team-pulse/components/PulseModeSwitcher";
import { PulseTrendChart } from "@/features/team-pulse/components/PulseTrendChart";
import { AppreciationTrendChart } from "@/features/team-pulse/components/AppreciationTrendChart";
import { EngagementActionTable } from "@/features/team-pulse/components/EngagementActionTable";
import { PulseInsightBlock } from "@/features/team-pulse/components/PulseInsightBlock";
import { PulseTargetBlock } from "@/features/team-pulse/components/PulseTargetBlock";
import { PulseActionPath } from "@/features/team-pulse/components/PulseActionPath";
import StatCard from "@/components/system/StatCard";
import ChartCard from "@/components/system/ChartCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/shared/resilience/ErrorBoundary";

export default function EngagementInsights() {
  const { t } = useTranslation();
  const { employee } = useCurrentEmployee();
  const employeeId = employee?.id ?? null;

  const { allowedModes, selectedMode, setMode, showModeSwitcher } = usePulseModes(employeeId);
  const { pulse, isPending: pulseLoading } = useTeamPulse(selectedMode, employeeId ?? "");
  const { pulseTrend, appreciationTrend, actionLog, isPending } = useEngagementTrends(selectedMode, employeeId);

  return (
    <div className={cn(spacing.pageWrapper, "space-y-6")}>
      <PageHeader
        icon={<Activity className="h-5 w-5" strokeWidth={1.5} />}
        title={t("engagementInsights.title")}
        subtitle={t("engagementInsights.subtitle")}
        variant="card"
      />

      {showModeSwitcher && (
        <div className="max-w-md">
          <PulseModeSwitcher
            allowedModes={allowedModes}
            selectedMode={selectedMode}
            onModeChange={setMode}
          />
        </div>
      )}

      {isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* 1. Pulse Trend */}
          <ErrorBoundary title={t("engagementInsights.pulseTrend")}>
            <PulseTrendChart data={pulseTrend} />
          </ErrorBoundary>

          {/* 2. Participation Overview */}
          {pulse && (
            <div className="grid gap-4 grid-cols-2">
              <StatCard
                title={t("engagementInsights.currentScore")}
                value={`${pulse.engagementScore}%`}
                icon={<Activity className="h-4 w-4" strokeWidth={1.5} />}
              />
              <StatCard
                title={t("engagementInsights.targetMetric")}
                value={`${pulse.currentValue}/${pulse.targetValue}`}
              />
            </div>
          )}

          {/* 3. Appreciation Activity */}
          <ErrorBoundary title={t("engagementInsights.appreciationTrend")}>
            <AppreciationTrendChart data={appreciationTrend} />
          </ErrorBoundary>

          {/* 4. Action Log */}
          <ErrorBoundary title={t("engagementInsights.actionLog")}>
            <ChartCard title={t("engagementInsights.actionLog")} description={t("engagementInsights.actionLogDesc")}>
              <EngagementActionTable data={actionLog} isLoading={isPending} />
            </ChartCard>
          </ErrorBoundary>

          {/* 5. Active Recommendations */}
          {pulse && !pulseLoading && (
            <ErrorBoundary title={t("engagementInsights.activeRecommendations")}>
              <ChartCard title={t("engagementInsights.activeRecommendations")}>
                <div className="space-y-4">
                  <PulseInsightBlock
                    insight={pulse.primaryInsight}
                    trend={pulse.trend}
                    engagementScore={pulse.engagementScore}
                    impactReason={pulse.impactReason}
                  />
                  <PulseTargetBlock
                    targetMetric={pulse.targetMetric}
                    currentValue={pulse.currentValue}
                    targetValue={pulse.targetValue}
                  />
                  <PulseActionPath
                    recommendedAction={pulse.recommendedAction}
                    actionPath={pulse.actionPath}
                    actionCta={pulse.actionCta}
                  />
                </div>
              </ChartCard>
            </ErrorBoundary>
          )}
        </div>
      )}
    </div>
  );
}
