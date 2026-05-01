import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, History, RefreshCw, Download, AlertTriangle, ShieldAlert, Activity } from 'lucide-react';
import { PageHeader } from '@/components/system';
import { useAuditLog, AuditLog } from '@/hooks/audit/useAuditLog';
import { useTenants } from '@/hooks/org/useTenants';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cardVariants, layout, typography } from "@/theme/tokens";
import { ErrorBoundary } from '@/shared/resilience/ErrorBoundary';

export default function AuditLogs() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('30d');

  const { tenants } = useTenants();
  const { logs, isPending: isLoading } = useAuditLog({ 
    tenantId: selectedTenant === 'all' ? undefined : selectedTenant,
    limit: 200 
  });

  const getRiskLevel = (log: AuditLog) => {
    if (log.action === 'delete') return 'critical';
    if (log.action === 'status_change' || log.action === 'module_toggle') return 'high';
    if (log.action === 'update') return 'medium';
    return 'low';
  };

  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'all' && log.action !== actionFilter) {
      return false;
    }
    if (entityFilter !== 'all' && log.entity_type !== entityFilter) {
      return false;
    }
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const changes = JSON.stringify(log.changes || {}).toLowerCase();
      const matches = (
        (log.user_id || '').toLowerCase().includes(searchLower) ||
        log.entity_type.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        changes.includes(searchLower)
      );
      if (!matches) {
        return false;
      }
    }
    if (riskFilter !== 'all' && getRiskLevel(log) !== riskFilter) {
      return false;
    }
    if (dateFilter !== 'all') {
      const createdAt = new Date(log.created_at).getTime();
      const now = Date.now();
      const windowMs = dateFilter === '24h' ? 24 * 60 * 60 * 1000 : dateFilter === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
      if (createdAt < now - windowMs) {
        return false;
      }
    }
    return true;
  });

  const summaryCards = [
    { label: 'Total events', value: filteredLogs.length, icon: Activity, tone: 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]' },
    { label: 'Critical events', value: filteredLogs.filter((log) => getRiskLevel(log) === 'critical').length, icon: AlertTriangle, tone: 'bg-[var(--chart-5)]/10 text-[var(--chart-5)]' },
    { label: 'High risk', value: filteredLogs.filter((log) => getRiskLevel(log) === 'high').length, icon: ShieldAlert, tone: 'bg-[var(--chart-4)]/10 text-[var(--chart-4)]' },
  ];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error(t('audit.noDataToExport'));
      return;
    }

    const headers = [
      t('csv.headers.date'),
      t('csv.headers.entityType'),
      t('csv.headers.entityId'),
      t('csv.headers.action'),
      t('csv.headers.changes'),
      t('csv.headers.userId'),
      t('csv.headers.tenantId')
    ];
    const rows = filteredLogs.map((log: AuditLog) => [
      new Date(log.created_at).toLocaleString(),
      log.entity_type,
      log.entity_id,
      log.action,
      JSON.stringify(log.changes || {}),
      log.user_id || '',
      log.tenant_id || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(t('audit.exportSuccess'));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<History className="h-5 w-5 text-primary" />}
        title={t('audit.title')}
        subtitle={t('audit.subtitle')}
        variant="card"
      />

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.label} className={cardVariants.elevated}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className={typography.statLabel}>{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{card.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.tone}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}>
      <Card className={cardVariants.elevated}>
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t('audit.filters')}
              </CardTitle>
              <CardDescription>{t('audit.filterDescription')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)]" onClick={exportToCSV}>
                <Download className="h-4 w-4 me-2" />
                {t('audit.export')}
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)]" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 me-2" />
                {t('audit.refresh')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className={layout.dashboardGrid}>
            <div className="relative xl:col-span-4">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('audit.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)] ps-10"
              />
            </div>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger className="h-11 w-full rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)] xl:col-span-2">
                <SelectValue placeholder={t('audit.selectTenant')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {tenants.map(tenant => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="h-11 w-full rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)] xl:col-span-2">
                <SelectValue placeholder={t('audit.selectEntity')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="tenant">{t('audit.entities.tenant')}</SelectItem>
                <SelectItem value="subscription">{t('audit.entities.subscription')}</SelectItem>
                <SelectItem value="plan">{t('audit.entities.plan')}</SelectItem>
                <SelectItem value="user">{t('audit.entities.user')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-11 w-full rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)] xl:col-span-2">
                <SelectValue placeholder={t('audit.selectAction')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="create">{t('audit.actions.create')}</SelectItem>
                <SelectItem value="update">{t('audit.actions.update')}</SelectItem>
                <SelectItem value="delete">{t('audit.actions.delete')}</SelectItem>
                <SelectItem value="module_toggle">{t('audit.actions.module_toggle')}</SelectItem>
                <SelectItem value="status_change">{t('audit.actions.status_change')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="h-11 w-full rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)] xl:col-span-1">
                <SelectValue placeholder="Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All risk</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-11 w-full rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)] xl:col-span-1">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="7d">7d</SelectItem>
                <SelectItem value="30d">30d</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {['critical', 'high', 'medium', 'low'].map((level) => (
              <Badge key={level} variant="outline" className="rounded-full border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
                {level}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      </ErrorBoundary>

      <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}>
      <Card className={cardVariants.surface}>
        <CardHeader className="p-5 pb-3">
          <CardTitle>{t('audit.logEntries')}</CardTitle>
          <CardDescription>
            {t('audit.showingEntries', { count: filteredLogs.length })}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <AuditLogTable logs={filteredLogs} isLoading={isLoading} />
        </CardContent>
      </Card>
      </ErrorBoundary>
    </div>
  );
}
