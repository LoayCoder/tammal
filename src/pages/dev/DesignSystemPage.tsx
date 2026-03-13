import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { StatCard, MetricCard, ChartCard, InsightCard, DashboardGrid, PageHeader } from "@/shared/components/system";
import { EmptyState } from "@/shared/empty/EmptyState";
import { spacing, typography, cardVariants, layout, iconBox } from "@/theme/tokens";
import { DESIGN_SYSTEM } from "@/theme/version";
import { TOOLKIT, ZONE_COLORS } from "@/config/toolkit-colors";
import {
  Palette, Type, Maximize, LayoutGrid, BarChart3,
  TrendingUp, Lightbulb, AlertCircle, CheckCircle, Star,
  Shield, BookOpen, Info
} from "lucide-react";

/* ── Color swatch helper ──────────────────────────────────────── */
function Swatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-12 h-12 rounded-xl border border-border/50 shadow-sm"
        style={{ backgroundColor: `hsl(var(--${cssVar}))` }}
      />
      <span className="text-2xs text-muted-foreground text-center leading-tight">{name}</span>
    </div>
  );
}

function ToolkitSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-12 h-12 rounded-xl border border-border/50 shadow-sm"
        style={{ backgroundColor: value }}
      />
      <span className="text-2xs text-muted-foreground text-center leading-tight">{name}</span>
    </div>
  );
}

/* ── Section wrapper ──────────────────────────────────────────── */
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className={typography.sectionTitle}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ── Governance rule card ─────────────────────────────────────── */
function RuleCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className={cardVariants.glass}>
      <CardHeader className="pb-2">
        <CardTitle className={typography.cardTitle}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">{children}</CardContent>
    </Card>
  );
}

export default function DesignSystemPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-6 sm:px-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Design System</h1>
        <p className={typography.subtitle}>
          Reference guide for colors, typography, spacing, and reusable components.
        </p>
      </div>

      {/* ─── Version Banner ─── */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Design System</span>
          </div>
          <Badge variant="secondary">v{DESIGN_SYSTEM.version}</Badge>
          <span className="text-sm text-muted-foreground">
            Last updated: {DESIGN_SYSTEM.lastUpdated}
          </span>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            — {DESIGN_SYSTEM.description}
          </span>
        </CardContent>
      </Card>

      <Separator />

      {/* ─── 1. Colors ─── */}
      <Section title="Core Colors" icon={<Palette className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardHeader><CardTitle className={typography.cardTitle}>Semantic Palette</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Swatch name="Primary" cssVar="primary" />
            <Swatch name="Secondary" cssVar="secondary" />
            <Swatch name="Accent" cssVar="accent" />
            <Swatch name="Destructive" cssVar="destructive" />
            <Swatch name="Muted" cssVar="muted" />
            <Swatch name="Background" cssVar="background" />
            <Swatch name="Card" cssVar="card" />
            <Swatch name="Border" cssVar="border" />
          </CardContent>
        </Card>

        <Card className={cardVariants.glass}>
          <CardHeader><CardTitle className={typography.cardTitle}>Chart Colors</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {[1,2,3,4,5].map(n => (
              <Swatch key={n} name={`Chart ${n}`} cssVar={`chart-${n}`} />
            ))}
          </CardContent>
        </Card>

        <Card className={cardVariants.glass}>
          <CardHeader><CardTitle className={typography.cardTitle}>Toolkit Palette</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {Object.entries(TOOLKIT).map(([name, value]) => (
              <ToolkitSwatch key={name} name={name} value={value} />
            ))}
          </CardContent>
        </Card>

        <Card className={cardVariants.glass}>
          <CardHeader><CardTitle className={typography.cardTitle}>Zone Colors</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {Object.entries(ZONE_COLORS).map(([name, value]) => (
              <ToolkitSwatch key={name} name={name} value={value} />
            ))}
          </CardContent>
        </Card>
      </Section>

      <Separator />

      {/* ─── 2. Typography ─── */}
      <Section title="Typography" icon={<Type className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard} space-y-4`}>
            {Object.entries(typography).map(([key, classes]) => (
              <div key={key} className="flex items-baseline justify-between gap-4 border-b border-border/30 pb-3 last:border-0">
                <div>
                  <span className={classes}>Sample text</span>
                </div>
                <code className="text-2xs font-mono text-muted-foreground whitespace-nowrap bg-muted/30 px-2 py-0.5 rounded">
                  {key}: "{classes}"
                </code>
              </div>
            ))}
          </CardContent>
        </Card>
      </Section>

      <Separator />

      {/* ─── 3. Spacing Tokens ─── */}
      <Section title="Spacing Tokens" icon={<Maximize className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard} space-y-3`}>
            {Object.entries(spacing).map(([key, classes]) => (
              <div key={key} className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0">
                <span className={typography.cardTitle}>{key}</span>
                <code className="text-2xs font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                  {classes}
                </code>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Spacing rules table */}
        <Card className={cardVariants.glass}>
          <CardHeader><CardTitle className={typography.cardTitle}>Spacing Rules</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-start pb-2 font-medium text-muted-foreground">Token</th>
                    <th className="text-start pb-2 font-medium text-muted-foreground">Value</th>
                    <th className="text-start pb-2 font-medium text-muted-foreground">Usage</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  <tr className="border-b border-border/20"><td className="py-2"><code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">cardCompact</code></td><td className="py-2">p-4</td><td className="py-2 text-muted-foreground">Stat / KPI cards</td></tr>
                  <tr className="border-b border-border/20"><td className="py-2"><code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">cardInteractive</code></td><td className="py-2">p-5</td><td className="py-2 text-muted-foreground">Forms, list items, journal entries</td></tr>
                  <tr className="border-b border-border/20"><td className="py-2"><code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">cardStandard</code></td><td className="py-2">p-6</td><td className="py-2 text-muted-foreground">Standard feature / dashboard cards</td></tr>
                  <tr className="border-b border-border/20"><td className="py-2"><code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">emptyState</code></td><td className="py-2">py-12</td><td className="py-2 text-muted-foreground">Empty-state vertical padding</td></tr>
                  <tr><td className="py-2"><code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">pageWrapper</code></td><td className="py-2">px-4 py-6 sm:px-6</td><td className="py-2 text-muted-foreground">Page content wrapper</td></tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Separator />

      {/* ─── 4. Buttons ─── */}
      <Section title="Buttons" icon={<CheckCircle className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard} flex flex-wrap gap-3`}>
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </CardContent>
        </Card>
      </Section>

      <Separator />

      {/* ─── 5. System Components ─── */}
      <Section title="Dashboard Components" icon={<LayoutGrid className="h-5 w-5 text-primary" />}>

        {/* PageHeader */}
        <div className="space-y-2">
          <Badge variant="outline" className="text-2xs">PageHeader</Badge>
          <PageHeader
            icon={<BarChart3 className="h-5 w-5 text-primary" />}
            title="Example Page Header"
            subtitle="This is the standard page header used across all modules"
          />
        </div>

        {/* StatCard */}
        <div className="space-y-2">
          <Badge variant="outline" className="text-2xs">StatCard</Badge>
          <DashboardGrid columns={3}>
            <StatCard
              title="Total Users"
              value="1,245"
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              trend={<span className="text-2xs text-chart-1">+12% this month</span>}
            />
            <StatCard
              title="Active Sessions"
              value="387"
              icon={<BarChart3 className="h-4 w-4 text-primary" />}
            />
            <StatCard
              title="Completion Rate"
              value="94%"
              icon={<CheckCircle className="h-4 w-4 text-primary" />}
            />
          </DashboardGrid>
        </div>

        {/* MetricCard */}
        <div className="space-y-2">
          <Badge variant="outline" className="text-2xs">MetricCard</Badge>
          <DashboardGrid columns={4}>
            <MetricCard title="Revenue" value="$12.5K" icon={<Star className="h-4 w-4" />} description="+8.2% from last month" />
            <MetricCard title="Tasks" value="156" icon={<CheckCircle className="h-4 w-4" />} />
            <MetricCard title="Alerts" value="3" icon={<AlertCircle className="h-4 w-4" />} />
            <MetricCard title="Score" value="92" icon={<TrendingUp className="h-4 w-4" />} />
          </DashboardGrid>
        </div>

        {/* ChartCard */}
        <div className="space-y-2">
          <Badge variant="outline" className="text-2xs">ChartCard</Badge>
          <ChartCard title="Weekly Trend" description="Example chart card wrapper">
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              [Chart content goes here]
            </div>
          </ChartCard>
        </div>

        {/* InsightCard */}
        <div className="space-y-2">
          <Badge variant="outline" className="text-2xs">InsightCard</Badge>
          <DashboardGrid columns={3}>
            <InsightCard
              icon={<Lightbulb className="h-4 w-4 text-primary" />}
              title="AI Insight"
              description="Team productivity increased 15% this sprint"
              badge={<Badge variant="secondary">New</Badge>}
            />
            <InsightCard
              icon={<AlertCircle className="h-4 w-4 text-destructive" />}
              title="Risk Alert"
              description="3 overdue tasks require attention"
            />
            <InsightCard
              icon={<TrendingUp className="h-4 w-4 text-chart-1" />}
              title="Trend"
              description="Wellness scores trending upward"
            />
          </DashboardGrid>
        </div>

        {/* EmptyState */}
        <div className="space-y-2">
          <Badge variant="outline" className="text-2xs">EmptyState</Badge>
          <Card className={cardVariants.glass}>
            <CardContent>
              <EmptyState
                title="No data yet"
                description="This is the standard empty state component"
                actionLabel="Get Started"
                onAction={() => {}}
              />
            </CardContent>
          </Card>
        </div>
      </Section>

      <Separator />

      {/* ─── 6. Card Variants ─── */}
      <Section title="Card Variants" icon={<LayoutGrid className="h-5 w-5 text-primary" />}>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(cardVariants).map(([key, classes]) => (
            <Card key={key} className={classes}>
              <CardContent className={spacing.cardStandard}>
                <p className={typography.cardTitle}>{key}</p>
                <code className="text-2xs font-mono text-muted-foreground mt-1 block">
                  {classes}
                </code>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Separator />

      {/* ─── 7. UI Governance Rules ─── */}
      <Section title="UI Governance Rules" icon={<Shield className="h-5 w-5 text-primary" />}>
        <div className="grid gap-4 md:grid-cols-2">
          <RuleCard title="Component Usage">
            <p>✅ Always use system components from <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">@/shared/components/system</code></p>
            <p>❌ Never create card containers using raw <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">{"<div className=\"p-6 rounded-lg\">"}</code></p>
            <p>✅ Use <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">{"<StatCard />"}</code>, <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">{"<MetricCard />"}</code>, <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">{"<ChartCard />"}</code></p>
            <p>✅ All page titles must use <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">{"<PageHeader />"}</code></p>
            <p>✅ All dashboard layouts must use <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">{"<DashboardGrid />"}</code></p>
          </RuleCard>

          <RuleCard title="Token Protection">
            <p>✅ Tokens live only in <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">src/theme/tokens.ts</code></p>
            <p>✅ Use <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">spacing.cardStandard</code>, <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">typography.metric</code></p>
            <p>❌ Never use arbitrary values: <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">p-[22px]</code>, <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">text-[13px]</code></p>
            <p>❌ Feature modules must not define custom tokens</p>
          </RuleCard>

          <RuleCard title="Protected Architecture">
            <p>The following directories are core UI infrastructure:</p>
            {DESIGN_SYSTEM.protectedPaths.map((p) => (
              <p key={p}>🔒 <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">{p}</code></p>
            ))}
            <p className="text-muted-foreground pt-1">Feature modules may consume but should not modify these layers.</p>
          </RuleCard>

          <RuleCard title="Feature Isolation">
            <p>✅ Import from system: <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">{"import { MetricCard } from '@/shared/components/system'"}</code></p>
            <p>❌ Never redefine system components inside feature modules</p>
            <p>❌ Never create custom metric/stat/chart cards in features</p>
            <p>✅ Feature modules live in <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">src/features/*</code> and consume system components</p>
          </RuleCard>
        </div>
      </Section>

      <Separator />

      {/* ─── 8. UI Update Workflow ─── */}
      <Section title="UI Update Workflow" icon={<BookOpen className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard} space-y-3`}>
            {[
              { step: 1, text: "Update component in isolation" },
              { step: 2, text: "Verify in /dev/components (sandbox)" },
              { step: 3, text: "Verify in /dev/design-system (documentation)" },
              { step: 4, text: "Validate key pages (Dashboard, Tasks, Analytics)" },
              { step: 5, text: "Merge changes" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{step}</span>
                </div>
                <span className="text-sm text-foreground">{text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}

