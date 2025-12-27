import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface BrandingConfig {
  primary_hsl?: string;
  secondary_hsl?: string;
  accent_hsl?: string;
  logo_url?: string | null;
  favicon_url?: string | null;
}

interface TenantBrandingTabProps {
  branding: BrandingConfig;
  onChange: (branding: BrandingConfig) => void;
}

export function TenantBrandingTab({ branding, onChange }: TenantBrandingTabProps) {
  const { t } = useTranslation();

  const handleColorChange = (key: keyof BrandingConfig, value: string) => {
    onChange({ ...branding, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium">{t('branding.colorsSection')}</h4>
        <p className="text-xs text-muted-foreground">{t('branding.colorsDescription')}</p>
        
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>{t('branding.primaryColor')}</Label>
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: branding.primary_hsl ? `hsl(${branding.primary_hsl})` : 'hsl(var(--primary))' }}
              />
              <Input
                value={branding.primary_hsl || ''}
                onChange={(e) => handleColorChange('primary_hsl', e.target.value)}
                placeholder="222.2 47.4% 11.2%"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('branding.secondaryColor')}</Label>
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: branding.secondary_hsl ? `hsl(${branding.secondary_hsl})` : 'hsl(var(--secondary))' }}
              />
              <Input
                value={branding.secondary_hsl || ''}
                onChange={(e) => handleColorChange('secondary_hsl', e.target.value)}
                placeholder="210 40% 96%"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('branding.accentColor')}</Label>
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: branding.accent_hsl ? `hsl(${branding.accent_hsl})` : 'hsl(var(--accent))' }}
              />
              <Input
                value={branding.accent_hsl || ''}
                onChange={(e) => handleColorChange('accent_hsl', e.target.value)}
                placeholder="210 40% 90%"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium">{t('branding.assetsSection')}</h4>
        <p className="text-xs text-muted-foreground">{t('branding.assetsDescription')}</p>
        
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>{t('branding.logo')}</Label>
            <Input
              value={branding.logo_url || ''}
              onChange={(e) => handleColorChange('logo_url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label>{t('branding.favicon')}</Label>
            <Input
              value={branding.favicon_url || ''}
              onChange={(e) => handleColorChange('favicon_url', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">{t('branding.preview')}</h4>
        <div className="flex gap-2">
          <div 
            className="px-4 py-2 rounded text-sm font-medium text-white"
            style={{ backgroundColor: branding.primary_hsl ? `hsl(${branding.primary_hsl})` : 'hsl(var(--primary))' }}
          >
            {t('branding.primaryButton')}
          </div>
          <div 
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ 
              backgroundColor: branding.secondary_hsl ? `hsl(${branding.secondary_hsl})` : 'hsl(var(--secondary))',
              color: 'hsl(var(--secondary-foreground))'
            }}
          >
            {t('branding.secondaryButton')}
          </div>
          <div 
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ 
              backgroundColor: branding.accent_hsl ? `hsl(${branding.accent_hsl})` : 'hsl(var(--accent))',
              color: 'hsl(var(--accent-foreground))'
            }}
          >
            {t('branding.accentButton')}
          </div>
        </div>
      </div>
    </div>
  );
}
