import { SidebarTrigger } from "@/shared/components/ui/sidebar";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { LanguageSelector } from "@/shared/components/LanguageSelector";
import { UserMenu } from "@/shared/components/UserMenu";
import { UnifiedNotificationBell } from "@/components/notifications/UnifiedNotificationBell";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import { useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppNavigation } from "@/hooks/navigation/useAppNavigation";

export function Header() {
  const location = useLocation();
  const { t } = useTranslation();
  const { menuItems, mentalToolkitSections, spiritualItems } = useAppNavigation();

  const getBreadcrumbs = () => {
    const currentPath = location.pathname;
    
    if (currentPath === '/') {
      return [{ label: t('nav.overview'), path: '/' }];
    }
    
    const breadcrumbs = [{ label: t('nav.dashboard'), path: '/' }];
    
    // 1. Search in Mental Toolkit
    if (currentPath.startsWith('/mental-toolkit')) {
      for (const section of mentalToolkitSections) {
        for (const item of section.items) {
          if (currentPath.startsWith(item.url)) {
            breadcrumbs.push({ label: t('nav.wellness'), path: '#' });
            breadcrumbs.push({ label: item.title, path: currentPath });
            return breadcrumbs;
          }
        }
      }
    }
    
    // 2. Search in Spiritual Wellbeing
    if (currentPath.startsWith('/spiritual')) {
      for (const item of spiritualItems) {
        if (currentPath.startsWith(item.url)) {
          breadcrumbs.push({ label: t('nav.wellness'), path: '#' });
          breadcrumbs.push({ label: t('spiritual.nav.title'), path: '#' });
          breadcrumbs.push({ label: item.title, path: currentPath });
          return breadcrumbs;
        }
      }
    }

    // 3. Search in standard Menu Items
    for (const group of menuItems) {
      for (const item of group.items) {
        if (item.url !== '/' && currentPath.startsWith(item.url)) {
          if (group.label !== item.title) {
            breadcrumbs.push({ label: group.label, path: '#' });
          }
          breadcrumbs.push({ label: item.title, path: currentPath });
          return breadcrumbs;
        }
      }
    }

    // 4. Fallback for custom or direct routes without a sidebar mapping
    const paths = currentPath.split('/').filter(Boolean);
    let cumulativePath = '';
    paths.forEach(p => {
      cumulativePath += `/${p}`;
      const formattedPath = p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ');
      breadcrumbs.push({ label: formattedPath, path: cumulativePath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const currentPageTitle = breadcrumbs[breadcrumbs.length - 1]?.label;

  return (
    <header className="glass-header sticky top-0 z-50 flex h-14 items-center gap-2 md:gap-4 px-2 md:px-4">
      <SidebarTrigger className="-ms-1 md:-ms-2 min-w-[32px] md:min-w-[44px] min-h-[32px] md:min-h-[44px]" />
      
      {/* Mobile: simple page title */}
      <span className="md:hidden text-xs sm:text-sm font-semibold truncate flex-1">{currentPageTitle}</span>

      {/* Desktop: breadcrumbs */}
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={`crumb-${index}-${crumb.path}`}>
              {index < breadcrumbs.length - 1 ? (
                <>
                  {crumb.path === '#' ? (
                    <span className="font-medium text-muted-foreground">{crumb.label}</span>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.path}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                  <BreadcrumbSeparator />
                </>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ms-auto flex items-center gap-0.5 sm:gap-2">
        <UnifiedNotificationBell />
        <LanguageSelector />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

