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

export default function AIGovernance() {
  const { t } = useTranslation();
  const { isSuperAdmin, hasPermission } = useUserPermissions();

  const { data: summary = [], isPending: summaryLoading } = useGovernanceSummary();
  const { data: routingLogs = [], isPending: logsLoading } = useRoutingLogs();
  const { data: costData = [], isPending: costLoading } = useCostBreakdown();
  const { data: perfData = [], isPending: perfLoading } = usePerformanceTrend();
  const { data: budgetConfig = null } = useBudgetConfig();
  const { data: penalties = [] } = usePenalties();

  const showEngineering = isSuperAdmin || hasPermission('ai_governance.engineering');
  const showFinance = isSuperAdmin || hasPermission('ai_governance.finance');
  const showRisk = isSuperAdmin || hasPermission('ai_governance.risk');
  const showInspector = isSuperAdmin;

  const currentStrategy = (budgetConfig?.routing_strategy as string) ?? 'cost_aware';

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
            isLoading={summaryLoading || costLoading}
          />
        </TabsContent>

        {showEngineering && (
          <TabsContent value="engineering" className="space-y-6">
            <ThompsonVisualizer summary={summary} isLoading={summaryLoading} />
            <RoutingBreakdownTable logs={routingLogs} isLoading={logsLoading} />
            <ExplorationMonitor summary={summary} isLoading={summaryLoading} />
          </TabsContent>
        )}

        {showFinance && (
          <TabsContent value="finance" className="space-y-6">
            <FinanceDashboard costData={costData} budgetConfig={budgetConfig} isLoading={costLoading} />
            {(isSuperAdmin || hasPermission('ai_governance.finance')) && <BudgetControls budgetConfig={budgetConfig} />}
          </TabsContent>
        )}

        {showRisk && (
          <TabsContent value="risk" className="space-y-6">
            <RiskDashboard performanceData={perfData} penalties={penalties} isLoading={perfLoading} />
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
