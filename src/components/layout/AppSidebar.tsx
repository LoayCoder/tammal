import React from 'react';
import {
  Users, Building2, CreditCard,
  HelpCircle, Palette, FileText, LayoutDashboard,
  Layers, BarChart3, Network, Building, Download, History, GitBranch,
  MessageSquare, Tags, UserCheck, Sparkles, Calendar, ClipboardList,
  User, Heart, Settings, Package, Brain, SmilePlus, RefreshCw, Wind,
  BookOpen, Music, CheckSquare, BookMarked, Phone, ClipboardCheck,
  ChevronRight, Shield, HeartHandshake, Inbox, Moon, BookOpenCheck, UtensilsCrossed, CalendarDays,
  Activity
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";
import { useTranslation } from 'react-i18next';
import { ThemeLogo } from "@/components/branding/ThemeLogo";
import { ThemeIcon } from "@/components/branding/ThemeIcon";
import type { BrandingConfig } from "@/hooks/branding/useBranding";
import { useUserPermissions, useHasRole } from '@/hooks/auth/useUserPermissions';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useSpiritualPreferences } from '@/hooks/spiritual/useSpiritualPreferences';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

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

interface ToolSubItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ToolSection {
  label: string;
  items: ToolSubItem[];
}

interface AppSidebarProps {
  branding: BrandingConfig;
}

export function AppSidebar({ branding }: AppSidebarProps) {
  const { t } = useTranslation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const isRTL = document.documentElement.dir === 'rtl';
  const { isSuperAdmin, isLoading: permLoading } = useUserPermissions();
  const { hasRole: isTenantAdmin } = useHasRole('tenant_admin');
  const { hasEmployeeProfile } = useCurrentEmployee();
  const { preferences, isEnabled: spiritualEnabled, isPrayerEnabled } = useSpiritualPreferences();
  const location = useLocation();

  const isAdmin = isSuperAdmin || isTenantAdmin;

  // Track which mental toolkit sections are open
  const isMentalToolkitActive = location.pathname.startsWith('/mental-toolkit');
  const [toolsOpen, setToolsOpen] = useState(
    isMentalToolkitActive && ['/mental-toolkit/mood-tracker', '/mental-toolkit/thought-reframer', '/mental-toolkit/breathing'].some(p => location.pathname.startsWith(p))
  );
  const [practicesOpen, setPracticesOpen] = useState(
    isMentalToolkitActive && ['/mental-toolkit/journaling', '/mental-toolkit/meditation', '/mental-toolkit/habits'].some(p => location.pathname.startsWith(p))
  );
  const [resourcesOpen, setResourcesOpen] = useState(
    isMentalToolkitActive && ['/mental-toolkit/articles', '/mental-toolkit/assessment'].some(p => location.pathname.startsWith(p))
  );

  const mentalToolkitSections: ToolSection[] = [
    {
      label: t('mentalToolkit.tabs.tools'),
      items: [
        { title: t('mentalToolkit.moodTracker.title'), url: '/mental-toolkit/mood-tracker', icon: SmilePlus },
        { title: t('mentalToolkit.thoughtReframer.title'), url: '/mental-toolkit/thought-reframer', icon: RefreshCw },
        { title: t('mentalToolkit.breathing.title'), url: '/mental-toolkit/breathing', icon: Wind },
      ],
    },
    {
      label: t('mentalToolkit.tabs.practices'),
      items: [
        { title: t('mentalToolkit.journaling.title'), url: '/mental-toolkit/journaling', icon: BookOpen },
        { title: t('mentalToolkit.meditation.title'), url: '/mental-toolkit/meditation', icon: Music },
        { title: t('mentalToolkit.habits.title'), url: '/mental-toolkit/habits', icon: CheckSquare },
      ],
    },
    {
      label: t('mentalToolkit.tabs.resources'),
      items: [
        { title: t('mentalToolkit.articles.title'), url: '/mental-toolkit/articles', icon: BookMarked },
        { title: t('mentalToolkit.quiz.title'), url: '/mental-toolkit/assessment', icon: ClipboardCheck },
      ],
    },
  ];

  const sectionStates = [
    { open: toolsOpen, setOpen: setToolsOpen },
    { open: practicesOpen, setOpen: setPracticesOpen },
    { open: resourcesOpen, setOpen: setResourcesOpen },
  ];

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
        { title: t('nav.moodPathways'), url: "/admin/mood-pathways", icon: Brain },
        { title: t('nav.surveyMonitor'), url: "/admin/survey-monitor", icon: BarChart3 },
        { title: t('nav.checkinMonitor'), url: "/admin/checkin-monitor", icon: Activity },
        { title: t('nav.employeeSurvey'), url: "/employee/survey", icon: ClipboardList, access: 'all' },
      ]
    },
    {
      label: t('nav.wellness'),
      access: 'all',
      items: [
        { title: t('nav.dailyCheckin'), url: "/", icon: Heart, access: 'employee' },
        { title: t('crisisSupport.nav.crisisSupport'), url: "/crisis-support", icon: Phone, access: 'employee' },
        { title: t('crisisSupport.nav.mySupport'), url: "/my-support", icon: Inbox, access: 'employee' },
        { title: t('crisisSupport.nav.firstAider'), url: "/first-aider", icon: HeartHandshake, access: 'employee' },
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
        { title: t('crisisSupport.admin.title'), url: "/admin/crisis-settings", icon: Shield, access: 'admin' },
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
      if (group.access === 'employee') return hasEmployeeProfile;
      return false;
    })
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        const itemAccess = item.access ?? group.access;
        if (itemAccess === 'all') return true;
        if (itemAccess === 'admin') return isAdmin;
        if (itemAccess === 'employee') return hasEmployeeProfile;
        return false;
      })
    }))
    .filter(group => group.items.length > 0);

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" side={isRTL ? "right" : "left"}>
      <SidebarHeader className="p-4">
        <div className="glass-card border-0 rounded-xl p-3 flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.08)]">
          {isCollapsed ? (
            <ThemeIcon
              iconLightUrl={branding.icon_light_url}
              iconDarkUrl={branding.icon_dark_url}
              className="h-10 w-10 object-contain mx-auto drop-shadow-sm"
              alt={t('branding.themeIcon')}
              fallback={<Building className="h-10 w-10 text-sidebar-foreground" />}
            />
          ) : (
            <ThemeLogo
              logoUrl={branding.logo_url}
              logoLightUrl={branding.logo_light_url}
              logoDarkUrl={branding.logo_dark_url}
              className="h-10 max-w-full object-contain drop-shadow-sm"
              alt={t('branding.themeLogo')}
              fallback={
                <div className="flex items-center gap-2">
                  <Building className="h-7 w-7 text-sidebar-foreground" />
                  <span className="font-semibold text-sidebar-foreground">SaaS Admin</span>
                </div>
              }
            />
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-4">
        {/* Regular menu groups */}
        {filteredGroups.map((group) => {
          const isWellnessGroup = group.label === t('nav.wellness');
          const isGroupActive = group.items.some(item => 
            item.url === '/' ? location.pathname === '/' : location.pathname.startsWith(item.url)
          ) || (isWellnessGroup && location.pathname.startsWith('/mental-toolkit'));

          return (
            <React.Fragment key={group.label}>
            <SidebarGroup>
              <Collapsible defaultOpen={isGroupActive || isCollapsed} className="group/collapsible-group">
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center justify-between">
                    {group.label}
                    {!isCollapsed && (
                      <ChevronRight className="h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible-group:rotate-90 rtl:-scale-x-100" />
                    )}
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild tooltip={item.title}>
                            <NavLink
                              to={item.url}
                              end={item.url === '/'}
                              className="flex items-center gap-2"
                              activeClassName="glass-active text-sidebar-primary"
                              onClick={handleNavClick}
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                      {/* Mental Toolkit collapsible sections inside Wellness */}
                      {isWellnessGroup && mentalToolkitSections.map((section, sectionIdx) => {
                        const { open, setOpen } = sectionStates[sectionIdx];
                        const isSectionActive = section.items.some(i => location.pathname.startsWith(i.url));

                        if (isCollapsed) {
                          return section.items.map((item) => (
                            <SidebarMenuItem key={item.url}>
                              <SidebarMenuButton asChild tooltip={item.title}>
                                <NavLink
                                  to={item.url}
                                  className="flex items-center gap-2"
                                  activeClassName="glass-active text-sidebar-primary"
                                  onClick={handleNavClick}
                                >
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ));
                        }

                        return (
                          <Collapsible
                            key={section.label}
                            open={open}
                            onOpenChange={setOpen}
                            className="group/collapsible"
                          >
                            <SidebarMenuItem>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuButton
                                  className={isSectionActive ? "glass-active text-sidebar-primary" : ""}
                                  tooltip={section.label}
                                >
                                  <span className="flex-1 text-start text-xs font-medium">{section.label}</span>
                                  <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:-scale-x-100" />
                                </SidebarMenuButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <SidebarMenuSub>
                                  {section.items.map((item) => (
                                    <SidebarMenuSubItem key={item.url}>
                                      <SidebarMenuSubButton asChild>
                                        <NavLink
                                          to={item.url}
                                          className="flex items-center gap-2"
                                          activeClassName="glass-active text-sidebar-primary font-medium"
                                          onClick={handleNavClick}
                                        >
                                          <item.icon className="h-3.5 w-3.5 shrink-0" />
                                          <span>{item.title}</span>
                                        </NavLink>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  ))}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </SidebarMenuItem>
                          </Collapsible>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
            {/* Spiritual Wellbeing — rendered right after Wellness */}
            {isWellnessGroup && spiritualEnabled && (
              <SidebarGroup>
                <Collapsible defaultOpen={location.pathname.startsWith('/spiritual') || isCollapsed} className="group/collapsible-group">
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex w-full items-center justify-between">
                      {t('spiritual.nav.title')}
                      {!isCollapsed && (
                        <ChevronRight className="h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible-group:rotate-90 rtl:-scale-x-100" />
                      )}
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {isPrayerEnabled && (
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip={t('spiritual.nav.prayerTracker')}>
                              <NavLink
                                to="/spiritual/prayer"
                                className="flex items-center gap-2"
                                activeClassName="glass-active text-sidebar-primary"
                                onClick={handleNavClick}
                              >
                                <Moon className="h-4 w-4" />
                                <span>{t('spiritual.nav.prayerTracker')}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )}
                        {preferences?.quran_enabled && (
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip={t('spiritual.nav.quranReader')}>
                              <NavLink
                                to="/spiritual/quran"
                                className="flex items-center gap-2"
                                activeClassName="glass-active text-sidebar-primary"
                                onClick={handleNavClick}
                              >
                                <BookOpenCheck className="h-4 w-4" />
                                <span>{t('spiritual.nav.quranReader')}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )}
                        {preferences?.fasting_enabled && (
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip={t('spiritual.nav.sunnahFasting')}>
                              <NavLink
                                to="/spiritual/fasting"
                                className="flex items-center gap-2"
                                activeClassName="glass-active text-sidebar-primary"
                                onClick={handleNavClick}
                              >
                                <UtensilsCrossed className="h-4 w-4" />
                                <span>{t('spiritual.nav.sunnahFasting')}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )}
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild tooltip={t('spiritual.nav.calendar')}>
                            <NavLink
                              to="/spiritual/calendar"
                              className="flex items-center gap-2"
                              activeClassName="glass-active text-sidebar-primary"
                              onClick={handleNavClick}
                            >
                              <CalendarDays className="h-4 w-4" />
                              <span>{t('spiritual.nav.calendar')}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild tooltip={t('spiritual.nav.insights')}>
                            <NavLink
                              to="/spiritual/insights"
                              className="flex items-center gap-2"
                              activeClassName="glass-active text-sidebar-primary"
                              onClick={handleNavClick}
                            >
                              <Sparkles className="h-4 w-4" />
                              <span>{t('spiritual.nav.insights')}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}
          </React.Fragment>
          );
        })}

      </SidebarContent>
    </Sidebar>
  );
}
