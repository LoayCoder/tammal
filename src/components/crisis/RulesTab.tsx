import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle } from 'lucide-react';

export default function RulesTab() {
  const { t } = useTranslation();

  const riskMapping = [
    { intent: 'self_harm', risk: 'high', color: 'destructive' as const },
    { intent: 'unsafe', risk: 'high', color: 'destructive' as const },
    { intent: 'overwhelmed', risk: 'moderate', color: 'secondary' as const },
    { intent: 'anxiety', risk: 'moderate', color: 'secondary' as const },
    { intent: 'work_stress', risk: 'moderate', color: 'secondary' as const },
    { intent: 'other', risk: 'moderate', color: 'secondary' as const },
    { intent: 'talk', risk: 'low', color: 'default' as const },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('crisisSupport.admin.riskMapping')}</CardTitle>
        <CardDescription>{t('crisisSupport.admin.riskMappingDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('crisisSupport.admin.intent')}</TableHead>
              <TableHead>{t('crisisSupport.admin.riskLevel')}</TableHead>
              <TableHead>{t('crisisSupport.admin.action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {riskMapping.map(r => (
              <TableRow key={r.intent}>
                <TableCell className="font-medium capitalize">{t(`crisisSupport.intents.${r.intent}`)}</TableCell>
                <TableCell>
                  <Badge variant={r.color}>{r.risk.toUpperCase()}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.risk === 'high'
                    ? t('crisisSupport.admin.highRiskAction')
                    : t('crisisSupport.admin.normalAction')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="font-semibold text-destructive">{t('crisisSupport.admin.highRiskNote')}</span>
          </div>
          <p className="text-sm text-muted-foreground">{t('crisisSupport.admin.highRiskNoteDesc')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
