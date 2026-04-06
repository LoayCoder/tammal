import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Clock, ArrowUp, Shield, Pencil, Save, X, Loader2 } from 'lucide-react';
import { cardVariants, typography } from "@/theme/tokens";
import {
  useEscalationThresholds,
  useSlaThresholds,
  useUpdateGovernanceConfig,
  type EscalationThreshold,
  type SlaThresholds,
} from '@/features/workload/hooks/useGovernanceConfig';
import { Skeleton } from '@/components/ui/skeleton';

const LEVEL_ICONS = [Clock, ArrowUp, AlertTriangle];
const LEVEL_VARIANTS: Array<'default' | 'secondary' | 'destructive'> = ['default', 'secondary', 'destructive'];

export default function EscalationSettings() {
  const { t } = useTranslation();
  const { data: thresholds, isLoading: loadingThresholds } = useEscalationThresholds();
  const { data: slaConfig, isLoading: loadingSla } = useSlaThresholds();
  const updateConfig = useUpdateGovernanceConfig();

  const [editingEscalation, setEditingEscalation] = useState(false);
  const [editingSla, setEditingSla] = useState(false);
  const [draftThresholds, setDraftThresholds] = useState<EscalationThreshold[]>([]);
  const [draftSla, setDraftSla] = useState<SlaThresholds>({ approaching_percent: 80, breach_percent: 100 });

  const startEditEscalation = () => {
    setDraftThresholds(thresholds ? [...thresholds] : []);
    setEditingEscalation(true);
  };

  const startEditSla = () => {
    setDraftSla(slaConfig ? { ...slaConfig } : { approaching_percent: 80, breach_percent: 100 });
    setEditingSla(true);
  };

  const saveEscalation = () => {
    updateConfig.mutate(
      { configKey: 'escalation_thresholds', configValue: draftThresholds },
      { onSuccess: () => setEditingEscalation(false) }
    );
  };

  const saveSla = () => {
    updateConfig.mutate(
      { configKey: 'sla_thresholds', configValue: draftSla },
      { onSuccess: () => setEditingSla(false) }
    );
  };

  const updateThresholdField = (idx: number, field: 'daysOverdue' | 'target', value: string | number) => {
    setDraftThresholds(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const isLoading = loadingThresholds || loadingSla;

  return (
    <div className="space-y-6">
      <div>
        <h1 className={typography.pageTitle}>{t('governance.settings.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('governance.settings.subtitle')}</p>
      </div>

      {/* Escalation Rules */}
      <Card className={cardVariants.glass}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('governance.settings.escalationRules')}
            </CardTitle>
            {!editingEscalation && !isLoading && (
              <Button variant="ghost" size="sm" onClick={startEditEscalation}>
                <Pencil className="h-3.5 w-3.5 me-1" />
                {t('common.edit', 'Edit')}
              </Button>
            )}
          </div>
          <CardDescription>{t('governance.settings.escalationRulesDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : editingEscalation ? (
            <>
              {draftThresholds.map((rule, idx) => {
                const Icon = LEVEL_ICONS[idx] ?? Clock;
                return (
                  <div key={rule.level}>
                    {idx > 0 && <Separator className="mb-4" />}
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">{t('governance.escalation.level')} {rule.level}</Label>
                        </div>
                        <div>
                          <Label className="text-xs">{t('governance.settings.daysOverdue')}</Label>
                          <Input
                            type="number"
                            min={1}
                            value={rule.daysOverdue}
                            onChange={e => updateThresholdField(idx, 'daysOverdue', parseInt(e.target.value) || 1)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t('governance.settings.target.label', 'Target')}</Label>
                          <Input
                            value={rule.target}
                            onChange={e => updateThresholdField(idx, 'target', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingEscalation(false)}>
                  <X className="h-3.5 w-3.5 me-1" /> {t('common.cancel', 'Cancel')}
                </Button>
                <Button size="sm" onClick={saveEscalation} disabled={updateConfig.isPending}>
                  {updateConfig.isPending ? <Loader2 className="h-3.5 w-3.5 me-1 animate-spin" /> : <Save className="h-3.5 w-3.5 me-1" />}
                  {t('common.save', 'Save')}
                </Button>
              </div>
            </>
          ) : (
            (thresholds ?? []).map((rule, idx) => {
              const Icon = LEVEL_ICONS[idx] ?? Clock;
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
                        <Badge variant={LEVEL_VARIANTS[idx] ?? 'default'} className="text-xs">
                          {rule.daysOverdue} {t('governance.settings.daysOverdue')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t(`governance.settings.target.${rule.target}`, rule.target)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* SLA Configuration */}
      <Card className={cardVariants.glass}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('governance.settings.slaConfig')}
            </CardTitle>
            {!editingSla && !isLoading && (
              <Button variant="ghost" size="sm" onClick={startEditSla}>
                <Pencil className="h-3.5 w-3.5 me-1" />
                {t('common.edit', 'Edit')}
              </Button>
            )}
          </div>
          <CardDescription>{t('governance.settings.slaConfigDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : editingSla ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs">{t('governance.sla.approaching', 'Approaching')} (%)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={draftSla.approaching_percent}
                    onChange={e => setDraftSla(prev => ({ ...prev, approaching_percent: parseInt(e.target.value) || 80 }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t('governance.sla.breached', 'Breached')} (%)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={draftSla.breach_percent}
                    onChange={e => setDraftSla(prev => ({ ...prev, breach_percent: parseInt(e.target.value) || 100 }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingSla(false)}>
                  <X className="h-3.5 w-3.5 me-1" /> {t('common.cancel', 'Cancel')}
                </Button>
                <Button size="sm" onClick={saveSla} disabled={updateConfig.isPending}>
                  {updateConfig.isPending ? <Loader2 className="h-3.5 w-3.5 me-1 animate-spin" /> : <Save className="h-3.5 w-3.5 me-1" />}
                  {t('common.save', 'Save')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-muted/30 p-4 space-y-1">
                <Badge variant="default" className="text-xs">{t('governance.sla.within_sla')}</Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {'< '}{slaConfig?.approaching_percent ?? 80}% {t('governance.settings.slaWithinDesc', 'of SLA duration used')}
                </p>
              </div>
              <div className="rounded-xl bg-muted/30 p-4 space-y-1">
                <Badge variant="secondary" className="text-xs">{t('governance.sla.approaching')}</Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {'>= '}{slaConfig?.approaching_percent ?? 80}% {t('governance.settings.slaApproachingDesc', 'of SLA duration used')}
                </p>
              </div>
              <div className="rounded-xl bg-muted/30 p-4 space-y-1">
                <Badge variant="destructive" className="text-xs">{t('governance.sla.breached')}</Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {'>= '}{slaConfig?.breach_percent ?? 100}% {t('governance.settings.slaBreachedDesc', 'of SLA duration used')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Governance Policies */}
      <Card className={cardVariants.glass}>
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
