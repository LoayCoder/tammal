import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePWAInstall } from "@/hooks/ui/usePWAInstall";
import { Button } from "@/components/ui/button";
import { Download, X, Share } from "lucide-react";

export function PWAInstallBanner() {
  const { t } = useTranslation();
  const { canInstall, isInstalled, isIOS, installApp } = usePWAInstall();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("pwa-banner-dismissed") === "true"
  );

  if (dismissed || isInstalled) return null;

  const showIOSHint = isIOS && !canInstall;
  if (!canInstall && !showIOSHint) return null;

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-banner-dismissed", "true");
    setDismissed(true);
  };

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) handleDismiss();
  };

  return (
    <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 mx-4 mt-4">
      <Download className="h-5 w-5 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        {showIOSHint ? (
          <p className="text-sm text-foreground">
            <Share className="inline h-4 w-4 me-1 align-text-bottom" />
            {t("pwa.iosInstallHint", "Tap Share then \"Add to Home Screen\" to install")}
          </p>
        ) : (
          <p className="text-sm text-foreground">
            {t("pwa.installPrompt", "Install the app for a better experience")}
          </p>
        )}
      </div>
      {canInstall && (
        <Button size="sm" variant="default" onClick={handleInstall}>
          {t("pwa.install", "Install")}
        </Button>
      )}
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
        aria-label={t("common.dismiss", "Dismiss")}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
