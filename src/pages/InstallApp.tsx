import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Check, 
  Smartphone, 
  Monitor, 
  Share, 
  Plus,
  MoreVertical,
  Wifi,
  Zap,
  Bell,
  ArrowLeft
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useBranding } from '@/hooks/useBranding';
import { ThemeLogo } from '@/components/branding/ThemeLogo';

export default function InstallApp() {
  const { t } = useTranslation();
  const { canInstall, isInstalled, isIOS, isAndroid, installApp } = usePWAInstall();
  const { branding } = useBranding();

  const features = [
    { icon: Wifi, key: 'featureOffline' },
    { icon: Zap, key: 'featureFast' },
    { icon: Smartphone, key: 'featureNative' },
    { icon: Bell, key: 'featureNotifications' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-8 px-4">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Link>

        {/* Hero Section */}
        <div className="text-center space-y-6 mb-8">
          <div className="flex justify-center">
            <div className="rounded-2xl bg-primary/10 p-6">
              <ThemeLogo
                logoLightUrl={branding.logo_light_url}
                logoDarkUrl={branding.logo_dark_url}
                logoUrl={branding.logo_url}
                className="h-20 w-auto"
                alt="App Logo"
                fallback={
                  <Download className="h-20 w-20 text-primary" />
                }
              />
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('install.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('install.subtitle')}</p>
          </div>

          {/* Install Button */}
          {isInstalled ? (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="h-5 w-5" />
                <span className="font-medium">{t('install.alreadyInstalled')}</span>
              </div>
              <div>
                <Button asChild>
                  <Link to="/">{t('install.openApp')}</Link>
                </Button>
              </div>
            </div>
          ) : canInstall ? (
            <Button size="lg" onClick={installApp} className="gap-2">
              <Download className="h-5 w-5" />
              {t('install.installButton')}
            </Button>
          ) : null}
        </div>

        {/* Features */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              {features.map(({ icon: Icon, key }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm">{t(`install.${key}`)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Instructions */}
        {!isInstalled && (
          <div className="space-y-4">
            {/* iOS Instructions */}
            {isIOS && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Smartphone className="h-5 w-5" />
                    {t('install.iosTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                    <div className="flex items-center gap-2">
                      <span>{t('install.iosStep1')}</span>
                      <Share className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                    <div className="flex items-center gap-2">
                      <span>{t('install.iosStep2')}</span>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
                    <span>{t('install.iosStep3')}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Android Instructions */}
            {isAndroid && !canInstall && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Smartphone className="h-5 w-5" />
                    {t('install.androidTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                    <div className="flex items-center gap-2">
                      <span>{t('install.androidStep1')}</span>
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                    <span>{t('install.androidStep2')}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Desktop Instructions */}
            {!isIOS && !isAndroid && !canInstall && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Monitor className="h-5 w-5" />
                    {t('install.desktopTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                    <span>{t('install.desktopStep1')}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                    <span>{t('install.desktopStep2')}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
