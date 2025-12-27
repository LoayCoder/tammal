import { useEffect } from 'react';
import { useTheme } from './useTheme';
import type { BrandingConfig } from './useBranding';

/**
 * Dynamically updates the favicon based on the current theme and branding configuration.
 * Falls back to default favicon if no theme-specific icons are configured.
 */
export function useDynamicFavicon(branding: BrandingConfig | null) {
  const { theme } = useTheme();

  useEffect(() => {
    if (!branding) return;

    const favicon = document.getElementById('favicon') as HTMLLinkElement | null;
    const faviconLight = document.getElementById('favicon-light') as HTMLLinkElement | null;
    const faviconDark = document.getElementById('favicon-dark') as HTMLLinkElement | null;

    // Determine which favicon to use based on theme
    const selectedFavicon = theme === 'dark' 
      ? (branding.icon_dark_url || branding.favicon_url)
      : (branding.icon_light_url || branding.favicon_url);

    // Update main favicon
    if (favicon && selectedFavicon) {
      favicon.href = selectedFavicon;
    }

    // Update media-query based favicons
    if (faviconLight && branding.icon_light_url) {
      faviconLight.href = branding.icon_light_url;
    } else if (faviconLight && branding.favicon_url) {
      faviconLight.href = branding.favicon_url;
    }

    if (faviconDark && branding.icon_dark_url) {
      faviconDark.href = branding.icon_dark_url;
    } else if (faviconDark && branding.favicon_url) {
      faviconDark.href = branding.favicon_url;
    }

    // Update apple-touch-icon if PWA icon is available
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    if (appleTouchIcon && branding.pwa_icon_url) {
      appleTouchIcon.href = branding.pwa_icon_url;
    }

  }, [branding, theme]);
}
