import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useFirstAiders, useEmergencyContacts, useCrisisCases, mapIntentToRisk } from '@/hooks/useCrisisSupport';
import { Phone, MessageSquare, Shield, AlertTriangle, ArrowRight, Clock, User, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import CrisisSupport from '@/components/mental-toolkit/resources/CrisisSupport';

const INTENTS = [
  { key: 'talk', icon: MessageSquare, color: 'bg-chart-2/20 text-chart-2' },
  { key: 'work_stress', icon: Clock, color: 'bg-chart-4/20 text-chart-4' },
  { key: 'anxiety', icon: AlertTriangle, color: 'bg-chart-3/20 text-chart-3' },
  { key: 'overwhelmed', icon: Shield, color: 'bg-chart-5/20 text-chart-5' },
  { key: 'unsafe', icon: AlertTriangle, color: 'bg-destructive/20 text-destructive' },
  { key: 'self_harm', icon: Phone, color: 'bg-destructive/20 text-destructive' },
  { key: 'other', icon: MessageSquare, color: 'bg-muted text-muted-foreground' },
];

type Step = 'intent' | 'options' | 'confirm' | 'high_risk';

export default function CrisisRequestPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { employee } = useCurrentEmployee();
  const { firstAiders } = useFirstAiders(employee?.tenant_id);
  const { contacts: emergencyContacts } = useEmergencyContacts(employee?.tenant_id);
  const { createCase } = useCrisisCases();

  const [step, setStep] = useState<Step>('intent');
  const [selectedIntent, setSelectedIntent] = useState('');
  const [anonymityMode, setAnonymityMode] = useState<'named' | 'anonymous'>('named');
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const riskLevel = selectedIntent ? mapIntentToRisk(selectedIntent) : null;

  const handleIntentSelect = (intent: string) => {
    setSelectedIntent(intent);
    const risk = mapIntentToRisk(intent);
    if (risk === 'high') {
      setStep('high_risk');
    } else {
      setStep('options');
    }
  };

  const handleSubmit = async () => {
    if (!employee?.tenant_id || !user?.id) return;
    setSubmitting(true);
    try {
      const result = await createCase.mutateAsync({
        tenant_id: employee.tenant_id,
        intent: selectedIntent,
        anonymity_mode: anonymityMode,
        summary: summary || undefined,
      });
      toast.success(t('crisisSupport.request.submitted'));
      navigate('/my-support');
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const onlineAiders = firstAiders.filter(fa => fa.status === 'online');

  return (
    <div className="min-h-screen bg-background">
      {/* Emergency Banner */}
      <div className="px-4 py-3 flex items-center gap-2 bg-destructive/10 border-b border-destructive/20">
        <span className="text-lg">🚨</span>
        <p className="text-sm font-medium text-destructive">{t('crisisSupport.banner')}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Disclaimer */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{t('crisisSupport.disclaimer.title')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('crisisSupport.disclaimer.body')}</p>
            </div>
          </div>
        </div>

        {/* Step: Intent Selection */}
        {step === 'intent' && (
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg">{t('crisisSupport.request.whatHelp')}</CardTitle>
              <CardDescription>{t('crisisSupport.request.selectIntent')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {INTENTS.map(intent => (
                <button
                  key={intent.key}
                  onClick={() => handleIntentSelect(intent.key)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:bg-muted transition-colors text-start"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${intent.color}`}>
                    <intent.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{t(`crisisSupport.intents.${intent.key}`)}</p>
                    <p className="text-xs text-muted-foreground">{t(`crisisSupport.intentDesc.${intent.key}`)}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground rtl:-scale-x-100" />
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step: High Risk */}
        {step === 'high_risk' && (
          <div className="space-y-4">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  <h2 className="text-lg font-semibold text-destructive">{t('crisisSupport.highRisk.title')}</h2>
                </div>
                <p className="text-sm text-foreground">{t('crisisSupport.highRisk.body')}</p>
                <p className="text-xs text-muted-foreground">{t('crisisSupport.highRisk.notEmergency')}</p>
              </CardContent>
            </Card>

            {/* Emergency contacts */}
            <Card className="glass-card border-0 rounded-xl">
              <CardHeader>
                <CardTitle className="text-base">{t('crisisSupport.highRisk.emergencyNumbers')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {emergencyContacts.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div>
                      <p className="font-medium text-sm">{c.title}</p>
                      {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                    </div>
                    {c.phone && (
                      <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}>
                        <Button size="sm" variant="destructive" className="rounded-xl gap-1.5">
                          <Phone className="h-3 w-3" />
                          {c.phone}
                        </Button>
                      </a>
                    )}
                  </div>
                ))}

                {/* Hardcoded global emergency */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-destructive/30 bg-destructive/5">
                  <div>
                    <p className="font-medium text-sm text-destructive">{t('crisisSupport.highRisk.globalEmergency')}</p>
                  </div>
                  <Badge variant="destructive">911 / 999 / 112</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('intent')} className="flex-1">{t('common.back')}</Button>
              <Button onClick={() => setStep('options')} className="flex-1">{t('crisisSupport.highRisk.stillRequest')}</Button>
            </div>
          </div>
        )}

        {/* Step: Options */}
        {step === 'options' && (
          <div className="space-y-4">
            <Card className="glass-card border-0 rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">{t('crisisSupport.request.options')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Anonymity */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t('crisisSupport.request.anonymous')}</p>
                      <p className="text-xs text-muted-foreground">{t('crisisSupport.request.anonymousNote')}</p>
                    </div>
                  </div>
                  <Switch
                    checked={anonymityMode === 'anonymous'}
                    onCheckedChange={v => setAnonymityMode(v ? 'anonymous' : 'named')}
                  />
                </div>

                {/* Summary */}
                <div>
                  <Label className="text-sm">{t('crisisSupport.request.summary')}</Label>
                  <Textarea
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    placeholder={t('crisisSupport.request.summaryPlaceholder')}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Available First Aiders */}
            <Card className="glass-card border-0 rounded-xl">
              <CardHeader>
                <CardTitle className="text-base">{t('crisisSupport.request.availableAiders')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {firstAiders.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">{t('crisisSupport.request.noAidersConfigured')}</p>
                ) : (
                  firstAiders.slice(0, 5).map(fa => (
                    <div key={fa.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{fa.display_name}</p>
                          {fa.department && <p className="text-xs text-muted-foreground">{fa.department}</p>}
                        </div>
                      </div>
                      <Badge variant={fa.status === 'online' ? 'default' : 'secondary'} className="text-xs">
                        {fa.status === 'online' ? `🟢 ${t('crisisSupport.status.online')}` : `⚫ ${t('crisisSupport.status.offline')}`}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('intent')} className="flex-1">{t('common.back')}</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || firstAiders.length === 0}
                className="flex-1"
              >
                {submitting ? t('common.loading') : t('crisisSupport.request.submitRequest')}
              </Button>
            </div>
          </div>
        )}

        {/* Global Emergency Hotline Directory */}
        {step !== 'high_risk' && (
          <CrisisSupport />
        )}
      </div>
    </div>
  );
}
