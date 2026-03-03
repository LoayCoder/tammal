import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserPermissions } from '@/hooks/auth/useUserPermissions';
import { useGovernanceSummary } from '@/hooks/ai-governance/useGovernanceSummary';
import { useRoutingLogs } from '@/hooks/ai-governance/useRoutingLogs';
import { useCostBreakdown } from '@/hooks/ai-governance/useCostBreakdown';
import { usePerformanceTrend } from '@/hooks/ai-governance/usePerformanceTrend';
import { useBudgetConfig, usePenalties } from '@/hooks/ai-governance/useGovernanceActions';
import { GovernanceOverview } from '@/components/ai-governance/GovernanceOverview';
import { ThompsonVisualizer } from '@/components/ai-governance/ThompsonVisualizer';
import { RoutingBreakdownTable } from '@/components/ai-governance/RoutingBreakdownTable';
import { ExplorationMonitor } from '@/components/ai-governance/ExplorationMonitor';
import { FinanceDashboard } from '@/components/ai-governance/FinanceDashboard';
import { BudgetControls } from '@/components/ai-governance/BudgetControls';
import { RiskDashboard } from '@/components/ai-governance/RiskDashboard';
import { PenaltyControls } from '@/components/ai-governance/PenaltyControls';
import { RoutingInspector } from '@/components/ai-governance/RoutingInspector';
import { StrategyControls } from '@/components/ai-governance/StrategyControls';
import { GovernanceAuditLog } from '@/components/ai-governance/GovernanceAuditLog';
import { AutonomousStatus } from '@/components/ai-governance/AutonomousStatus';
import { AnomalyTimeline } from '@/components/ai-governance/AnomalyTimeline';
import { SandboxMonitor } from '@/components/ai-governance/SandboxMonitor';
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
