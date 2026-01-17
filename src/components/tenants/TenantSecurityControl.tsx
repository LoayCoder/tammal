import { useTranslation } from 'react-i18next';
import { Shield, Clock, Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

export interface SecuritySettings {
  mfa_trust_duration_days: number;
  session_timeout_minutes: number;
  max_concurrent_sessions: number;
  glass_break_active: boolean;
}

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  mfa_trust_duration_days: 15,
  session_timeout_minutes: 15,
  max_concurrent_sessions: 1,
  glass_break_active: false,
};

interface TenantSecurityControlProps {
  settings: SecuritySettings;
  onChange: (settings: SecuritySettings) => void;
}

export function TenantSecurityControl({ settings, onChange }: TenantSecurityControlProps) {
  const { t } = useTranslation();

  const handleChange = <K extends keyof SecuritySettings>(key: K, value: SecuritySettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* MFA Settings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t('tenants.security.mfaSettings')}</CardTitle>
          </div>
          <CardDescription>{t('tenants.security.mfaSettingsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('tenants.security.mfaTrustDuration')}</Label>
              <span className="text-sm text-muted-foreground">
                {t('tenants.daysCount', { count: settings.mfa_trust_duration_days })}
              </span>
            </div>
            <Slider
              value={[settings.mfa_trust_duration_days]}
              onValueChange={([value]) => handleChange('mfa_trust_duration_days', value)}
              min={1}
              max={365}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {t('tenants.security.mfaTrustDurationHint')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Session Settings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t('tenants.security.sessionSettings')}</CardTitle>
          </div>
          <CardDescription>{t('tenants.security.sessionSettingsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('tenants.security.sessionTimeout')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings.session_timeout_minutes}
                onChange={(e) => handleChange('session_timeout_minutes', parseInt(e.target.value) || 15)}
                min={5}
                max={120}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">{t('tenants.security.minutes')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('tenants.security.sessionTimeoutHint')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Concurrent Sessions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t('tenants.security.concurrentSessions')}</CardTitle>
          </div>
          <CardDescription>{t('tenants.security.concurrentSessionsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('tenants.security.maxConcurrent')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings.max_concurrent_sessions}
                onChange={(e) => handleChange('max_concurrent_sessions', parseInt(e.target.value) || 1)}
                min={1}
                max={10}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">{t('tenants.security.sessions')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('tenants.security.maxConcurrentHint')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Access */}
      <Card className={settings.glass_break_active ? 'border-destructive' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${settings.glass_break_active ? 'text-destructive' : 'text-muted-foreground'}`} />
              <CardTitle className="text-base">{t('tenants.security.glassBreak')}</CardTitle>
            </div>
            {settings.glass_break_active && (
              <Badge variant="destructive">{t('common.active')}</Badge>
            )}
          </div>
          <CardDescription>{t('tenants.security.glassBreakDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('tenants.security.enableGlassBreak')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('tenants.security.glassBreakWarning')}
              </p>
            </div>
            <Switch
              checked={settings.glass_break_active}
              onCheckedChange={(checked) => handleChange('glass_break_active', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
