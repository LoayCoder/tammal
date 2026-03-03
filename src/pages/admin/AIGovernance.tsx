import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserPermissions } from '@/hooks/auth/useUserPermissions';
import { useGovernanceSummary } from '@/features/ai-governance/hooks/useGovernanceSummary';
import { useRoutingLogs } from '@/features/ai-governance/hooks/useRoutingLogs';
import { useCostBreakdown } from '@/features/ai-governance/hooks/useCostBreakdown';
import { usePerformanceTrend } from '@/features/ai-governance/hooks/usePerformanceTrend';
import { useBudgetConfig, usePenalties } from '@/features/ai-governance/hooks/useGovernanceActions';
import { GovernanceOverview } from '@/features/ai-governance/components/GovernanceOverview';
import { ThompsonVisualizer } from '@/features/ai-governance/components/ThompsonVisualizer';
import { RoutingBreakdownTable } from '@/features/ai-governance/components/RoutingBreakdownTable';
import { ExplorationMonitor } from '@/features/ai-governance/components/ExplorationMonitor';
import { FinanceDashboard } from '@/features/ai-governance/components/FinanceDashboard';
import { BudgetControls } from '@/features/ai-governance/components/BudgetControls';
import { RiskDashboard } from '@/features/ai-governance/components/RiskDashboard';
import { PenaltyControls } from '@/features/ai-governance/components/PenaltyControls';
import { RoutingInspector } from '@/features/ai-governance/components/RoutingInspector';
import { StrategyControls } from '@/features/ai-governance/components/StrategyControls';
import { GovernanceAuditLog } from '@/features/ai-governance/components/GovernanceAuditLog';
import { AutonomousStatus } from '@/features/ai-governance/components/AutonomousStatus';
import { AnomalyTimeline } from '@/features/ai-governance/components/AnomalyTimeline';
import { SandboxMonitor } from '@/features/ai-governance/components/SandboxMonitor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function AIGovernance() {
  const { t } = useTranslation();
  const { isSuperAdmin, hasPermission } = useUserPermissions();
  const queryClient = useQueryClient();

  const summaryQuery = useGovernanceSummary();
  const logsQuery = useRoutingLogs();
  const costQuery = useCostBreakdown();
  const perfQuery = usePerformanceTrend();
  const budgetQuery = useBudgetConfig();
  const penaltiesQuery = usePenalties();

  const summary = summaryQuery.data ?? [];
  const routingLogs = logsQuery.data ?? [];
  const costData = costQuery.data ?? [];
  const perfData = perfQuery.data ?? [];
  const budgetConfig = budgetQuery.data ?? null;
  const penalties = penaltiesQuery.data ?? [];

  const showEngineering = isSuperAdmin || hasPermission('ai_governance.engineering');
  const showFinance = isSuperAdmin || hasPermission('ai_governance.finance');
  const showRisk = isSuperAdmin || hasPermission('ai_governance.risk');
  const showInspector = isSuperAdmin;

  const currentStrategy = (budgetConfig?.routing_strategy as string) ?? 'cost_aware';

  // Check if any critical query has errored
  const queryError = summaryQuery.error || costQuery.error || budgetQuery.error || 
    logsQuery.error || perfQuery.error || penaltiesQuery.error;

  const handleRetryAll = () => {
    queryClient.invalidateQueries({ queryKey: ['ai-governance'] });
  };

  if (queryError) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('aiGovernance.title')}</h1>
          <p className="text-muted-foreground">{t('aiGovernance.subtitle')}</p>
        </div>
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                {t('aiGovernance.loadError', 'Failed to load governance data')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t('aiGovernance.loadErrorDescription', 'The governance dashboard encountered an error while loading data. Please try again.')}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRetryAll}>
              <RefreshCw className="h-4 w-4 me-2" />
              {t('common.tryAgain', 'Try Again')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = summaryQuery.isPending || costQuery.isPending;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('aiGovernance.title')}</h1>
        <p className="text-muted-foreground">{t('aiGovernance.subtitle')}</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">{t('aiGovernance.tabs.overview')}</TabsTrigger>
          {showEngineering && <TabsTrigger value="engineering">{t('aiGovernance.tabs.engineering')}</TabsTrigger>}
          {showFinance && <TabsTrigger value="finance">{t('aiGovernance.tabs.finance')}</TabsTrigger>}
          {showRisk && <TabsTrigger value="risk">{t('aiGovernance.tabs.risk')}</TabsTrigger>}
          {showInspector && <TabsTrigger value="inspector">{t('aiGovernance.tabs.inspector')}</TabsTrigger>}
          {isSuperAdmin && <TabsTrigger value="controls">{t('aiGovernance.tabs.controls')}</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <GovernanceOverview
            summary={summary}
            costData={costData}
            budgetConfig={budgetConfig}
            isLoading={isLoading}
          />
        </TabsContent>

        {showEngineering && (
          <TabsContent value="engineering" className="space-y-6">
            <AutonomousStatus />
            <ThompsonVisualizer summary={summary} isLoading={summaryQuery.isPending} />
            <RoutingBreakdownTable logs={routingLogs} isLoading={logsQuery.isPending} />
            <ExplorationMonitor summary={summary} isLoading={summaryQuery.isPending} />
            <AnomalyTimeline />
            <SandboxMonitor />
          </TabsContent>
        )}

        {showFinance && (
          <TabsContent value="finance" className="space-y-6">
            <FinanceDashboard costData={costData} budgetConfig={budgetConfig} isLoading={costQuery.isPending} />
            {(isSuperAdmin || hasPermission('ai_governance.finance')) && <BudgetControls budgetConfig={budgetConfig} />}
          </TabsContent>
        )}

        {showRisk && (
          <TabsContent value="risk" className="space-y-6">
            <RiskDashboard performanceData={perfData} penalties={penalties} isLoading={perfQuery.isPending} />
            {(isSuperAdmin || hasPermission('ai_governance.risk')) && <PenaltyControls />}
          </TabsContent>
        )}

        {showInspector && (
          <TabsContent value="inspector">
            <RoutingInspector logs={routingLogs} />
          </TabsContent>
        )}

        {isSuperAdmin && (
          <TabsContent value="controls" className="space-y-6">
            <StrategyControls currentStrategy={currentStrategy} />
            <GovernanceAuditLog />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
