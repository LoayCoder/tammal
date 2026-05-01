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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bot, RefreshCw, Scale, ShieldCheck, Sparkles } from 'lucide-react';
import { cardVariants, typography } from "@/theme/tokens";
import { useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/shared/resilience/ErrorBoundary';

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
  const governedPolicies = summary.length;
  const modelCount = new Set(summary.map((item) => `${item.provider ?? 'unknown'}:${item.model ?? 'unknown'}`)).size;
  const highRiskCount = summary.filter((item) => {
    const riskLevel = item.sla_risk_level?.toLowerCase() ?? 'low';
    return riskLevel === 'high' || Number(item.performance_drift_score ?? 0) > 0.2 || Number(item.usage_percentage ?? 0) > 90;
  }).length;
  const providerMix = new Set(summary.map((item) => item.provider).filter(Boolean)).size;
  const decisionStates = [
    {
      label: t('aiGovernance.strategy'),
      value: currentStrategy.split('_').join(' '),
      tone: 'border-[rgba(139,92,246,0.24)] bg-[rgba(139,92,246,0.12)] text-[var(--text-primary)]',
      detail: t('aiGovernance.tabs.controls'),
    },
    {
      label: t('aiGovernance.slaRisk'),
      value: highRiskCount > 0 ? t('common.attention', 'Attention') : t('common.stable', 'Stable'),
      tone: highRiskCount > 0
        ? 'border-[rgba(248,113,113,0.24)] bg-[rgba(248,113,113,0.12)] text-[var(--text-primary)]'
        : 'border-[rgba(52,211,153,0.24)] bg-[rgba(52,211,153,0.12)] text-[var(--text-primary)]',
      detail: `${highRiskCount} ${t('aiGovernance.tabs.risk').toLowerCase()} ${t('common.items', 'items')}`,
    },
    {
      label: t('aiGovernance.projectedCost'),
      value: providerMix > 1 ? t('common.diversified', 'Diversified') : t('common.focused', 'Focused'),
      tone: 'border-[rgba(20,184,166,0.24)] bg-[rgba(20,184,166,0.1)] text-[var(--text-primary)]',
      detail: `${providerMix} ${t('common.providers', 'providers')}`,
    },
  ];
  const governanceMatrix = [
    {
      title: t('aiGovernance.tabs.overview'),
      description: t('aiGovernance.subtitle'),
      value: governedPolicies,
      accent: 'bg-[rgba(139,92,246,0.14)] text-[#C4B5FD]',
      icon: Scale,
    },
    {
      title: t('aiGovernance.tabs.engineering'),
      description: t('aiGovernance.tabs.inspector'),
      value: modelCount,
      accent: 'bg-[rgba(20,184,166,0.14)] text-[var(--brand-primary)]',
      icon: Bot,
    },
    {
      title: t('aiGovernance.tabs.risk'),
      description: t('aiGovernance.tabs.finance'),
      value: highRiskCount,
      accent: 'bg-[rgba(248,113,113,0.14)] text-[#FCA5A5]',
      icon: AlertTriangle,
    },
  ];

  // Check if any critical query has errored
  const queryError = summaryQuery.error || costQuery.error || budgetQuery.error || 
    logsQuery.error || perfQuery.error || penaltiesQuery.error;

  const handleRetryAll = () => {
    queryClient.invalidateQueries({ queryKey: ['ai-governance'] });
  };

  if (queryError) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-[28px] border border-[rgba(139,92,246,0.2)] bg-[linear-gradient(135deg,rgba(139,92,246,0.16),rgba(17,24,39,0.92))] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="outline" className="rounded-full border-[rgba(139,92,246,0.32)] bg-[rgba(139,92,246,0.12)] text-[#DDD6FE]">
                <Sparkles className="me-1 h-3.5 w-3.5" />
                {t('aiGovernance.title')}
              </Badge>
              <div>
                <h1 className={typography.pageTitle}>{t('aiGovernance.title')}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{t('aiGovernance.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
        <Card className="border-[rgba(248,113,113,0.3)] bg-[var(--bg-surface-elevated)]">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(248,113,113,0.12)]">
              <AlertTriangle className="h-6 w-6 text-[#FCA5A5]" />
            </div>
            <div className="space-y-1">
              <h3 className={typography.sectionTitle}>
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
      <section className="relative overflow-hidden rounded-[28px] border border-[rgba(139,92,246,0.22)] bg-[linear-gradient(135deg,rgba(139,92,246,0.18),rgba(17,24,39,0.96)_38%,rgba(23,32,51,0.96))] p-6 shadow-[var(--shadow-sm)]">
        <div className="absolute inset-y-0 end-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_60%)] lg:block" />
        <div className="relative grid gap-5 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full border-[rgba(139,92,246,0.32)] bg-[rgba(139,92,246,0.12)] text-[#DDD6FE]">
                <ShieldCheck className="me-1 h-3.5 w-3.5" />
                {t('aiGovernance.title')}
              </Badge>
              <Badge variant="outline" className="rounded-full border-[rgba(248,113,113,0.24)] bg-[rgba(248,113,113,0.08)] text-[var(--text-secondary)]">
                {highRiskCount} {t('aiGovernance.tabs.risk').toLowerCase()} {t('common.items', 'items')}
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <h1 className={typography.pageTitle}>{t('aiGovernance.title')}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                  {t('aiGovernance.subtitle')} {t('common.monitoring', 'Monitoring')} {t('aiGovernance.tabs.engineering').toLowerCase()}, {t('aiGovernance.tabs.finance').toLowerCase()}, and {t('aiGovernance.tabs.risk').toLowerCase()} in one executive view.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className={cardVariants.surface + " border-[rgba(139,92,246,0.24)] bg-[rgba(17,24,39,0.68)] p-4"}>
                  <p className={typography.statLabel}>Policies</p>
                  <p className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">{governedPolicies}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Governed features and policy scopes.</p>
                </div>
                <div className={cardVariants.surface + " border-[rgba(139,92,246,0.24)] bg-[rgba(17,24,39,0.68)] p-4"}>
                  <p className={typography.statLabel}>Models in use</p>
                  <p className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">{modelCount}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Provider and model combinations under governance.</p>
                </div>
                <div className={cardVariants.surface + " border-[rgba(139,92,246,0.24)] bg-[rgba(17,24,39,0.68)] p-4"}>
                  <p className={typography.statLabel}>Risk alerts</p>
                  <p className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">{highRiskCount}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Items requiring active compliance attention.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {decisionStates.map((state) => (
              <div key={state.label} className="rounded-2xl border border-[rgba(139,92,246,0.18)] bg-[rgba(12,18,33,0.72)] p-4 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={typography.statLabel}>{state.label}</p>
                    <p className="mt-2 text-base font-semibold capitalize text-[var(--text-primary)]">{state.value}</p>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">{state.detail}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${state.tone}`}>
                    Decision state
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(139,92,246,0.14)] text-[#C4B5FD]">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className={typography.cardTitle}>Governance posture</h2>
              <p className="text-sm text-[var(--text-secondary)]">Structured oversight across policy, routing, and operational risk.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {governanceMatrix.map((item) => (
              <div key={item.title} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-4">
                <div className="flex items-center justify-between">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.accent}`}>
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="text-2xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">{item.value}</span>
                </div>
                <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[rgba(139,92,246,0.18)] bg-[rgba(23,32,51,0.82)] p-5 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(139,92,246,0.14)] text-[#C4B5FD]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className={typography.cardTitle}>Governance matrix</h2>
              <p className="text-sm text-[var(--text-secondary)]">Enterprise-grade guidance with a measured AI accent.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {summary.slice(0, 4).map((item) => (
              <div key={`${item.feature}-${item.model}`} className="rounded-2xl border border-[rgba(139,92,246,0.18)] bg-[rgba(11,16,32,0.55)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.feature}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.provider ?? 'Unknown provider'} · {item.model ?? 'Unknown model'}</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-[rgba(139,92,246,0.24)] bg-[rgba(139,92,246,0.12)] text-[#DDD6FE]">
                    {item.sla_risk_level ?? 'low'}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--text-secondary)]">
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[rgba(17,24,39,0.78)] p-2">
                    <p className={typography.statLabel}>Scope</p>
                    <p className="mt-1 text-[var(--text-primary)]">{item.scope ?? 'Core'}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[rgba(17,24,39,0.78)] p-2">
                    <p className={typography.statLabel}>Calls 24h</p>
                    <p className="mt-1 text-[var(--text-primary)]">{Number(item.calls_last_24h ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[rgba(17,24,39,0.78)] p-2">
                    <p className={typography.statLabel}>Drift</p>
                    <p className="mt-1 text-[var(--text-primary)]">{((Number(item.performance_drift_score ?? 0) || 0) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div>
        <h2 className={typography.sectionTitle}>Control surfaces</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Review policy, finance, engineering telemetry, and risk decisions from one structured workspace.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-2xl border border-[rgba(139,92,246,0.16)] bg-[rgba(17,24,39,0.92)] p-2">
          <TabsTrigger className="rounded-xl border border-transparent px-4 data-[state=active]:border-[rgba(139,92,246,0.22)] data-[state=active]:bg-[rgba(139,92,246,0.12)] data-[state=active]:text-[#E9D5FF] data-[state=active]:shadow-none" value="overview">{t('aiGovernance.tabs.overview')}</TabsTrigger>
          {showEngineering && <TabsTrigger className="rounded-xl border border-transparent px-4 data-[state=active]:border-[rgba(139,92,246,0.22)] data-[state=active]:bg-[rgba(139,92,246,0.12)] data-[state=active]:text-[#E9D5FF] data-[state=active]:shadow-none" value="engineering">{t('aiGovernance.tabs.engineering')}</TabsTrigger>}
          {showFinance && <TabsTrigger className="rounded-xl border border-transparent px-4 data-[state=active]:border-[rgba(139,92,246,0.22)] data-[state=active]:bg-[rgba(139,92,246,0.12)] data-[state=active]:text-[#E9D5FF] data-[state=active]:shadow-none" value="finance">{t('aiGovernance.tabs.finance')}</TabsTrigger>}
          {showRisk && <TabsTrigger className="rounded-xl border border-transparent px-4 data-[state=active]:border-[rgba(139,92,246,0.22)] data-[state=active]:bg-[rgba(139,92,246,0.12)] data-[state=active]:text-[#E9D5FF] data-[state=active]:shadow-none" value="risk">{t('aiGovernance.tabs.risk')}</TabsTrigger>}
          {showInspector && <TabsTrigger className="rounded-xl border border-transparent px-4 data-[state=active]:border-[rgba(139,92,246,0.22)] data-[state=active]:bg-[rgba(139,92,246,0.12)] data-[state=active]:text-[#E9D5FF] data-[state=active]:shadow-none" value="inspector">{t('aiGovernance.tabs.inspector')}</TabsTrigger>}
          {isSuperAdmin && <TabsTrigger className="rounded-xl border border-transparent px-4 data-[state=active]:border-[rgba(139,92,246,0.22)] data-[state=active]:bg-[rgba(139,92,246,0.12)] data-[state=active]:text-[#E9D5FF] data-[state=active]:shadow-none" value="controls">{t('aiGovernance.tabs.controls')}</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}>
            <GovernanceOverview
              summary={summary}
              costData={costData}
              budgetConfig={budgetConfig}
              isLoading={isLoading}
            />
          </ErrorBoundary>
        </TabsContent>

        {showEngineering && (
          <TabsContent value="engineering" className="space-y-6">
            <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}><AutonomousStatus /></ErrorBoundary>
            <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}><ThompsonVisualizer summary={summary} isLoading={summaryQuery.isPending} /></ErrorBoundary>
            <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}><RoutingBreakdownTable logs={routingLogs} isLoading={logsQuery.isPending} /></ErrorBoundary>
            <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}><ExplorationMonitor summary={summary} isLoading={summaryQuery.isPending} /></ErrorBoundary>
            <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}><AnomalyTimeline /></ErrorBoundary>
            <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}><SandboxMonitor /></ErrorBoundary>
          </TabsContent>
        )}

        {showFinance && (
          <TabsContent value="finance" className="space-y-6">
            <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}><FinanceDashboard costData={costData} budgetConfig={budgetConfig} isLoading={costQuery.isPending} /></ErrorBoundary>
            {(isSuperAdmin || hasPermission('ai_governance.finance')) && <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}><BudgetControls budgetConfig={budgetConfig} /></ErrorBoundary>}
          </TabsContent>
        )}

        {showRisk && (
          <TabsContent value="risk" className="space-y-6">
            <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}><RiskDashboard performanceData={perfData} penalties={penalties} isLoading={perfQuery.isPending} /></ErrorBoundary>
            {(isSuperAdmin || hasPermission('ai_governance.risk')) && <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}><PenaltyControls /></ErrorBoundary>}
          </TabsContent>
        )}

        {showInspector && (
          <TabsContent value="inspector">
            <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}><RoutingInspector logs={routingLogs} /></ErrorBoundary>
          </TabsContent>
        )}

        {isSuperAdmin && (
          <TabsContent value="controls" className="space-y-6">
            <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}><StrategyControls currentStrategy={currentStrategy} /></ErrorBoundary>
            <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}><GovernanceAuditLog /></ErrorBoundary>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
