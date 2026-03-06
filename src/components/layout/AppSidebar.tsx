import React, { useState, useCallback, useRef } from 'react';
import {
  Users, Building2, CreditCard,
  HelpCircle, Palette, FileText, LayoutDashboard,
  Layers, BarChart3, Network, Building, Download, History, GitBranch,
  MessageSquare, Tags, UserCheck, Sparkles, Calendar, ClipboardList,
  User, Heart, Settings, Package, Brain, SmilePlus, RefreshCw, Wind,
  BookOpen, Music, CheckSquare, BookMarked, Phone, ClipboardCheck,
  ChevronRight, Shield, HeartHandshake, Inbox, Moon, BookOpenCheck, UtensilsCrossed, CalendarDays,
  Activity, Target, Gauge, Users2, Plug, Trophy, Award, Star, Vote, Coins, Gift, UserCog, Briefcase, BarChart,
  ListChecks, AlertTriangle, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NavLink } from "@/components/NavLink";
import { useTranslation } from 'react-i18next';
import { ThemeLogo } from "@/components/branding/ThemeLogo";
import { ThemeIcon } from "@/components/branding/ThemeIcon";
import type { BrandingConfig } from "@/hooks/branding/useBranding";
import { useUserPermissions, useHasRole } from '@/hooks/auth/useUserPermissions';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useSpiritualPreferences } from '@/hooks/spiritual/useSpiritualPreferences';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SidebarPopup } from './sidebar/SidebarPopup';
import { UserProfileSection } from './sidebar/UserProfileSection';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type MenuAccess = 'all' | 'admin' | 'employee';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  access?: MenuAccess;
  badge?: number;
}

interface MenuGroup {
  label: string;
  access: MenuAccess;
  icon: React.ComponentType<{ className?: string }>;
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
  const { state, isMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const isRTL = document.documentElement.dir === 'rtl';
  const { isSuperAdmin, isPending: permLoading } = useUserPermissions();
  const { hasRole: isTenantAdmin } = useHasRole('tenant_admin');
  const { hasEmployeeProfile } = useCurrentEmployee();
  const { preferences, isEnabled: spiritualEnabled, isPrayerEnabled } = useSpiritualPreferences();
  const location = useLocation();

  const { hasRole: isManager } = useHasRole('manager');
  const isAdmin = isSuperAdmin || isTenantAdmin;
  const isManagerOrAdmin = isAdmin || isManager;

  // Hover popup state for collapsed mode
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [popupAnchorRect, setPopupAnchorRect] = useState<DOMRect | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleGroupHoverEnter = useCallback((label: string, el: HTMLElement) => {
    if (!isCollapsed) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredGroup(label);
    setPopupAnchorRect(el.getBoundingClientRect());
  }, [isCollapsed]);

  const handleGroupHoverLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredGroup(null);
      setPopupAnchorRect(null);
    }, 150);
  }, []);

  const handlePopupClose = useCallback(() => {
    setHoveredGroup(null);
    setPopupAnchorRect(null);
  }, []);

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
      icon: LayoutDashboard,
      items: [
        { title: t('nav.overview'), url: "/", icon: LayoutDashboard },
      ]
    },
    {
      label: t('nav.saasManagement'),
      access: 'admin',
      icon: Building2,
      items: [
        { title: t('nav.tenantManagement'), url: "/admin/tenants", icon: Building2 },
        { title: t('nav.planManagement'), url: "/admin/plans", icon: Layers },
        { title: t('nav.subscriptionManagement'), url: "/admin/subscriptions", icon: CreditCard },
      ]
    },
    {
      label: t('nav.surveySystem'),
      access: 'admin',
      icon: ClipboardList,
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
      icon: Heart,
      items: [
        { title: t('nav.dailyCheckin'), url: "/", icon: Heart, access: 'employee' },
      ]
    },
    {
      label: t('crisisSupport.nav.firstAider'),
      access: 'employee',
      icon: HeartHandshake,
      items: [
        { title: t('crisisSupport.nav.crisisSupport'), url: "/crisis-support", icon: Phone, access: 'employee' },
        { title: t('crisisSupport.nav.mySupport'), url: "/my-support", icon: Inbox, access: 'employee' },
        { title: t('crisisSupport.nav.firstAider'), url: "/first-aider", icon: HeartHandshake, access: 'employee' },
        { title: t('crisisSupport.admin.title'), url: "/admin/crisis-settings", icon: Shield, access: 'admin' },
      ]
    },
    {
      label: t('nav.workloadIntelligence'),
      access: 'all',
      icon: Target,
      items: [
        { title: t('nav.myWorkload'), url: "/my-workload", icon: ClipboardList, access: 'employee' },
        { title: t('nav.objectives'), url: "/admin/workload/objectives", icon: Target, access: 'all' },
        { title: t('nav.workloadDashboard'), url: "/admin/workload/dashboard", icon: Gauge, access: 'admin' },
        { title: t('nav.teamWorkload'), url: "/admin/workload/team", icon: Users2, access: 'admin' },
        { title: t('nav.taskConnectors'), url: "/admin/workload/connectors", icon: Plug, access: 'all' },
        { title: t('nav.representativeWorkload'), url: "/admin/workload/representative", icon: UserCog, access: 'all' },
        { title: t('nav.portfolio'), url: "/admin/workload/portfolio", icon: Briefcase, access: 'admin' },
        { title: t('nav.executive'), url: "/admin/workload/executive", icon: BarChart, access: 'admin' },
        { title: t('nav.taskAnalytics'), url: "/tasks/analytics", icon: BarChart, access: 'admin' },
        { title: t('nav.recurringTasks'), url: "/tasks/recurring", icon: RefreshCw, access: 'admin' },
        { title: t('nav.overdueTasks'), url: "/admin/workload/overdue", icon: AlertTriangle, access: 'admin' },
        { title: t('nav.escalationSettings'), url: "/admin/workload/escalation", icon: Shield, access: 'admin' },
        { title: t('nav.systemHealth'), url: "/admin/workload/system-health", icon: Shield, access: 'admin' },
      ]
    },
    {
      label: t('nav.recognitionAwards'),
      access: 'all',
      icon: Trophy,
      items: [
        { title: t('nav.recognition'), url: "/admin/recognition", icon: Trophy, access: 'admin' },
        { title: t('recognition.results.navTitle'), url: "/admin/recognition/results", icon: BarChart3, access: 'admin' },
        { title: t('recognition.points.managementNav'), url: "/admin/recognition/redemption", icon: Gift, access: 'admin' },
        { title: t('recognition.nominations.nominate'), url: "/recognition/nominate", icon: Award, access: 'employee' },
        { title: t('recognition.nominations.myNominations'), url: "/recognition/my-nominations", icon: Star, access: 'employee' },
        { title: t('recognition.voting.title'), url: "/recognition/vote", icon: Vote, access: 'employee' },
        { title: t('recognition.points.myPoints'), url: "/recognition/points", icon: Coins, access: 'employee' },
        { title: t('recognition.points.rewards'), url: "/recognition/rewards", icon: Gift, access: 'employee' },
      ]
    },
    {
      label: t('nav.aiPlatform'),
      access: 'admin',
      icon: Brain,
      items: [
        { title: t('nav.aiGovernance'), url: "/admin/ai-governance", icon: Gauge },
      ]
    },
    {
      label: t('nav.operations'),
      access: 'admin',
      icon: Network,
      items: [
        { title: t('nav.userManagement'), url: "/admin/user-management", icon: Users },
        { title: t('nav.orgStructure'), url: "/admin/org", icon: Network },
      ]
    },
    {
      label: t('nav.settings'),
      access: 'all',
      icon: Settings,
      items: [
        { title: t('nav.userProfile'), url: "/settings/profile", icon: User },
        { title: t('nav.usageBilling'), url: "/settings/usage", icon: BarChart3, access: 'admin' },
        { title: t('nav.brandManagement'), url: "/admin/branding", icon: Palette, access: 'admin' },
        { title: t('nav.documentSettings'), url: "/admin/docs", icon: FileText, access: 'admin' },
        { title: t('crisisSupport.admin.title'), url: "/admin/crisis-settings", icon: Shield, access: 'admin' },
        { title: t('nav.auditLogs'), url: "/admin/audit-logs", icon: History, access: 'admin' },
      ]
    },
    {
      label: t('nav.help'),
      access: 'all',
      icon: HelpCircle,
      items: [
        { title: t('nav.support'), url: "/support", icon: HelpCircle },
        { title: t('nav.installApp'), url: "/install", icon: Download },
      ]
    }
  ];

  // Track which top-level groups are open (collapsible)
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    menuItems.forEach(group => {
      if (group.items.some(item => {
        if (item.url === '/') return location.pathname === '/';
        return location.pathname.startsWith(item.url);
      })) {
        initial.add(group.label);
      }
    });
    if (isMentalToolkitActive) {
      initial.add(t('nav.wellness'));
    }
    if (location.pathname.startsWith('/spiritual')) {
      initial.add('__spiritual__');
    }
    return initial;
  });

  const toggleGroup = useCallback((label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);


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
        if (itemAccess === 'admin') return isManagerOrAdmin;
        if (itemAccess === 'employee') return hasEmployeeProfile;
        return false;
      })
    }))
    .filter(group => group.items.length > 0);

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
    handlePopupClose();
  };

  const isItemActive = (url: string) => {
    if (url === '/') return location.pathname === '/';
    return location.pathname.startsWith(url);
  };

  const ToggleIcon = isCollapsed
    ? (isRTL ? ChevronsLeft : ChevronsRight)
    : (isRTL ? ChevronsRight : ChevronsLeft);

  return (
    <Sidebar variant="sidebar" collapsible="icon" side={isRTL ? "right" : "left"}>
      {/* Header with logo and toggle */}
      <SidebarHeader className="px-3 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center flex-1">
            {isCollapsed ? (
              <ThemeIcon
                iconLightUrl={branding.icon_light_url}
                iconDarkUrl={branding.icon_dark_url}
                className="h-9 w-9 object-contain shrink-0"
                alt={t('branding.themeIcon')}
                fallback={<Building className="h-8 w-8 text-sidebar-foreground/70" />}
              />
            ) : (
              <ThemeLogo
                logoUrl={branding.logo_url}
                logoLightUrl={branding.logo_light_url}
                logoDarkUrl={branding.logo_dark_url}
                className="h-10 max-w-[180px] object-contain"
                alt={t('branding.themeLogo')}
                fallback={
                  <div className="flex items-center gap-2">
                    <Building className="h-6 w-6 text-sidebar-foreground/70" />
                    <span className="font-semibold text-base text-sidebar-foreground/90">SaaS Admin</span>
                  </div>
                }
              />
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-sidebar-foreground"
              aria-label={t('accessibility.toggleSidebar')}
            >
              <ToggleIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-1 px-2">
              {filteredGroups.map((group) => {
          const isWellnessGroup = group.label === t('nav.wellness');
          const isGroupActive = group.items.some(item => isItemActive(item.url))
            || (isWellnessGroup && location.pathname.startsWith('/mental-toolkit'));
          const isSingleItem = group.items.length === 1 && !isWellnessGroup;
          const isGroupOpen = openGroups.has(group.label);

          return (
            <React.Fragment key={group.label}>
              <SidebarGroup className="px-0 py-0">
                {/* Collapsed: show group icon with hover popup */}
                {isCollapsed && (
                  <div
                    className="flex justify-center py-2"
                    onMouseEnter={(e) => handleGroupHoverEnter(group.label, e.currentTarget)}
                    onMouseLeave={handleGroupHoverLeave}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                            isGroupActive
                              ? "bg-[hsl(var(--sidebar-active-bg))] text-sidebar-primary"
                              : "text-sidebar-foreground/60 hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-sidebar-foreground"
                          )}
                          aria-label={group.label}
                        >
                          <group.icon className="h-5 w-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side={isRTL ? 'left' : 'right'} className="text-xs">
                        {group.label}
                      </TooltipContent>
                    </Tooltip>
                    {hoveredGroup === group.label && (
                      <SidebarPopup
                        label={group.label}
                        items={group.items}
                        anchorRect={popupAnchorRect}
                        onClose={handlePopupClose}
                        onNavClick={handleNavClick}
                      />
                    )}
                  </div>
                )}

                {/* Expanded: single-item groups render as direct links */}
                {!isCollapsed && isSingleItem && (
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-0.5 px-1">
                      <SidebarMenuItem>
                        <NavLink
                          to={group.items[0].url}
                          end={group.items[0].url === '/'}
                          className={cn(
                            "flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-all duration-200",
                            "text-sidebar-foreground hover:bg-[hsl(var(--sidebar-hover-bg))]"
                          )}
                          activeClassName="bg-[hsl(var(--sidebar-active-bg))] text-sidebar-primary font-medium"
                          onClick={handleNavClick}
                        >
                          <group.icon className="h-5 w-5 shrink-0" />
                          <span className="truncate">{group.items[0].title}</span>
                        </NavLink>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}

                {/* Expanded: multi-item groups render as collapsible */}
                {!isCollapsed && !isSingleItem && (
                  <Collapsible
                    open={isGroupOpen}
                    onOpenChange={() => toggleGroup(group.label)}
                    className="group/collapsible"
                  >
                    {/* Group trigger row */}
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition-all duration-200",
                          isGroupActive
                            ? "text-sidebar-primary font-medium"
                            : "text-sidebar-foreground hover:bg-[hsl(var(--sidebar-hover-bg))]"
                        )}
                      >
                        <group.icon className="h-5 w-5 shrink-0" />
                        <span className="flex-1 text-start truncate">{group.label}</span>
                        {isGroupActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary shrink-0" />
                        )}
                        <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:-scale-x-100" />
                      </button>
                    </CollapsibleTrigger>

                    {/* Sub-items with dot bullets */}
                    <CollapsibleContent>
                      <div className="ms-7 mt-0.5 flex flex-col gap-0.5">
                        {group.items.map((item) => {
                          const active = isItemActive(item.url);
                          return (
                            <NavLink
                              key={item.url}
                              to={item.url}
                              end={item.url === '/'}
                              className={cn(
                                "flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors",
                                "text-sidebar-foreground hover:bg-[hsl(var(--sidebar-hover-bg))]"
                              )}
                              activeClassName="text-sidebar-primary font-medium"
                              onClick={handleNavClick}
                            >
                              <span className={cn(
                                "h-1.5 w-1.5 rounded-full shrink-0",
                                active ? "bg-sidebar-primary" : "bg-muted-foreground/40"
                              )} />
                              <span className="truncate">{item.title}</span>
                              {item.badge && (
                                <span className="ms-auto inline-flex items-center rounded-lg bg-sidebar-primary px-1.5 py-0.5 text-xs font-medium text-sidebar-primary-foreground">
                                  {item.badge}
                                </span>
                              )}
                            </NavLink>
                          );
                        })}

                        {/* Mental Toolkit nested sections inside Wellness */}
                        {isWellnessGroup && mentalToolkitSections.map((section, sectionIdx) => {
                          const { open, setOpen } = sectionStates[sectionIdx];
                          const isSectionActive = section.items.some(i => location.pathname.startsWith(i.url));

                          return (
                            <Collapsible
                              key={section.label}
                              open={open}
                              onOpenChange={setOpen}
                              className="group/nested"
                            >
                              <CollapsibleTrigger asChild>
                                <button
                                  className={cn(
                                    "flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-sm transition-all duration-200",
                                    isSectionActive
                                      ? "text-sidebar-primary font-medium"
                                      : "text-sidebar-foreground hover:bg-[hsl(var(--sidebar-hover-bg))]"
                                  )}
                                >
                                  <span className={cn(
                                    "h-1.5 w-1.5 rounded-full shrink-0",
                                    isSectionActive ? "bg-sidebar-primary" : "bg-muted-foreground/40"
                                  )} />
                                  <span className="flex-1 text-start text-xs font-medium">{section.label}</span>
                                  <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/nested:rotate-90 rtl:-scale-x-100" />
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="ms-4 mt-0.5 flex flex-col gap-0.5">
                                  {section.items.map((item) => {
                                    const subActive = location.pathname.startsWith(item.url);
                                    return (
                                      <NavLink
                                        key={item.url}
                                        to={item.url}
                                        className={cn(
                                          "flex h-8 items-center gap-2 rounded-lg px-2.5 text-sm transition-colors",
                                          "text-sidebar-foreground hover:bg-[hsl(var(--sidebar-hover-bg))]"
                                        )}
                                        activeClassName="text-sidebar-primary font-medium"
                                        onClick={handleNavClick}
                                      >
                                        <span className={cn(
                                          "h-1 w-1 rounded-full shrink-0",
                                          subActive ? "bg-sidebar-primary" : "bg-muted-foreground/30"
                                        )} />
                                        <span className="truncate">{item.title}</span>
                                      </NavLink>
                                    );
                                  })}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </SidebarGroup>

              {/* Spiritual Wellbeing — rendered right after Wellness */}
              {isWellnessGroup && spiritualEnabled && (
                 <SidebarGroup className="px-0 py-0">
                  {isCollapsed ? (
                    <div className="flex justify-center py-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                              location.pathname.startsWith('/spiritual')
                                ? "bg-[hsl(var(--sidebar-active-bg))] text-sidebar-primary"
                                : "text-sidebar-foreground/60 hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-sidebar-foreground"
                            )}
                            aria-label={t('spiritual.nav.title')}
                          >
                            <Moon className="h-5 w-5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side={isRTL ? 'left' : 'right'} className="text-xs">
                          {t('spiritual.nav.title')}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ) : (
                    <Collapsible
                      open={openGroups.has('__spiritual__')}
                      onOpenChange={() => toggleGroup('__spiritual__')}
                      className="group/collapsible"
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          className={cn(
                            "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition-all duration-200",
                            location.pathname.startsWith('/spiritual')
                              ? "text-sidebar-primary font-medium"
                              : "text-sidebar-foreground hover:bg-[hsl(var(--sidebar-hover-bg))]"
                          )}
                        >
                          <Moon className="h-5 w-5 shrink-0" />
                          <span className="flex-1 text-start truncate">{t('spiritual.nav.title')}</span>
                          {location.pathname.startsWith('/spiritual') && (
                            <span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary shrink-0" />
                          )}
                          <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:-scale-x-100" />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ms-7 mt-0.5 flex flex-col gap-0.5">
                          {isPrayerEnabled && (
                            <NavLink
                              to="/spiritual/prayer"
                              className={cn(
                                "flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors",
                                "text-sidebar-foreground hover:bg-[hsl(var(--sidebar-hover-bg))]"
                              )}
                              activeClassName="text-sidebar-primary font-medium"
                              onClick={handleNavClick}
                            >
                              <span className={cn(
                                "h-1.5 w-1.5 rounded-full shrink-0",
                                location.pathname === '/spiritual/prayer' ? "bg-sidebar-primary" : "bg-muted-foreground/40"
                              )} />
                              <span>{t('spiritual.nav.prayerTracker')}</span>
                            </NavLink>
                          )}
                          {preferences?.quran_enabled && (
                            <NavLink
                              to="/spiritual/quran"
                              className={cn(
                                "flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors",
                                "text-sidebar-foreground hover:bg-[hsl(var(--sidebar-hover-bg))]"
                              )}
                              activeClassName="text-sidebar-primary font-medium"
                              onClick={handleNavClick}
                            >
                              <span className={cn(
                                "h-1.5 w-1.5 rounded-full shrink-0",
                                location.pathname === '/spiritual/quran' ? "bg-sidebar-primary" : "bg-muted-foreground/40"
                              )} />
                              <span>{t('spiritual.nav.quranReader')}</span>
                            </NavLink>
                          )}
                          {preferences?.fasting_enabled && (
                            <NavLink
                              to="/spiritual/sunnah"
                              className={cn(
                                "flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors",
                                "text-sidebar-foreground hover:bg-[hsl(var(--sidebar-hover-bg))]"
                              )}
                              activeClassName="text-sidebar-primary font-medium"
                              onClick={handleNavClick}
                            >
                              <span className={cn(
                                "h-1.5 w-1.5 rounded-full shrink-0",
                                location.pathname === '/spiritual/sunnah' ? "bg-sidebar-primary" : "bg-muted-foreground/40"
                              )} />
                              <span>{t('spiritual.nav.sunnahTracker')}</span>
                            </NavLink>
                          )}
                          <NavLink
                            to="/spiritual/calendar"
                            className={cn(
                              "flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors",
                              "text-sidebar-foreground hover:bg-[hsl(var(--sidebar-hover-bg))]"
                            )}
                            activeClassName="text-sidebar-primary font-medium"
                            onClick={handleNavClick}
                          >
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              location.pathname === '/spiritual/calendar' ? "bg-sidebar-primary" : "bg-muted-foreground/40"
                            )} />
                            <span>{t('spiritual.nav.calendar')}</span>
                          </NavLink>
                          <NavLink
                            to="/spiritual/insights"
                            className={cn(
                              "flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors",
                              "text-sidebar-foreground hover:bg-[hsl(var(--sidebar-hover-bg))]"
                            )}
                            activeClassName="text-sidebar-primary font-medium"
                            onClick={handleNavClick}
                          >
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              location.pathname === '/spiritual/insights' ? "bg-sidebar-primary" : "bg-muted-foreground/40"
                            )} />
                            <span>{t('spiritual.nav.insights')}</span>
                          </NavLink>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </SidebarGroup>
              )}
            </React.Fragment>
          );
        })}
      </SidebarContent>

      {/* User profile footer */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        {isCollapsed && (
          <div className="flex justify-center">
            <button
              onClick={toggleSidebar}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-sidebar-foreground"
              aria-label={t('accessibility.toggleSidebar')}
            >
              <ToggleIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        <UserProfileSection isCollapsed={isCollapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}
