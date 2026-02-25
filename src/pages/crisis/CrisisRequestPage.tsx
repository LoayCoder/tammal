import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useFirstAiders, useEmergencyContacts, useCrisisCases, mapIntentToRisk } from '@/hooks/useCrisisSupport';
import { useSmartMatching, MatchResult } from '@/hooks/crisis/useSmartMatching';
import { Phone, MessageSquare, Shield, AlertTriangle, ArrowRight, Clock, User, EyeOff, Star, Languages, Video, Loader2 } from 'lucide-react';
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

const URGENCY_COLORS = [
  'bg-chart-2/20 text-chart-2',
  'bg-chart-4/20 text-chart-4',
  'bg-chart-3/20 text-chart-3',
  'bg-chart-5/20 text-chart-5',
  'bg-destructive/20 text-destructive',
];

type Step = 'intent' | 'options' | 'confirm' | 'high_risk' | 'matching';

export default function CrisisRequestPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { employee } = useCurrentEmployee();
  const { firstAiders } = useFirstAiders(employee?.tenant_id);
  const { contacts: emergencyContacts } = useEmergencyContacts(employee?.tenant_id);
  const { createCase } = useCrisisCases();
  const { matches, matchFirstAider, isMatching, clearMatches } = useSmartMatching();

  const [step, setStep] = useState<Step>('intent');
  const [selectedIntent, setSelectedIntent] = useState('');
  const [anonymityMode, setAnonymityMode] = useState<'named' | 'anonymous'>('named');
  const [summary, setSummary] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState(3);
  const [preferredContact, setPreferredContact] = useState('chat');
  const [preferredLanguage, setPreferredLanguage] = useState(i18n.language === 'ar' ? 'ar' : 'en');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
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

  const handleFindMatch = async () => {
    if (!employee?.tenant_id || !user?.id) return;
    setSubmitting(true);
    try {
      // Create the case first
      const result = await createCase.mutateAsync({
        tenant_id: employee.tenant_id,
        intent: selectedIntent,
        anonymity_mode: anonymityMode,
        summary: summary || undefined,
        urgency_level: urgencyLevel,
        preferred_contact_method: preferredContact,
      });

      // Now run smart matching
      setStep('matching');
      await matchFirstAider({
        case_id: result.id,
        tenant_id: employee.tenant_id,
        preferred_language: preferredLanguage,
        use_ai: !!summary,
      });
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmMatch = async () => {
    toast.success(t('crisisSupport.request.submitted'));
    navigate('/my-support');
  };

  const handleSubmitWithoutMatch = async () => {
    if (!employee?.tenant_id || !user?.id) return;
    setSubmitting(true);
    try {
      await createCase.mutateAsync({
        tenant_id: employee.tenant_id,
        intent: selectedIntent,
        anonymity_mode: anonymityMode,
        summary: summary || undefined,
        urgency_level: urgencyLevel,
        preferred_contact_method: preferredContact,
      });
      toast.success(t('crisisSupport.request.submitted'));
      navigate('/my-support');
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

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

        {/* Step: Options (Enhanced with urgency, contact method, language) */}
        {step === 'options' && (
          <div className="space-y-4">
            <Card className="glass-card border-0 rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">{t('crisisSupport.request.options')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Urgency Level */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('crisisSupport.request.urgency')}</Label>
                  <p className="text-xs text-muted-foreground">{t('crisisSupport.request.urgencyDesc')}</p>
                  <div className="pt-2">
                    <Slider
                      value={[urgencyLevel]}
                      onValueChange={(v) => setUrgencyLevel(v[0])}
                      min={1}
                      max={5}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-1">
                      {[1, 2, 3, 4, 5].map(level => (
                        <span key={level} className={`text-xs ${urgencyLevel === level ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                          {level}
                        </span>
                      ))}
                    </div>
                    <Badge className={`mt-2 ${URGENCY_COLORS[urgencyLevel - 1]}`} variant="secondary">
                      {t(`crisisSupport.request.urgency${urgencyLevel}`)}
                    </Badge>
                  </div>
                </div>

                {/* Preferred Contact Method */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('crisisSupport.request.preferredContact')}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'chat', icon: MessageSquare, label: t('crisisSupport.request.contactChat') },
                      { key: 'voice', icon: Phone, label: t('crisisSupport.request.contactVoice') },
                      { key: 'video', icon: Video, label: t('crisisSupport.request.contactVideo') },
                    ].map(method => (
                      <button
                        key={method.key}
                        onClick={() => setPreferredContact(method.key)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                          preferredContact === method.key
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <method.icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Language */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('crisisSupport.request.preferredLanguage')}</Label>
                  <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setStep('intent'); clearMatches(); }} className="flex-1">
                {t('common.back')}
              </Button>
              <Button
                onClick={handleFindMatch}
                disabled={submitting || firstAiders.length === 0}
                className="flex-1"
              >
                {submitting ? t('common.loading') : t('crisisSupport.request.submitRequest')}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Matching Results */}
        {step === 'matching' && (
          <div className="space-y-4">
            {isMatching ? (
              <Card className="glass-card border-0 rounded-xl">
                <CardContent className="py-12 flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">{t('crisisSupport.request.matching')}</p>
                </CardContent>
              </Card>
            ) : matches.length === 0 ? (
              <Card className="glass-card border-0 rounded-xl">
                <CardContent className="py-8 text-center space-y-4">
                  <p className="text-sm text-muted-foreground">{t('crisisSupport.request.noMatchesFound')}</p>
                  <Button onClick={() => navigate('/my-support')}>{t('common.done')}</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="glass-card border-0 rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('crisisSupport.request.matchResults')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {matches.map((match, idx) => (
                      <button
                        key={match.first_aider_id}
                        onClick={() => setSelectedMatchId(match.first_aider_id)}
                        className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-colors text-start ${
                          selectedMatchId === match.first_aider_id
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-foreground">{match.display_name}</p>
                            {idx === 0 && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                {t('crisisSupport.request.bestMatch')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {match.rating && (
                              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                <Star className="h-3 w-3 fill-chart-4 text-chart-4" />
                                {match.rating}
                              </span>
                            )}
                            {match.languages.length > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                <Languages className="h-3 w-3" />
                                {match.languages.join(', ')}
                              </span>
                            )}
                            <Badge variant={match.status === 'online' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                              {match.status === 'online' ? `🟢 ${t('crisisSupport.status.online')}` : `⚫ ${t('crisisSupport.status.offline')}`}
                            </Badge>
                          </div>
                          {match.specializations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {match.specializations.map(spec => (
                                <Badge key={spec} variant="outline" className="text-[10px] px-1.5 py-0">
                                  {spec.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-end shrink-0">
                          <p className="text-xs text-muted-foreground">{t('crisisSupport.request.matchScore')}</p>
                          <p className="text-lg font-bold text-primary">{Math.round(match.score * 100)}%</p>
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setStep('options'); clearMatches(); }} className="flex-1">
                    {t('common.back')}
                  </Button>
                  <Button onClick={handleConfirmMatch} className="flex-1">
                    {t('crisisSupport.request.confirmMatch')}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Global Emergency Hotline Directory */}
        {step !== 'high_risk' && step !== 'matching' && (
          <CrisisSupport />
        )}
      </div>
    </div>
  );
}
