import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Users, CreditCard, Headphones, Building2, FileText, Shield, UserPlus } from 'lucide-react';

export interface TenantSettings {
  allow_signup: boolean;
  mfa_required: boolean;
  max_users: number;
  modules: {
    user_management: boolean;
    billing: boolean;
    support: boolean;
    org_structure: boolean;
    documents: boolean;
  };
}

export const DEFAULT_SETTINGS: TenantSettings = {
  allow_signup: true,
  mfa_required: false,
  max_users: 10,
  modules: {
    user_management: true,
    billing: true,
    support: true,
    org_structure: true,
    documents: true,
  },
};

interface TenantModuleControlProps {
  settings: TenantSettings;
  onChange: (settings: TenantSettings) => void;
}

const MODULE_ICONS = {
  user_management: Users,
  billing: CreditCard,
  support: Headphones,
  org_structure: Building2,
  documents: FileText,
};

export function TenantModuleControl({ settings, onChange }: TenantModuleControlProps) {
  const { t } = useTranslation();

  const handleModuleToggle = (module: keyof TenantSettings['modules']) => {
    onChange({
      ...settings,
      modules: {
        ...settings.modules,
        [module]: !settings.modules[module],
      },
    });
  };

  const handleSettingToggle = (key: 'allow_signup' | 'mfa_required') => {
    onChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleMaxUsersChange = (value: string) => {
    const num = parseInt(value, 10);
    onChange({
      ...settings,
      max_users: isNaN(num) ? -1 : num,
    });
  };

  const moduleKeys = Object.keys(settings.modules) as (keyof TenantSettings['modules'])[];

  return (
    <div className="space-y-6">
      {/* Access Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">{t('tenants.accessSettings')}</h4>
        <p className="text-xs text-muted-foreground">{t('tenants.accessSettingsDescription')}</p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">{t('tenants.allowSignup')}</Label>
                <p className="text-xs text-muted-foreground">{t('tenants.allowSignupDescription')}</p>
              </div>
            </div>
            <Switch
              checked={settings.allow_signup}
              onCheckedChange={() => handleSettingToggle('allow_signup')}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">{t('tenants.mfaRequired')}</Label>
                <p className="text-xs text-muted-foreground">{t('tenants.mfaRequiredDescription')}</p>
              </div>
            </div>
            <Switch
              checked={settings.mfa_required}
              onCheckedChange={() => handleSettingToggle('mfa_required')}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">{t('tenants.maxUsers')}</Label>
                <p className="text-xs text-muted-foreground">{t('tenants.maxUsersDescription')}</p>
              </div>
            </div>
            <Input
              type="number"
              value={settings.max_users === -1 ? '' : settings.max_users}
              onChange={(e) => handleMaxUsersChange(e.target.value)}
              placeholder={t('plans.unlimited')}
              className="w-24 text-end"
              min={-1}
            />
          </div>
        </div>
      </div>

      {/* Module Toggles */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">{t('tenants.moduleAccess')}</h4>
        <p className="text-xs text-muted-foreground">{t('tenants.moduleAccessDescription')}</p>
        
        <div className="space-y-3">
          {moduleKeys.map((module) => {
            const Icon = MODULE_ICONS[module];
            return (
              <div
                key={module}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">
                      {t(`tenants.modules.${module}`)}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t(`tenants.modules.${module}Description`)}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.modules[module]}
                  onCheckedChange={() => handleModuleToggle(module)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
