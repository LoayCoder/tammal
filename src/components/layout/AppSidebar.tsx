import { 
  Users, Building2, CreditCard, 
  Settings, HelpCircle, Palette, FileText, LayoutDashboard,
  Layers, BarChart3, Network
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
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useTranslation } from 'react-i18next';

export function AppSidebar() {
  const { t } = useTranslation();

  const menuItems = [
    {
      label: t('nav.dashboard'),
      items: [
        { title: t('nav.overview'), url: "/", icon: LayoutDashboard },
      ]
    },
    {
      label: t('nav.saasManagement'),
      items: [
        { title: t('nav.tenantManagement'), url: "/admin/tenants", icon: Building2 },
        { title: t('nav.planManagement'), url: "/admin/plans", icon: Layers },
        { title: t('nav.subscriptionManagement'), url: "/admin/subscriptions", icon: CreditCard },
      ]
    },
    {
      label: t('nav.operations'),
      items: [
        { title: t('nav.userManagement'), url: "/admin/users", icon: Users },
        { title: t('nav.orgStructure'), url: "/admin/org", icon: Network },
      ]
    },
    {
      label: t('nav.settings'),
      items: [
        { title: t('nav.usageBilling'), url: "/settings/usage", icon: BarChart3 },
        { title: t('nav.brandManagement'), url: "/admin/branding", icon: Palette },
        { title: t('nav.documentSettings'), url: "/admin/docs", icon: FileText },
      ]
    },
    {
      label: t('nav.help'),
      items: [
        { title: t('nav.support'), url: "/support", icon: HelpCircle },
      ]
    }
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent className="pt-4">
        {menuItems.map((group) => (
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
