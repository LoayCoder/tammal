import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSystemHealth } from '@/hooks/workload/useSystemHealth';
import { type HealthCheckKey } from '@/services/governance-health.service';
import { RefreshCw, ShieldCheck, AlertTriangle, XCircle, Activity } from 'lucide-react';

const HEALTH_CHECKS: { key: HealthCheckKey; icon: typeof ShieldCheck }[] = [
  { key: 'queueSync', icon: Activity },
  { key: 'slaMonitor', icon: ShieldCheck },
  { key: 'escalation', icon: AlertTriangle },
  { key: 'auditLogs', icon: ShieldCheck },
  { key: 'tenantIsolation', icon: ShieldCheck },
  { key: 'capacity', icon: Activity },
];

function StatusBadgeCell({ status }: { status: 'ok' | 'warning' | 'error' }) {
  if (status === 'ok') return <Badge variant="default" className="bg-chart-2 text-primary-foreground">OK</Badge>;
  if (status === 'warning') return <Badge variant="secondary" className="bg-chart-4 text-primary-foreground">Warning</Badge>;
  return <Badge variant="destructive">Error</Badge>;
}

function StatusIcon({ status }: { status: 'ok' | 'warning' | 'error' }) {
  if (status === 'ok') return <ShieldCheck className="h-4 w-4 text-chart-2" />;
  if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-chart-4" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
}

export default function SystemHealth() {
  const { t } = useTranslation();
  const { checks, isPending, runHealthCheck } = useSystemHealth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('systemHealth.title')}</h1>
          <p className="text-muted-foreground">{t('systemHealth.description')}</p>
        </div>
        <Button
          onClick={() => runHealthCheck.mutate()}
          disabled={runHealthCheck.isPending}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 me-2 ${runHealthCheck.isPending ? 'animate-spin' : ''}`} />
          {t('systemHealth.runCheck')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {t('systemHealth.governanceStatus')}
          </CardTitle>
          <CardDescription>{t('systemHealth.governanceDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('systemHealth.subsystem')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('systemHealth.details')}</TableHead>
                  <TableHead>{t('systemHealth.lastChecked')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {HEALTH_CHECKS.map(({ key, icon: Icon }) => {
                  const check = checks?.[key];
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {t(`systemHealth.checks.${key}`)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {check ? (
                          <div className="flex items-center gap-2">
                            <StatusIcon status={check.status} />
                            <StatusBadgeCell status={check.status} />
                          </div>
                        ) : (
                          <Badge variant="outline">—</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {check?.message ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {check ? new Date(check.lastChecked).toLocaleTimeString() : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
