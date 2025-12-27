import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { HSLColorPicker, type HSLColor } from '@/components/branding/HSLColorPicker';
import { ImageUploader } from '@/components/branding/ImageUploader';
import { BrandingPreview } from '@/components/branding/BrandingPreview';
import { useBranding } from '@/hooks/useBranding';
import { supabase } from '@/integrations/supabase/client';

export default function AdminBranding() {
  const { t } = useTranslation();
  const [tenantId, setTenantId] = useState<string | undefined>();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoLightFile, setLogoLightFile] = useState<File | null>(null);
  const [logoDarkFile, setLogoDarkFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [iconLightFile, setIconLightFile] = useState<File | null>(null);
  const [iconDarkFile, setIconDarkFile] = useState<File | null>(null);
  const [pwaIconFile, setPwaIconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Fetch user's tenant ID
  useEffect(() => {
    async function fetchTenantId() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();
        
        if (data?.tenant_id) {
          setTenantId(data.tenant_id);
        }
      }
    }
    fetchTenantId();
  }, []);

  const { 
    branding, 
    setBranding, 
    isLoading, 
    isSaving, 
    saveBranding, 
    resetBranding,
    defaultBranding 
  } = useBranding(tenantId);

  // Update logo preview when branding changes
  useEffect(() => {
    if (branding.logo_url) {
      setLogoPreview(branding.logo_url);
    }
  }, [branding.logo_url]);

  const handleColorChange = (colorKey: 'primary' | 'secondary' | 'accent') => (color: HSLColor) => {
    setBranding(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: color
      }
    }));
  };

  const handleLogoChange = (file: File | null) => {
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(branding.logo_url);
    }
  };

  const handleFaviconChange = (file: File | null) => setFaviconFile(file);
  const handleLogoLightChange = (file: File | null) => setLogoLightFile(file);
  const handleLogoDarkChange = (file: File | null) => setLogoDarkFile(file);
  const handleIconLightChange = (file: File | null) => setIconLightFile(file);
  const handleIconDarkChange = (file: File | null) => setIconDarkFile(file);
  const handlePwaIconChange = (file: File | null) => setPwaIconFile(file);

  const handleSave = async () => {
    await saveBranding(branding, {
      logo: logoFile,
      logo_light: logoLightFile,
      logo_dark: logoDarkFile,
      favicon: faviconFile,
      icon_light: iconLightFile,
      icon_dark: iconDarkFile,
      pwa_icon: pwaIconFile,
    });
    // Reset all file states
    setLogoFile(null);
    setLogoLightFile(null);
    setLogoDarkFile(null);
    setFaviconFile(null);
    setIconLightFile(null);
    setIconDarkFile(null);
    setPwaIconFile(null);
  };

  const handleReset = () => {
    resetBranding();
    setLogoFile(null);
    setLogoLightFile(null);
    setLogoDarkFile(null);
    setFaviconFile(null);
    setIconLightFile(null);
    setIconDarkFile(null);
    setPwaIconFile(null);
    setLogoPreview(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('branding.title')}</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              {t('branding.noTenant')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('branding.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('branding.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="h-4 w-4 me-2 rtl:-scale-x-100" />
            {t('branding.resetToDefault')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 me-2" />
            {isSaving ? t('common.loading') : t('branding.saveChanges')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Colors Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t('branding.colorsSection')}</CardTitle>
              <CardDescription>{t('branding.colorsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <HSLColorPicker
                  label={t('branding.primaryColor')}
                  value={branding.colors.primary}
                  onChange={handleColorChange('primary')}
                />
                <HSLColorPicker
                  label={t('branding.secondaryColor')}
                  value={branding.colors.secondary}
                  onChange={handleColorChange('secondary')}
                />
                <HSLColorPicker
                  label={t('branding.accentColor')}
                  value={branding.colors.accent}
                  onChange={handleColorChange('accent')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Primary Assets Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t('branding.assetsSection')}</CardTitle>
              <CardDescription>{t('branding.assetsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <ImageUploader
                  label={t('branding.uploadLogo')}
                  value={branding.logo_url || undefined}
                  onChange={handleLogoChange}
                  accept="image/png,image/jpeg,image/svg+xml"
                  maxSizeKB={2048}
                  previewSize="large"
                />
                <ImageUploader
                  label={t('branding.uploadFavicon')}
                  value={branding.favicon_url || undefined}
                  onChange={handleFaviconChange}
                  accept="image/png,image/x-icon"
                  maxSizeKB={500}
                  previewSize="small"
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo Variants Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t('branding.logosSection')}</CardTitle>
              <CardDescription>{t('branding.logosDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <ImageUploader
                  label={t('branding.uploadLogoLight')}
                  value={branding.logo_light_url || undefined}
                  onChange={handleLogoLightChange}
                  accept="image/png,image/jpeg,image/svg+xml"
                  maxSizeKB={2048}
                  previewSize="large"
                />
                <ImageUploader
                  label={t('branding.uploadLogoDark')}
                  value={branding.logo_dark_url || undefined}
                  onChange={handleLogoDarkChange}
                  accept="image/png,image/jpeg,image/svg+xml"
                  maxSizeKB={2048}
                  previewSize="large"
                />
              </div>
            </CardContent>
          </Card>

          {/* Icon Variants Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t('branding.iconsSection')}</CardTitle>
              <CardDescription>{t('branding.iconsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <ImageUploader
                  label={t('branding.uploadIconLight')}
                  value={branding.icon_light_url || undefined}
                  onChange={handleIconLightChange}
                  accept="image/png,image/svg+xml"
                  maxSizeKB={500}
                  previewSize="small"
                />
                <ImageUploader
                  label={t('branding.uploadIconDark')}
                  value={branding.icon_dark_url || undefined}
                  onChange={handleIconDarkChange}
                  accept="image/png,image/svg+xml"
                  maxSizeKB={500}
                  previewSize="small"
                />
                <div>
                  <ImageUploader
                    label={t('branding.uploadPwaIcon')}
                    value={branding.pwa_icon_url || undefined}
                    onChange={handlePwaIconChange}
                    accept="image/png"
                    maxSizeKB={1024}
                    previewSize="small"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t('branding.pwaIconHint')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div>
          <BrandingPreview
            primaryColor={branding.colors.primary}
            secondaryColor={branding.colors.secondary}
            accentColor={branding.colors.accent}
            logoUrl={logoPreview}
          />
        </div>
      </div>
    </div>
  );
}
