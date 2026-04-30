import { Building, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { SidebarHeader } from '@/components/ui/sidebar';
import { ThemeLogo } from '@/components/branding/ThemeLogo';
import { ThemeIcon } from '@/components/branding/ThemeIcon';
import type { BrandingConfig } from '@/hooks/branding/useBranding';
import type { TFunction } from 'i18next';

interface SidebarHeaderSectionProps {
  branding: BrandingConfig;
  isCollapsed: boolean;
  isRTL: boolean;
  toggleSidebar: () => void;
  t: TFunction;
}

export function SidebarHeaderSection({
  branding,
  isCollapsed,
  isRTL,
  toggleSidebar,
  t,
}: SidebarHeaderSectionProps) {
  const ToggleIcon = isCollapsed
    ? (isRTL ? ChevronsLeft : ChevronsRight)
    : (isRTL ? ChevronsRight : ChevronsLeft);

  return (
    <SidebarHeader className="px-2 sm:px-3 pt-3 sm:pt-4 pb-2 sm:pb-3">
      <div className="flex items-center justify-between min-h-[40px] sm:min-h-[48px]">
        <div className="flex items-center justify-center flex-1 overflow-hidden">
          {isCollapsed ? (
            <ThemeIcon
              iconLightUrl={branding.icon_light_url}
              iconDarkUrl={branding.icon_dark_url}
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain shrink-0"
              alt={t('branding.themeIcon')}
              fallback={<Building className="h-7 w-7 sm:h-8 sm:w-8 text-sidebar-foreground/70" />}
            />
          ) : (
            <ThemeLogo
              logoUrl={branding.logo_url}
              logoLightUrl={branding.logo_light_url}
              logoDarkUrl={branding.logo_dark_url}
              className="h-7 sm:h-8 max-w-[120px] sm:max-w-[140px] object-contain"
              alt={t('branding.themeLogo')}
              fallback={
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 sm:h-6 sm:w-6 text-sidebar-foreground/70" />
                  <span className="font-semibold text-sm sm:text-base text-sidebar-foreground/90 truncate">SaaS Admin</span>
                </div>
              }
            />
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-sidebar-foreground shrink-0"
            aria-label={t('accessibility.toggleSidebar')}
          >
            <ToggleIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </SidebarHeader>
  );
}