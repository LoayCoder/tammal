import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, History, RefreshCw, Download } from 'lucide-react';
import { useAuditLog, AuditLog } from '@/hooks/useAuditLog';
import { useTenants } from '@/hooks/useTenants';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function AuditLogs() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { tenants } = useTenants();
  const { logs, isLoading } = useAuditLog({ 
    tenantId: selectedTenant === 'all' ? undefined : selectedTenant,
    limit: 200 
  });

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
      return (
        log.entity_type.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        changes.includes(searchLower)
      );
    }
    return true;
  });

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <History className="h-8 w-8" />
          {t('audit.title')}
        </h1>
        <p className="text-muted-foreground">{t('audit.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t('audit.filters')}
              </CardTitle>
              <CardDescription>{t('audit.filterDescription')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 me-2" />
                {t('audit.export')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 me-2" />
                {t('audit.refresh')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('audit.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger className="w-full md:w-[200px]">
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
              <SelectTrigger className="w-full md:w-[160px]">
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
              <SelectTrigger className="w-full md:w-[180px]">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('audit.logEntries')}</CardTitle>
          <CardDescription>
            {t('audit.showingEntries', { count: filteredLogs.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={filteredLogs} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
