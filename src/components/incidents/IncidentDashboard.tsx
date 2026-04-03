import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Plus,
  ArrowUpRight,
  Calendar,
  User,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { IncidentCategoryCard } from "./IncidentCategoryCard";
import { EvidenceCollectionPanel } from "./EvidenceCollectionPanel";
import { InvestigationWorkflow } from "./InvestigationWorkflow";
import { IncidentEmptyState } from "./IncidentEmptyState";
import type { IncidentCategory } from "@/theme/tokens";
import { spacing, typography, animations } from "@/theme/tokens";

// ── Mock data ────────────────────────────────────────────────────────

const CATEGORY_STATS: Array<{
  category: IncidentCategory;
  count: number;
  openCount: number;
  trend: "up" | "down" | "neutral";
  trendValue: number;
}> = [
  { category: "safety",        count: 12, openCount: 3, trend: "down",    trendValue: 15 },
  { category: "injury",        count: 5,  openCount: 1, trend: "down",    trendValue: 40 },
  { category: "property",      count: 8,  openCount: 2, trend: "neutral", trendValue: 0  },
  { category: "environmental", count: 3,  openCount: 0, trend: "down",    trendValue: 25 },
  { category: "security",      count: 7,  openCount: 2, trend: "up",      trendValue: 12 },
];

const RECENT_INCIDENTS = [
  { id: "INC-0042", title: "Slip hazard near loading dock",        category: "safety"   as IncidentCategory, status: "investigating", priority: "high",   reportedBy: "J. Rivera", date: "Today, 08:45"    },
  { id: "INC-0041", title: "Minor hand laceration — packaging area", category: "injury"  as IncidentCategory, status: "review",        priority: "medium", reportedBy: "M. Chen",   date: "Yesterday, 14:20" },
  { id: "INC-0040", title: "Forklift bumper damage",               category: "property" as IncidentCategory, status: "resolved",      priority: "low",    reportedBy: "A. Patel",  date: "2 days ago"      },
  { id: "INC-0039", title: "Unauthorised access — server room",    category: "security" as IncidentCategory, status: "closed",        priority: "high",   reportedBy: "S. Kim",    date: "3 days ago"      },
];

const STATUS_CLASS: Record<string, string> = {
  reported:      "bg-muted text-muted-foreground",
  review:        "bg-info/10 text-info border-info/20",
  investigating: "bg-warning/10 text-warning border-warning/20",
  resolved:      "bg-success/10 text-success border-success/20",
  closed:        "bg-muted/60 text-muted-foreground",
};

const PRIORITY_DOT: Record<string, string> = {
  high:   "bg-toolkit-coral",
  medium: "bg-toolkit-amber",
  low:    "bg-toolkit-sage",
};

const CATEGORY_COLOR: Record<IncidentCategory, string> = {
  safety:        "text-incident-safety",
  injury:        "text-incident-injury",
  property:      "text-incident-property",
  environmental: "text-incident-environmental",
  security:      "text-incident-security",
};

// ── Stat card ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function StatCard({ label, value, subtext, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="glass-stat rounded-xl p-5 flex items-start gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("w-5 h-5", iconColor)} strokeWidth={1.75} />
      </div>
      <div>
        <p className={typography.statLabel}>{label}</p>
        <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}

// ── Main dashboard ───────────────────────────────────────────────────

interface IncidentDashboardProps {
  showEmptyState?: boolean;
  className?: string;
}

export function IncidentDashboard({ showEmptyState = false, className }: IncidentDashboardProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "investigate" | "evidence">("overview");

  const tabs = [
    { id: "overview"    as const, label: t('incidents.tabs.overview') },
    { id: "investigate" as const, label: t('incidents.tabs.investigation') },
    { id: "evidence"    as const, label: t('incidents.tabs.evidence') },
  ];

  const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    reported:      { label: t('incidents.status.reported'),      className: STATUS_CLASS.reported      },
    review:        { label: t('incidents.status.review'),        className: STATUS_CLASS.review        },
    investigating: { label: t('incidents.status.investigating'), className: STATUS_CLASS.investigating },
    resolved:      { label: t('incidents.status.resolved'),      className: STATUS_CLASS.resolved      },
    closed:        { label: t('incidents.status.closed'),        className: STATUS_CLASS.closed        },
  };

  const PRIORITY_CONFIG: Record<string, { label: string; dot: string }> = {
    high:   { label: t('incidents.priority.high'),   dot: PRIORITY_DOT.high   },
    medium: { label: t('incidents.priority.medium'), dot: PRIORITY_DOT.medium },
    low:    { label: t('incidents.priority.low'),    dot: PRIORITY_DOT.low    },
  };

  return (
    <div className={cn(spacing.pageWrapper, animations.fadeIn, className)}>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className={typography.pageTitle}>{t('incidents.pageTitle')}</h1>
          <p className={cn(typography.subtitle, "mt-1")}>{t('incidents.pageSubtitle')}</p>
        </div>
        <Button className="rounded-xl h-10 px-5 gap-2 shrink-0 font-medium">
          <Plus className="w-4 h-4" />
          {t('incidents.reportButton')}
        </Button>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label={t('incidents.stats.totalOpen')}
          value={8}
          subtext={t('incidents.stats.totalOpenSub')}
          icon={AlertTriangle}
          iconBg="bg-toolkit-amber/15"
          iconColor="text-toolkit-amber"
        />
        <StatCard
          label={t('incidents.stats.resolved')}
          value={23}
          subtext={t('incidents.stats.resolvedSub')}
          icon={CheckCircle2}
          iconBg="bg-success/10"
          iconColor="text-success"
        />
        <StatCard
          label={t('incidents.stats.avgResolution')}
          value="2.4d"
          subtext={t('incidents.stats.avgResolutionSub')}
          icon={Clock}
          iconBg="bg-info/10"
          iconColor="text-info"
        />
        <StatCard
          label={t('incidents.stats.critical')}
          value={2}
          subtext={t('incidents.stats.criticalSub')}
          icon={Zap}
          iconBg="bg-toolkit-coral/12"
          iconColor="text-toolkit-coral"
        />
      </div>

      {/* Category grid */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className={typography.sectionTitle}>{t('incidents.categories')}</h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('incidents.clearFilter')} ×
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORY_STATS.map((stat) => (
            <IncidentCategoryCard
              key={stat.category}
              {...stat}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === stat.category ? null : stat.category
                )
              }
              className={cn(
                selectedCategory && selectedCategory !== stat.category && "opacity-50 scale-[0.98]"
              )}
            />
          ))}
        </div>
      </section>

      {/* Tabs for workflow / evidence */}
      <div className="mb-6">
        <div className="glass-tabs inline-flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="animate-calm-fade-in">
          {showEmptyState || RECENT_INCIDENTS.length === 0 ? (
            <div className="glass-card rounded-xl border-0">
              <IncidentEmptyState
                category={selectedCategory ?? undefined}
                onCreateNew={() => {}}
              />
            </div>
          ) : (
            <div className="glass-card rounded-xl border-0 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <h2 className={typography.cardTitle}>{t('incidents.recentTitle')}</h2>
                <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                  {t('incidents.viewAll')}
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <ul className="divide-y divide-border/40">
                {RECENT_INCIDENTS.filter(
                  (i) => !selectedCategory || i.category === selectedCategory
                ).map((incident) => {
                  const status   = STATUS_CONFIG[incident.status];
                  const priority = PRIORITY_CONFIG[incident.priority];

                  return (
                    <li
                      key={incident.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <div className={cn("w-2 h-2 rounded-full shrink-0", priority.dot)} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">{incident.id}</span>
                          <span className={cn("text-xs font-medium", CATEGORY_COLOR[incident.category])}>
                            {t(`incidents.category.${incident.category}.label`)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground mt-0.5 truncate">
                          {incident.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            {incident.reportedBy}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {incident.date}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn("shrink-0 text-xs rounded-full px-2.5 py-0.5 border", status.className)}
                      >
                        {status.label}
                      </Badge>

                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === "investigate" && (
        <div className="glass-card rounded-xl border-0 p-6 animate-calm-fade-in">
          <InvestigationWorkflow currentStepIndex={2} />
        </div>
      )}

      {activeTab === "evidence" && (
        <div className="glass-card rounded-xl border-0 p-6 animate-calm-fade-in">
          <EvidenceCollectionPanel incidentId="INC-0042" />
        </div>
      )}
    </div>
  );
}
