import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatCard, MetricCard, ChartCard, InsightCard, DashboardGrid, PageHeader } from "@/components/system";
import { EmptyState } from "@/shared/empty/EmptyState";
import { spacing, typography, cardVariants, layout, iconBox } from "@/theme/tokens";
import { TOOLKIT, ZONE_COLORS } from "@/config/toolkit-colors";
import {
  Palette, Type, Maximize, LayoutGrid, BarChart3,
  TrendingUp, Lightbulb, AlertCircle, CheckCircle, Star
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
    </div>
  );
}
