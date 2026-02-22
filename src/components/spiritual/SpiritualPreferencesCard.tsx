import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Moon, MapPin } from 'lucide-react';
import { useSpiritualPreferences } from '@/hooks/useSpiritualPreferences';
import { CALCULATION_METHODS } from '@/hooks/usePrayerTimes';

export function SpiritualPreferencesCard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { preferences, isLoading, upsertPreferences } = useSpiritualPreferences();

  const handleToggle = (field: string, value: boolean) => {
    const updates: Record<string, any> = { [field]: value };
    // If disabling main toggle, disable all sub-toggles
    if (field === 'enabled' && !value) {
      updates.prayer_enabled = false;
      updates.quran_enabled = false;
      updates.fasting_enabled = false;
      updates.reminders_enabled = false;
    }
    upsertPreferences.mutate(updates);
  };

  const handleFieldChange = (field: string, value: string | number) => {
    upsertPreferences.mutate({ [field]: value } as any);
  };

  const isEnabled = preferences?.enabled ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5" />
          {t('spiritual.preferences.title')}
        </CardTitle>
        <CardDescription>{t('spiritual.preferences.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">{t('spiritual.preferences.enableToggle')}</Label>
            <p className="text-sm text-muted-foreground">{t('spiritual.preferences.enableDescription')}</p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={(v) => handleToggle('enabled', v)}
            disabled={upsertPreferences.isPending}
          />
        </div>

        {isEnabled && (
          <>
            <Separator />

            {/* Sub-toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t('spiritual.preferences.prayerTracking')}</Label>
                <Switch
                  checked={preferences?.prayer_enabled ?? false}
                  onCheckedChange={(v) => handleToggle('prayer_enabled', v)}
                  disabled={upsertPreferences.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{t('spiritual.preferences.quranEngagement')}</Label>
                <Switch
                  checked={preferences?.quran_enabled ?? false}
                  onCheckedChange={(v) => handleToggle('quran_enabled', v)}
                  disabled={upsertPreferences.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{t('spiritual.preferences.sunnahFasting')}</Label>
                <Switch
                  checked={preferences?.fasting_enabled ?? false}
                  onCheckedChange={(v) => handleToggle('fasting_enabled', v)}
                  disabled={upsertPreferences.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-muted-foreground">{t('spiritual.preferences.spiritualReminders')}</Label>
                  <Badge variant="secondary" className="text-xs">{t('spiritual.preferences.comingSoon')}</Badge>
                </div>
                <Switch disabled checked={false} />
              </div>
            </div>

            <Separator />

            {/* Location settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('spiritual.preferences.locationSettings')}
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('spiritual.preferences.city')}</Label>
                  <Input
                    value={preferences?.city ?? ''}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    placeholder={isRTL ? 'مثال: الرياض' : 'e.g. Riyadh'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('spiritual.preferences.country')}</Label>
                  <Input
                    value={preferences?.country ?? ''}
                    onChange={(e) => handleFieldChange('country', e.target.value)}
                    placeholder={isRTL ? 'مثال: SA' : 'e.g. SA'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('spiritual.preferences.calculationMethod')}</Label>
                <Select
                  value={String(preferences?.calculation_method ?? 4)}
                  onValueChange={(v) => handleFieldChange('calculation_method', parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CALCULATION_METHODS.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {isRTL ? m.nameAr : m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Legal disclaimer */}
            <p className="text-xs text-muted-foreground italic">
              {t('spiritual.preferences.disclaimer')}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
