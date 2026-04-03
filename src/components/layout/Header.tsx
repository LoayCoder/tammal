import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { UserMenu } from "@/components/UserMenu";
import { UnifiedNotificationBell } from "@/components/notifications/UnifiedNotificationBell";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ThemeIcon } from "@/components/branding/ThemeIcon";
import type { BrandingConfig } from "@/hooks/branding/useBranding";

interface HeaderProps {
  branding?: BrandingConfig;
}

export function Header({ branding }: HeaderProps) {
  const location = useLocation();
  const { t } = useTranslation();

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) {
      return [{ label: t('nav.overview'), path: '/' }];
    }
    
    const breadcrumbs = [{ label: t('nav.dashboard'), path: '/' }];
    
    const routeLabels: Record<string, string> = {
      'admin': t('nav.saasManagement'),
      'tenants': t('nav.tenantManagement'),
      'plans': t('nav.planManagement'),
      'subscriptions': t('nav.subscriptionManagement'),
      'users': t('nav.userManagement'),
      'org': t('nav.orgStructure'),
      'settings': t('nav.settings'),
      'usage': t('nav.usageBilling'),
      'branding': t('nav.brandManagement'),
      'docs': t('nav.documentSettings'),
      'support': t('nav.support'),
      'auth': t('auth.login'),
    };

    let currentPath = '';
    paths.forEach((path) => {
      currentPath += `/${path}`;
      if (routeLabels[path]) {
        breadcrumbs.push({ label: routeLabels[path], path: currentPath });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const currentPageTitle = breadcrumbs[breadcrumbs.length - 1]?.label;

  return (
    <header className="glass-header sticky top-0 z-50 flex h-14 items-center gap-4 px-4">
      {/* Desktop: sidebar trigger */}
      <SidebarTrigger className="-ms-2 min-w-[44px] min-h-[44px] hidden md:flex" />

      {/* Mobile: app icon instead of sidebar trigger */}
      <div className="md:hidden shrink-0">
        <ThemeIcon
          iconLightUrl={branding?.icon_light_url}
          iconDarkUrl={branding?.icon_dark_url}
          className="h-7 w-7 rounded-lg object-contain"
          alt="App"
          fallback={<span className="text-sm font-bold text-primary">T</span>}
        />
      </div>

      {/* Mobile: simple page title */}
      <span className="md:hidden text-sm font-semibold truncate">{currentPageTitle}</span>

      {/* Desktop: breadcrumbs */}
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={crumb.path}>
              {index < breadcrumbs.length - 1 ? (
                <>
                  <BreadcrumbLink asChild>
                    <Link to={crumb.path}>{crumb.label}</Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ms-auto flex items-center gap-1 md:gap-2">
        <UnifiedNotificationBell />
        <LanguageSelector />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
