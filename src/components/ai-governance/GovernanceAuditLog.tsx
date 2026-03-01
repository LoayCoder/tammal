import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { useGovernanceAuditLog } from '@/hooks/ai-governance/useGovernanceActions';

export function GovernanceAuditLog() {
  const { t } = useTranslation();
  const { data: logs = [], isPending } = useGovernanceAuditLog();

  if (isPending) {
    return <Card><CardContent className="pt-6"><Skeleton className="h-[200px] w-full" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t('aiGovernance.auditLog')}</CardTitle></CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground">{t('common.noData')}</p>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start py-2 pe-4 font-medium text-muted-foreground">{t('common.actions')}</th>
                  <th className="text-start py-2 pe-4 font-medium text-muted-foreground">Target</th>
                  <th className="text-start py-2 pe-4 font-medium text-muted-foreground">User</th>
                  <th className="text-start py-2 font-medium text-muted-foreground">{t('aiGovernance.time')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b border-border/50">
                    <td className="py-2 pe-4 font-medium">{log.action}</td>
                    <td className="py-2 pe-4 text-xs font-mono">{log.target_entity ?? '-'}</td>
                    <td className="py-2 pe-4 text-xs font-mono">{log.user_id?.slice(0, 8)}…</td>
                    <td className="py-2 text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
