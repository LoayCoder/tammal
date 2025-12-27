import { useEffect } from 'react';
import type { BrandingConfig } from './useBranding';

/**
 * Applies the tenant's branding HSL colors to CSS custom properties at runtime.
 * This allows dynamic theming based on tenant configuration.
 */
export function useBrandingColors(branding: BrandingConfig | null) {
  useEffect(() => {
    if (!branding?.colors) return;

    const root = document.documentElement;
    const { primary, secondary, accent } = branding.colors;

    // Apply primary color
    if (primary) {
      root.style.setProperty('--primary', `${primary.h} ${primary.s}% ${primary.l}%`);
      // Derive primary-foreground based on lightness
      const primaryForeground = primary.l > 50 
        ? '222.2 47.4% 11.2%' // dark text for light background
        : '210 40% 98%'; // light text for dark background
      root.style.setProperty('--primary-foreground', primaryForeground);
    }

    // Apply secondary color
    if (secondary) {
      root.style.setProperty('--secondary', `${secondary.h} ${secondary.s}% ${secondary.l}%`);
      const secondaryForeground = secondary.l > 50 
        ? '222.2 47.4% 11.2%'
        : '210 40% 98%';
      root.style.setProperty('--secondary-foreground', secondaryForeground);
    }

    // Apply accent color
    if (accent) {
      root.style.setProperty('--accent', `${accent.h} ${accent.s}% ${accent.l}%`);
      const accentForeground = accent.l > 50 
        ? '222.2 47.4% 11.2%'
        : '210 40% 98%';
      root.style.setProperty('--accent-foreground', accentForeground);
    }

    // Update theme-color meta tag
    if (primary) {
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', `hsl(${primary.h}, ${primary.s}%, ${primary.l}%)`);
      }
    }

    // Cleanup function to reset styles when unmounting or branding changes
    return () => {
      // We don't reset here as we want the colors to persist
    };
  }, [branding]);
}
