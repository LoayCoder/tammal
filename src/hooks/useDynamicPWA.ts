import { useEffect } from 'react';
import type { BrandingConfig } from './useBranding';

/**
 * Dynamically updates PWA manifest link if tenant has custom PWA icon.
 * Also updates the web app manifest icon references in the document head.
 */
export function useDynamicPWA(branding: BrandingConfig | null) {
  useEffect(() => {
    if (!branding?.pwa_icon_url) return;

    // Create or update manifest link for dynamic PWA icons
    const existingManifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    
    // For runtime PWA icon updates, we inject the icon into the apple-touch-icon
    // The service worker manifest is static, but apple-touch-icon can be dynamic
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    if (appleTouchIcon && branding.pwa_icon_url) {
      appleTouchIcon.href = branding.pwa_icon_url;
    }

    // Add additional PWA icons for different sizes
    const existingIcons = document.querySelectorAll('link[rel="icon"][sizes]');
    existingIcons.forEach(icon => icon.remove());

    if (branding.pwa_icon_url) {
      // Add 192x192 icon
      const icon192 = document.createElement('link');
      icon192.rel = 'icon';
      icon192.type = 'image/png';
      icon192.sizes = '192x192';
      icon192.href = branding.pwa_icon_url;
      document.head.appendChild(icon192);

      // Add 512x512 icon
      const icon512 = document.createElement('link');
      icon512.rel = 'icon';
      icon512.type = 'image/png';
      icon512.sizes = '512x512';
      icon512.href = branding.pwa_icon_url;
      document.head.appendChild(icon512);
    }

    return () => {
      // Cleanup dynamically added icons
      const addedIcons = document.querySelectorAll('link[rel="icon"][sizes]');
      addedIcons.forEach(icon => icon.remove());
    };
  }, [branding?.pwa_icon_url]);
}
