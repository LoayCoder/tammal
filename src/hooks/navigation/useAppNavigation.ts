import { useTranslation } from 'react-i18next';
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

export type MenuAccess = 'all' | 'admin' | 'employee';

export interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  access?: MenuAccess;
  badge?: number;
}

export interface MenuGroup {
  label: string;
  access: MenuAccess;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
}

export interface ToolSubItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ToolSection {
  label: string;
  items: ToolSubItem[];
}

export function useAppNavigation() {
  const { t } = useTranslation();

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
        { title: t('nav.componentSandbox', 'Component Sandbox'), url: "/dev/components", icon: Package },
        { title: t('nav.designSystem', 'Design System'), url: "/dev/design-system", icon: Palette },
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
      items: []
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
        { title: t('recognition.monitor.navTitle'), url: "/admin/recognition/monitor", icon: Activity, access: 'admin' },
        { title: t('recognition.results.navTitle'), url: "/admin/recognition/results", icon: BarChart3, access: 'admin' },
        { title: t('recognition.points.managementNav'), url: "/admin/recognition/redemption", icon: Gift, access: 'admin' },
        
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

  const spiritualItems = [
    { title: t('spiritual.nav.prayerTracker'), url: '/spiritual/prayer' },
    { title: t('spiritual.nav.quranReader'), url: '/spiritual/quran' },
    { title: t('spiritual.nav.sunnahTracker'), url: '/spiritual/sunnah' },
    { title: t('spiritual.nav.calendar'), url: '/spiritual/calendar' },
    { title: t('spiritual.nav.insights'), url: '/spiritual/insights' },
  ];

  return {
    menuItems,
    mentalToolkitSections,
    spiritualItems
  };
}
