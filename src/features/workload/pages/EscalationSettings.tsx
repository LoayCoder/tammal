import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { AlertTriangle, Clock, ArrowUp, Shield } from 'lucide-react';

const ESCALATION_LEVELS = [
  { level: 1, daysOverdue: 3, target: 'manager', icon: Clock, variant: 'default' as const },
  { level: 2, daysOverdue: 7, target: 'departmentHead', icon: ArrowUp, variant: 'secondary' as const },
  { level: 3, daysOverdue: 14, target: 'executive', icon: AlertTriangle, variant: 'destructive' as const },
];

export default function EscalationSettings() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('governance.settings.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('governance.settings.subtitle')}</p>
      </div>

      {/* Escalation Rules */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('governance.settings.escalationRules')}
          </CardTitle>
          <CardDescription>{t('governance.settings.escalationRulesDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ESCALATION_LEVELS.map((rule, idx) => {
            const Icon = rule.icon;
            return (
              <div key={rule.level}>
                {idx > 0 && <Separator className="mb-4" />}
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {t('governance.escalation.level')} {rule.level}
                      </span>
                      <Badge variant={rule.variant} className="text-xs">
                        {rule.daysOverdue} {t('governance.settings.daysOverdue')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t(`governance.settings.target.${rule.target}`)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* SLA Configuration */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('governance.settings.slaConfig')}
          </CardTitle>
          <CardDescription>{t('governance.settings.slaConfigDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-muted/30 p-4 space-y-1">
              <Badge variant="default" className="text-xs">{t('governance.sla.within_sla')}</Badge>
              <p className="text-xs text-muted-foreground mt-2">{t('governance.settings.slaWithinDesc')}</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-4 space-y-1">
              <Badge variant="secondary" className="text-xs">{t('governance.sla.approaching')}</Badge>
              <p className="text-xs text-muted-foreground mt-2">{t('governance.settings.slaApproachingDesc')}</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-4 space-y-1">
              <Badge variant="destructive" className="text-xs">{t('governance.sla.breached')}</Badge>
              <p className="text-xs text-muted-foreground mt-2">{t('governance.settings.slaBreachedDesc')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Governance Policies */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-base">{t('governance.settings.policies')}</CardTitle>
          <CardDescription>{t('governance.settings.policiesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <p>{t('governance.settings.policyJustification')}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <p>{t('governance.settings.policyEvidence')}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <p>{t('governance.settings.policyAudit')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
