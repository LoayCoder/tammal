import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { UserMenu } from "@/components/UserMenu";
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

export function Header() {
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

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ms-2" />
      
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

      <div className="ms-auto flex items-center gap-2">
        <LanguageSelector />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
