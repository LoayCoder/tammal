import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { HSLColor } from './HSLColorPicker';

interface BrandingPreviewProps {
  primaryColor: HSLColor;
  secondaryColor: HSLColor;
  accentColor: HSLColor;
  logoUrl?: string | null;
}

function hslToString(color: HSLColor): string {
  return `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
}

export function BrandingPreview({ 
  primaryColor, 
  secondaryColor, 
  accentColor,
  logoUrl 
}: BrandingPreviewProps) {
  const { t } = useTranslation();

  const primaryHsl = hslToString(primaryColor);
  const secondaryHsl = hslToString(secondaryColor);
  const accentHsl = hslToString(accentColor);

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader>
        <CardTitle>{t('branding.preview')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Preview */}
        {logoUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('branding.logo')}</p>
            <div className="p-4 rounded-md bg-muted flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt="Logo preview" 
                className="max-h-16 object-contain"
              />
            </div>
          </div>
        )}

        {/* Color Swatches */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('branding.colorPalette')}</p>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <div 
                className="h-12 rounded-md shadow-sm" 
                style={{ backgroundColor: primaryHsl }}
              />
              <p className="text-xs text-center text-muted-foreground">
                {t('branding.primaryColor')}
              </p>
            </div>
            <div className="flex-1 space-y-1">
              <div 
                className="h-12 rounded-md shadow-sm border border-border" 
                style={{ backgroundColor: secondaryHsl }}
              />
              <p className="text-xs text-center text-muted-foreground">
                {t('branding.secondaryColor')}
              </p>
            </div>
            <div className="flex-1 space-y-1">
              <div 
                className="h-12 rounded-md shadow-sm" 
                style={{ backgroundColor: accentHsl }}
              />
              <p className="text-xs text-center text-muted-foreground">
                {t('branding.accentColor')}
              </p>
            </div>
          </div>
        </div>

        {/* Button Preview */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('branding.previewButtons')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              className="px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryHsl }}
            >
              {t('branding.primaryButton')}
            </button>
            <button
              className="px-4 py-2 rounded-md text-sm font-medium border transition-opacity hover:opacity-90"
              style={{ 
                backgroundColor: secondaryHsl,
                borderColor: primaryHsl,
                color: primaryHsl
              }}
            >
              {t('branding.secondaryButton')}
            </button>
            <button
              className="px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentHsl }}
            >
              {t('branding.accentButton')}
            </button>
          </div>
        </div>

        {/* Card Preview */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('branding.previewCards')}</p>
          <div 
            className="p-4 rounded-md border"
            style={{ borderColor: primaryHsl }}
          >
            <div 
              className="w-full h-1 rounded-full mb-3"
              style={{ backgroundColor: accentHsl }}
            />
            <p className="text-sm font-medium mb-1">{t('branding.sampleCardTitle')}</p>
            <p className="text-xs text-muted-foreground">
              {t('branding.sampleCardDescription')}
            </p>
          </div>
        </div>

        {/* Header Preview */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('branding.previewHeader')}</p>
          <div 
            className="p-3 rounded-md flex items-center gap-3"
            style={{ backgroundColor: primaryHsl }}
          >
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Header logo" 
                className="h-6 object-contain brightness-0 invert"
              />
            ) : (
              <div className="h-6 w-20 bg-white/20 rounded" />
            )}
            <div className="flex-1" />
            <div className="flex gap-2">
              <div className="h-4 w-12 bg-white/20 rounded" />
              <div className="h-4 w-12 bg-white/20 rounded" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
