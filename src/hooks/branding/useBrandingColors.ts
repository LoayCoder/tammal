import { useEffect } from 'react';
import type { BrandingConfig } from './useBranding';

/**
 * Applies the tenant's branding HSL colors to CSS custom properties at runtime.
 * Propagates primary to all derived variables (ring, sidebar, charts, etc.).
 */
export function useBrandingColors(branding: BrandingConfig | null) {
  useEffect(() => {
    if (!branding?.colors) return;

    const root = document.documentElement;
    const { primary, secondary, accent } = branding.colors;

    // Apply primary color + all derived variables
    if (primary) {
      const primaryVal = `${primary.h} ${primary.s}% ${primary.l}%`;
      root.style.setProperty('--primary', primaryVal);

      // Derive primary-foreground based on lightness
      const primaryForeground = primary.l > 50 
        ? '222.2 47.4% 11.2%'
        : '210 40% 98%';
      root.style.setProperty('--primary-foreground', primaryForeground);

      // Propagate to all derived CSS vars that track primary
      root.style.setProperty('--ring', primaryVal);
      root.style.setProperty('--sidebar-primary', primaryVal);
      root.style.setProperty('--sidebar-primary-foreground', primaryForeground);
      root.style.setProperty('--sidebar-ring', primaryVal);
      root.style.setProperty('--chart-1', primaryVal);
      root.style.setProperty('--org-default', primaryVal);

      // Derive sidebar-active-bg as a light tint of primary
      const isDark = root.classList.contains('dark');
      const activeBg = isDark
        ? `${primary.h} 40% 18%`
        : `${primary.h} ${Math.min(primary.s, 89)}% 96%`;
      root.style.setProperty('--sidebar-active-bg', activeBg);
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
      const accentVal = `${accent.h} ${accent.s}% ${accent.l}%`;
      root.style.setProperty('--accent', accentVal);
      const accentForeground = accent.l > 50 
        ? '222.2 47.4% 11.2%'
        : '210 40% 98%';
      root.style.setProperty('--accent-foreground', accentForeground);

      // Chart-2 tracks accent
      root.style.setProperty('--chart-2', accentVal);
    }

    // Update theme-color meta tag
    if (primary) {
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', `hsl(${primary.h}, ${primary.s}%, ${primary.l}%)`);
      }
    }

    return () => {
      // Colors persist intentionally
    };
  }, [branding]);
}
