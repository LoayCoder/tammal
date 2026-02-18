import {
  Users, Building2, CreditCard,
  HelpCircle, Palette, FileText, LayoutDashboard,
  Layers, BarChart3, Network, Building, Download, History, GitBranch,
  MessageSquare, Tags, UserCheck, Sparkles, Calendar, ClipboardList,
  User, Heart, Settings, Package
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useTranslation } from 'react-i18next';
import { ThemeLogo } from "@/components/branding/ThemeLogo";
import { ThemeIcon } from "@/components/branding/ThemeIcon";
import type { BrandingConfig } from "@/hooks/useBranding";
import { useUserPermissions, useHasRole } from '@/hooks/useUserPermissions';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';

type MenuAccess = 'all' | 'admin' | 'employee';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  access?: MenuAccess;
}

interface MenuGroup {
  label: string;
  access: MenuAccess;
  items: MenuItem[];
}

interface AppSidebarProps {
  branding: BrandingConfig;
}

export function AppSidebar({ branding }: AppSidebarProps) {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { isSuperAdmin, isLoading: permLoading } = useUserPermissions();
  const isTenantAdmin = useHasRole('tenant_admin');
  const { hasEmployeeProfile } = useCurrentEmployee();

  const isAdmin = isSuperAdmin || isTenantAdmin;

  const menuItems: MenuGroup[] = [
    {
      label: t('nav.dashboard'),
      access: 'all',
      items: [
        { title: t('nav.overview'), url: "/", icon: LayoutDashboard },
      ]
    },
    {
      label: t('nav.saasManagement'),
      access: 'admin',
      items: [
        { title: t('nav.tenantManagement'), url: "/admin/tenants", icon: Building2 },
        { title: t('nav.planManagement'), url: "/admin/plans", icon: Layers },
        { title: t('nav.subscriptionManagement'), url: "/admin/subscriptions", icon: CreditCard },
      ]
    },
    {
      label: t('nav.surveySystem'),
      access: 'admin',
      items: [
        { title: t('nav.questions'), url: "/admin/questions", icon: MessageSquare },
        { title: t('nav.aiGenerator'), url: "/admin/questions/generate", icon: Sparkles },
        { title: t('nav.schedules'), url: "/admin/schedules", icon: Calendar },
        { title: t('nav.categories'), url: "/admin/question-categories", icon: Tags },
        { title: t('nav.subcategories'), url: "/admin/question-subcategories", icon: GitBranch },
        { title: t('nav.employeeSurvey'), url: "/employee/survey", icon: ClipboardList, access: 'all' },
      ]
    },
    {
      label: t('nav.wellness'),
      access: 'employee',
      items: [
        { title: t('nav.dailyCheckin'), url: "/", icon: Heart },
      ]
    },
    {
      label: t('nav.operations'),
      access: 'admin',
      items: [
        { title: t('nav.userManagement'), url: "/admin/user-management", icon: Users },
        { title: t('nav.orgStructure'), url: "/admin/org", icon: Network },
      ]
    },
    {
      label: t('nav.settings'),
      access: 'all',
      items: [
        { title: t('nav.userProfile'), url: "/settings/profile", icon: User },
        { title: t('nav.usageBilling'), url: "/settings/usage", icon: BarChart3, access: 'admin' },
        { title: t('nav.brandManagement'), url: "/admin/branding", icon: Palette, access: 'admin' },
        { title: t('nav.documentSettings'), url: "/admin/docs", icon: FileText, access: 'admin' },
        { title: t('nav.auditLogs'), url: "/admin/audit-logs", icon: History, access: 'admin' },
      ]
    },
    {
      label: t('nav.help'),
      access: 'all',
      items: [
        { title: t('nav.support'), url: "/support", icon: HelpCircle },
        { title: t('nav.installApp'), url: "/install", icon: Download },
      ]
    }
  ];

  // Filter groups and items by role
  const filteredGroups = menuItems
    .filter(group => {
      if (group.access === 'all') return true;
      if (group.access === 'admin') return isAdmin;
      if (group.access === 'employee') return hasEmployeeProfile || isAdmin;
      return false;
    })
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        const itemAccess = item.access ?? group.access;
        if (itemAccess === 'all') return true;
        if (itemAccess === 'admin') return isAdmin;
        if (itemAccess === 'employee') return hasEmployeeProfile || isAdmin;
        return false;
      })
    }))
    .filter(group => group.items.length > 0);

  return (
    <Sidebar variant="sidebar" collapsible="icon" side="left">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {isCollapsed ? (
          <ThemeIcon
            iconLightUrl={branding.icon_light_url}
            iconDarkUrl={branding.icon_dark_url}
            className="h-8 w-8 object-contain mx-auto"
            alt={t('branding.themeIcon')}
            fallback={<Building className="h-8 w-8 text-sidebar-foreground" />}
          />
        ) : (
          <ThemeLogo
            logoUrl={branding.logo_url}
            logoLightUrl={branding.logo_light_url}
            logoDarkUrl={branding.logo_dark_url}
            className="h-8 max-w-full object-contain"
            alt={t('branding.themeLogo')}
            fallback={
              <div className="flex items-center gap-2">
                <Building className="h-6 w-6 text-sidebar-foreground" />
                <span className="font-semibold text-sidebar-foreground">SaaS Admin</span>
              </div>
            }
          />
        )}
      </SidebarHeader>
      <SidebarContent className="pt-4">
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end={item.url === '/'}
                        className="flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
