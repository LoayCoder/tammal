import { useEffect } from 'react';
import type { BrandingConfig } from './useBranding';

/**
 * Dynamically updates PWA manifest link if tenant has custom PWA icon.
 * Also updates the web app manifest icon references in the document head.
 */
export function useDynamicPWA(branding: BrandingConfig | null) {
  useEffect(() => {
    if (!branding) return;

    // Helper to Create Manifest Blob
    const createManifestBlob = () => {
      // Default to what we have
      const existingIcons = [];

      // We prioritize the strictly isolated assets
      const iconLight = branding.pwa_icon_light_url || branding.pwa_icon_url || '/pwa-192x192.png';
      const iconDark = branding.pwa_icon_dark_url || branding.pwa_icon_url || '/pwa-192x192.png';

      const manifestContent = {
        name: "Tammal",
        short_name: "Tammal",
        description: "Multi-tenant SaaS Application",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: iconLight,
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: iconLight,
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
          // We can add "dark" specific icons if browsers support 'media' in manifest icons in the future of this project,
          // but currently switching manifests or standard icons is the way. 
          // For now, we will use the 'light' icon as the default standard one for the manifest, 
          // as dynamic OS theme switching for manifest icons is tricky without a separate dark manifest.
        ]
      };

      const stringManifest = JSON.stringify(manifestContent);
      const blob = new Blob([stringManifest], { type: 'application/json' });
      return URL.createObjectURL(blob);
    };

    // Update Manifest Link
    const updateManifest = () => {
      const manifestUrl = createManifestBlob();
      let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;

      if (link) {
        URL.revokeObjectURL(link.href); // Clean up old
        link.href = manifestUrl;
      } else {
        link = document.createElement('link');
        link.rel = 'manifest';
        link.href = manifestUrl;
        document.head.appendChild(link);
      }
    };

    updateManifest();

    // Update Apple Touch Icon & Favicon (Dynamic based on system preference is valid via matchMedia)
    const updateFavicons = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const activeIcon = isDark
        ? (branding.pwa_icon_dark_url || branding.pwa_icon_url)
        : (branding.pwa_icon_light_url || branding.pwa_icon_url);

      if (activeIcon) {
        let appleLink = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
        if (appleLink) appleLink.href = activeIcon;

        let favLink = document.querySelector('link[rel="icon"][sizes="any"]') as HTMLLinkElement;
        if (!favLink) favLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favLink) favLink.href = activeIcon;
      }
    };

    // Initial call
    updateFavicons();

    // Listen for theme changes to update favicon dynamically
    const matcher = window.matchMedia('(prefers-color-scheme: dark)');
    const changeHandler = () => updateFavicons();
    matcher.addEventListener('change', changeHandler);

    return () => {
      matcher.removeEventListener('change', changeHandler);
    };

  }, [branding?.pwa_icon_url, branding?.pwa_icon_light_url, branding?.pwa_icon_dark_url]);
}
