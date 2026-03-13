import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import {
  useObjectives, useInitiatives, useWorkloadAnalytics, useWorkloadMetrics,
  useExecutionVelocity, useWorkloadHeatmap, useInitiativeRisk,
  useBurnoutPredictions, useRedistributionRecommendations,
  useOrgIntelligenceScore, useRunAnalyticsSnapshot, useRunAIPredictions,
} from '@/features/workload';
import { toast } from 'sonner';
import { Brain, RefreshCw } from 'lucide-react';

import { TammalIndexCard } from '@/features/workload/components/executive/TammalIndexCard';
import { ExecutiveKPIRow } from '@/features/workload/components/executive/ExecutiveKPIRow';
import { StrategicProgressCard } from '@/features/workload/components/executive/StrategicProgressCard';
import { DepartmentWorkloadCard } from '@/features/workload/components/executive/DepartmentWorkloadCard';
import { DeliveryPerformanceCard } from '@/features/workload/components/executive/DeliveryPerformanceCard';
import { WorkforceHealthCard } from '@/features/workload/components/executive/WorkforceHealthCard';
import { BurnoutPredictionsCard } from '@/features/workload/components/executive/BurnoutPredictionsCard';
import { RedistributionCard } from '@/features/workload/components/executive/RedistributionCard';
import { BurnoutRiskMapCard } from '@/features/workload/components/executive/BurnoutRiskMapCard';
import { AlignmentOverviewCard } from '@/features/workload/components/executive/AlignmentOverviewCard';

export default function ExecutiveDashboard() {
  const { t } = useTranslation();

  // Data hooks
  const { objectives, isPending: objLoading } = useObjectives();
  const { initiatives, isPending: initLoading } = useInitiatives();
  const { teamLoad, totalEmployees, atRiskCount, isPending: analyticsLoading } = useWorkloadAnalytics();
  const { metrics, isPending: metricsLoading } = useWorkloadMetrics();
  const { avgVelocity, totalCompleted, isPending: velocityLoading } = useExecutionVelocity();
  const { distribution, isPending: heatmapLoading } = useWorkloadHeatmap();
  const { metrics: riskMetrics, isPending: riskLoading } = useInitiativeRisk();
  const { predictions: burnoutPredictions, isPending: burnoutLoading } = useBurnoutPredictions();
  const { pending: pendingRedistributions, isPending: redistLoading, updateStatus } = useRedistributionRecommendations();
  const { score: orgScore, isPending: orgScoreLoading } = useOrgIntelligenceScore();
  const snapshotMutation = useRunAnalyticsSnapshot();
  const aiMutation = useRunAIPredictions();

  const isPending = objLoading || initLoading || analyticsLoading || metricsLoading;

  // Actions
  const handleSnapshot = async () => {
    try {
      await snapshotMutation.mutateAsync('compute_velocity');
      await snapshotMutation.mutateAsync('snapshot_heatmap');
      await snapshotMutation.mutateAsync('compute_initiative_risk');
      await snapshotMutation.mutateAsync('snapshot_alignment');
      await snapshotMutation.mutateAsync('compute_org_score');
      toast.success(t('executive.snapshotSuccess'));
    } catch {
      toast.error('Snapshot failed');
    }
  };

  const handleAIPredictions = async () => {
    try {
      await aiMutation.mutateAsync('predict_burnout');
      await aiMutation.mutateAsync('smart_redistribute');
      toast.success(t('executive.aiPredictionsSuccess'));
    } catch {
      toast.error(t('executive.aiPredictionsFailed'));
    }
  };

  // Derived metrics
  const avgObjProgress = objectives.length > 0
    ? Math.round(objectives.reduce((s, o) => s + (o.progress ?? 0), 0) / objectives.length) : 0;
  const avgInitProgress = initiatives.length > 0
    ? Math.round(initiatives.reduce((s, i) => s + (i.progress ?? 0), 0) / initiatives.length) : 0;

  const avgUtilization = metrics.length > 0
    ? Math.round(metrics.reduce((s, m) => s + m.utilization_percentage, 0) / metrics.length) : 0;
  const avgAlignment = metrics.length > 0
    ? Math.round(metrics.reduce((s, m) => s + m.alignment_score, 0) / metrics.length) : 0;
  const burnoutRiskEmployees = metrics.filter(m => m.burnout_risk_score > 60).length;

  const totalTasks = teamLoad.reduce((s, m) => s + m.totalTasks, 0);
  const totalDone = teamLoad.reduce((s, m) => s + m.doneTasks, 0);
  const completionRate = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
  const totalOverdue = teamLoad.reduce((s, m) => s + m.overdueTasks, 0);
  const overdueRate = totalTasks > 0 ? Math.round((totalOverdue / totalTasks) * 100) : 0;

  // Department chart
  const deptRisk = teamLoad.reduce<Record<string, { total: number; atRisk: number; avgLoad: number }>>((acc, m) => {
    const dept = m.department ?? t('common.unassigned');
    if (!acc[dept]) acc[dept] = { total: 0, atRisk: 0, avgLoad: 0 };
    acc[dept].total++;
    acc[dept].avgLoad += m.estimatedMinutes;
    if (m.estimatedMinutes > 480 || m.overdueTasks > 2) acc[dept].atRisk++;
    return acc;
  }, {});
  const deptChart = Object.entries(deptRisk).map(([dept, data]) => ({
    name: dept.length > 15 ? dept.slice(0, 15) + '…' : dept,
    avgHours: Math.round((data.avgLoad / data.total / 60) * 10) / 10,
    atRisk: data.atRisk,
    total: data.total,
  })).sort((a, b) => b.avgHours - a.avgHours).slice(0, 8);

  // Maps
  const initMap: Record<string, string> = {};
  initiatives.forEach(i => { initMap[i.id] = i.title; });
  const empMap: Record<string, string> = {};
  teamLoad.forEach(t => { empMap[t.employeeId] = t.employeeName; });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('executive.pageTitle')}</h1>
          <p className="text-muted-foreground text-sm">{t('executive.pageDesc')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAIPredictions} disabled={aiMutation.isPending} className="gap-2">
            <Brain className={`h-3.5 w-3.5 ${aiMutation.isPending ? 'animate-spin' : ''}`} />
            {aiMutation.isPending ? t('executive.aiRunning') : t('executive.runAI')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSnapshot} disabled={snapshotMutation.isPending} className="gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${snapshotMutation.isPending ? 'animate-spin' : ''}`} />
            {snapshotMutation.isPending ? t('executive.snapshotRunning') : t('executive.runSnapshot')}
          </Button>
        </div>
      </div>

      <TammalIndexCard score={orgScore} isPending={orgScoreLoading} />

      <ExecutiveKPIRow
        strategicProgress={avgObjProgress}
        utilization={avgUtilization}
        burnoutRiskCount={burnoutRiskEmployees}
        completionRate={completionRate}
        isPending={isPending}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StrategicProgressCard objProgress={avgObjProgress} initProgress={avgInitProgress} isPending={isPending} />
        <DepartmentWorkloadCard data={deptChart} isPending={isPending} />
      </div>

      <DeliveryPerformanceCard
        avgVelocity={avgVelocity}
        totalCompleted={totalCompleted}
        completionRate={completionRate}
        overdueRate={overdueRate}
        isPending={velocityLoading || isPending}
      />

      <WorkforceHealthCard
        distribution={distribution}
        heatmapLoading={heatmapLoading}
        riskMetrics={riskMetrics}
        riskLoading={riskLoading}
        initMap={initMap}
      />

      <BurnoutPredictionsCard predictions={burnoutPredictions} isPending={burnoutLoading} empMap={empMap} />

      <RedistributionCard pending={pendingRedistributions} isPending={redistLoading} empMap={empMap} updateStatus={updateStatus} />

      <BurnoutRiskMapCard metrics={metrics} teamLoad={teamLoad} isPending={isPending} />

      <AlignmentOverviewCard avgAlignment={avgAlignment} avgUtilization={avgUtilization} atRiskCount={atRiskCount} isPending={isPending} />
    </div>
  );
}
