import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Palette, Settings } from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import { ThemeLogo } from './ThemeLogo';

interface DashboardBrandingPreviewProps {
  tenantId?: string;
}

export function DashboardBrandingPreview({ tenantId }: DashboardBrandingPreviewProps) {
  const { t } = useTranslation();
  const { branding, isLoading } = useBranding(tenantId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="h-5 w-5 text-muted-foreground" />
          {t('dashboard.brandingPreview')}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/branding">
            <Settings className="h-4 w-4 me-1" />
            {t('dashboard.customizeBranding')}
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logo Preview */}
        <div className="flex items-center justify-center rounded-lg border border-border bg-muted/30 p-4">
          <ThemeLogo
            logoLightUrl={branding.logo_light_url}
            logoDarkUrl={branding.logo_dark_url}
            logoUrl={branding.logo_url}
            className="h-12 max-w-full object-contain"
            alt={t('branding.themeLogo')}
            fallback={
              <div className="flex items-center gap-2 text-muted-foreground">
                <Palette className="h-8 w-8" />
                <span className="text-sm">{t('branding.uploadLogo')}</span>
              </div>
            }
          />
        </div>

        {/* Color Swatches */}
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <div className="text-xs text-muted-foreground">{t('branding.colorPalette')}</div>
            <div className="flex gap-2">
              <div
                className="h-8 w-8 rounded-md border border-border shadow-sm"
                style={{ backgroundColor: `hsl(${branding.colors.primary.h}, ${branding.colors.primary.s}%, ${branding.colors.primary.l}%)` }}
                title={t('branding.primaryColor')}
              />
              <div
                className="h-8 w-8 rounded-md border border-border shadow-sm"
                style={{ backgroundColor: `hsl(${branding.colors.secondary.h}, ${branding.colors.secondary.s}%, ${branding.colors.secondary.l}%)` }}
                title={t('branding.secondaryColor')}
              />
              <div
                className="h-8 w-8 rounded-md border border-border shadow-sm"
                style={{ backgroundColor: `hsl(${branding.colors.accent.h}, ${branding.colors.accent.s}%, ${branding.colors.accent.l}%)` }}
                title={t('branding.accentColor')}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
