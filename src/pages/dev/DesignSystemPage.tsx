import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatCard, MetricCard, ChartCard, InsightCard, DashboardGrid, PageHeader } from "@/components/system";
import { EmptyState } from "@/shared/empty/EmptyState";
import { spacing, typography, cardVariants, layout, iconBox } from "@/theme/tokens";
import { DESIGN_SYSTEM } from "@/theme/version";
import { TOOLKIT, ZONE_COLORS, STATE_COLORS, ACTION_COLORS, RANK_COLORS, PRAYER_COLORS, TREND_COLORS, KPI_COLORS, SEVERITY_COLORS, SYSTEM_ROLE_COLORS } from "@/config/toolkit-colors";
import {
  Palette, Type, Maximize, LayoutGrid, BarChart3,
  TrendingUp, Lightbulb, AlertCircle, CheckCircle, Star,
  Shield, BookOpen, Info, RotateCcw, Copy, Download
} from "lucide-react";
import { toast } from "sonner";

/* ── HSL ↔ Hex conversion helpers ─────────────────────────────── */
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): [number, number, number] {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function getComputedHslFromVar(cssVar: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${cssVar}`).trim();
  return raw || '0 0% 50%';
}

function hslStringToHex(hslStr: string): string {
  const parts = hslStr.replace(/,/g, ' ').split(/\s+/).map(Number);
  if (parts.length >= 3) return hslToHex(parts[0], parts[1], parts[2]);
  return '#808080';
}

/* ── Editable Swatch ──────────────────────────────────────────── */
function EditableSwatch({
  name, cssVar, overrides, onOverride, onReset,
}: {
  name: string;
  cssVar: string;
  overrides: Map<string, string>;
  onOverride: (cssVar: string, hslValue: string) => void;
  onReset: (cssVar: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const isOverridden = overrides.has(cssVar);

  const currentHsl = isOverridden ? overrides.get(cssVar)! : getComputedHslFromVar(cssVar);
  const currentHex = hslStringToHex(currentHsl);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [h, s, l] = hexToHsl(e.target.value);
    const newHsl = `${h} ${s}% ${l}%`;
    onOverride(cssVar, newHsl);
  };

  const handleReset = () => {
    onReset(cssVar);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`w-12 h-12 rounded-xl border shadow-sm cursor-pointer transition-all hover:scale-110 ${isOverridden ? 'border-primary ring-2 ring-primary/30' : 'border-border/50'}`}
        style={{ backgroundColor: `hsl(var(--${cssVar}))` }}
        onClick={() => setIsEditing(!isEditing)}
        title={`Click to edit --${cssVar}`}
      />
      <span className="text-2xs text-muted-foreground text-center leading-tight">{name}</span>
      {isEditing && (
        <div className="flex flex-col items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
          <input
            type="color"
            value={currentHex}
            onChange={handleColorChange}
            className="w-10 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
          />
          <span className="text-[9px] font-mono text-muted-foreground">{currentHsl}</span>
          {isOverridden && (
            <button onClick={handleReset} className="text-[9px] text-destructive hover:underline flex items-center gap-0.5">
              <RotateCcw className="h-2.5 w-2.5" /> Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Editable Toolkit Swatch (for value-based swatches) ──────── */
function EditableToolkitSwatch({
  name, cssVar, overrides, onOverride, onReset,
}: {
  name: string;
  cssVar: string;
  overrides: Map<string, string>;
  onOverride: (cssVar: string, hslValue: string) => void;
  onReset: (cssVar: string) => void;
}) {
  return (
    <EditableSwatch
      name={name}
      cssVar={cssVar}
      overrides={overrides}
      onOverride={onOverride}
      onReset={onReset}
    />
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

/* ── Toolkit CSS var map ──────────────────────────────────────── */
const TOOLKIT_CSS_VARS: Record<string, string> = {
  lavender: 'toolkit-lavender',
  sage: 'toolkit-sage',
  plum: 'toolkit-plum',
  sky: 'toolkit-sky',
  gold: 'toolkit-gold',
  peach: 'toolkit-peach',
  warm: 'toolkit-warm',
  coral: 'toolkit-coral',
  amber: 'toolkit-amber',
  rose: 'toolkit-rose',
};

const ZONE_CSS_VARS: Record<string, string> = {
  thriving: 'toolkit-zone-thriving',
  watch: 'toolkit-zone-watch',
  atRisk: 'toolkit-zone-at-risk',
};

export default function DesignSystemPage() {
  const { t } = useTranslation();
  const [overrides, setOverrides] = useState<Map<string, string>>(new Map());

  const handleOverride = useCallback((cssVar: string, hslValue: string) => {
    document.documentElement.style.setProperty(`--${cssVar}`, hslValue);
    setOverrides(prev => {
      const next = new Map(prev);
      next.set(cssVar, hslValue);
      return next;
    });
  }, []);

  const handleReset = useCallback((cssVar: string) => {
    document.documentElement.style.removeProperty(`--${cssVar}`);
    setOverrides(prev => {
      const next = new Map(prev);
      next.delete(cssVar);
      return next;
    });
  }, []);

  const handleResetAll = useCallback(() => {
    overrides.forEach((_, cssVar) => {
      document.documentElement.style.removeProperty(`--${cssVar}`);
    });
    setOverrides(new Map());
    toast.success('All colors reset to defaults');
  }, [overrides]);

  const handleExportCSS = useCallback(() => {
    if (overrides.size === 0) {
      toast.info('No color overrides to export');
      return;
    }
    const lines = Array.from(overrides.entries())
      .map(([cssVar, value]) => `  --${cssVar}: ${value};`)
      .join('\n');
    const css = `:root {\n${lines}\n}`;
    navigator.clipboard.writeText(css);
    toast.success(`Copied ${overrides.size} overrides to clipboard`);
  }, [overrides]);

  // Shared swatch props
  const swatchProps = { overrides, onOverride: handleOverride, onReset: handleReset };

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

      {/* ─── Color Editor Toolbar ─── */}
      {overrides.size > 0 && (
        <div className="sticky top-2 z-50 flex items-center gap-3 bg-card/95 backdrop-blur-sm border border-primary/20 rounded-xl px-4 py-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <Palette className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">{overrides.size} color{overrides.size > 1 ? 's' : ''} modified</span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="gap-1.5 rounded-lg" onClick={handleExportCSS}>
            <Copy className="h-3.5 w-3.5" /> Copy CSS
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg text-destructive hover:text-destructive" onClick={handleResetAll}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset All
          </Button>
        </div>
      )}

      <Separator />

      {/* ─── 1. Colors ─── */}
      <Section title="Core Colors" icon={<Palette className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardHeader>
            <CardTitle className={typography.cardTitle}>Semantic Palette
              <span className="text-2xs text-muted-foreground font-normal ms-2">Click any swatch to edit</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {[
              { name: 'Primary', cssVar: 'primary' },
              { name: 'Secondary', cssVar: 'secondary' },
              { name: 'Accent', cssVar: 'accent' },
              { name: 'Destructive', cssVar: 'destructive' },
              { name: 'Muted', cssVar: 'muted' },
              { name: 'Background', cssVar: 'background' },
              { name: 'Card', cssVar: 'card' },
              { name: 'Border', cssVar: 'border' },
            ].map(s => <EditableSwatch key={s.cssVar} {...s} {...swatchProps} />)}
          </CardContent>
        </Card>

        <Card className={cardVariants.glass}>
          <CardHeader><CardTitle className={typography.cardTitle}>Chart Colors</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {[1,2,3,4,5].map(n => (
              <EditableSwatch key={n} name={`Chart ${n}`} cssVar={`chart-${n}`} {...swatchProps} />
            ))}
          </CardContent>
        </Card>

        <Card className={cardVariants.glass}>
          <CardHeader><CardTitle className={typography.cardTitle}>Toolkit Palette</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {Object.entries(TOOLKIT_CSS_VARS).map(([name, cssVar]) => (
              <EditableSwatch key={cssVar} name={name} cssVar={cssVar} {...swatchProps} />
            ))}
          </CardContent>
        </Card>

        <Card className={cardVariants.glass}>
          <CardHeader><CardTitle className={typography.cardTitle}>Zone Colors</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {Object.entries(ZONE_CSS_VARS).map(([name, cssVar]) => (
              <EditableSwatch key={cssVar} name={name} cssVar={cssVar} {...swatchProps} />
            ))}
          </CardContent>
        </Card>
      </Section>

      {/* Status / Semantic Colors */}
      <Section title="Status & Semantic Colors" icon={<AlertCircle className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardHeader><CardTitle className={typography.cardTitle}>Semantic Status</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {[
              { name: 'Success', cssVar: 'success' },
              { name: 'Warning', cssVar: 'warning' },
              { name: 'Info', cssVar: 'info' },
              { name: 'Destructive', cssVar: 'destructive' },
            ].map(s => <EditableSwatch key={s.cssVar} {...s} {...swatchProps} />)}
          </CardContent>
        </Card>
        <Card className={cardVariants.glass}>
          <CardHeader><CardTitle className={typography.cardTitle}>Status Tint Backgrounds</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {[
              { name: 'Success BG', cssVar: 'status-success-bg' },
              { name: 'Info BG', cssVar: 'status-info-bg' },
              { name: 'Warning BG', cssVar: 'status-warning-bg' },
              { name: 'Error BG', cssVar: 'status-error-bg' },
            ].map(s => <EditableSwatch key={s.cssVar} {...s} {...swatchProps} />)}
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

      {/* ─── Font Families ─── */}
      <Section title="Font Families" icon={<Type className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard} space-y-5`}>
            <div className="space-y-1">
              <code className="text-2xs font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">Inter (--font-sans)</code>
              <p className="text-base font-normal" style={{ fontFamily: 'var(--font-sans)' }}>The quick brown fox jumps over the lazy dog — 400</p>
              <p className="text-base font-semibold" style={{ fontFamily: 'var(--font-sans)' }}>The quick brown fox jumps over the lazy dog — 600</p>
              <p className="text-base font-bold" style={{ fontFamily: 'var(--font-sans)' }}>The quick brown fox jumps over the lazy dog — 700</p>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Separator />

      {/* ─── Shadow Tokens ─── */}
      <Section title="Shadow Tokens" icon={<Maximize className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard}`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['2xs', 'xs', 'sm', 'DEFAULT', 'lg', 'xl', '2xl', 'tooltip'].map((level) => (
                <div key={level} className="flex flex-col items-center gap-2">
                  <div
                    className="w-16 h-16 rounded-xl bg-card border border-border/30"
                    style={{ boxShadow: `var(--shadow-${level === 'DEFAULT' ? 'md' : level})` }}
                  />
                  <code className="text-2xs font-mono text-muted-foreground">{level}</code>
                </div>
              ))}
            </div>
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
        <div className="space-y-2">
          <Badge variant="outline" className="text-2xs">PageHeader</Badge>
          <PageHeader
            icon={<BarChart3 className="h-5 w-5 text-primary" />}
            title="Example Page Header"
            subtitle="This is the standard page header used across all modules"
          />
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className="text-2xs">StatCard</Badge>
          <DashboardGrid columns={3}>
            <StatCard title="Total Users" value="1,245" icon={<TrendingUp className="h-4 w-4 text-primary" />} trend={<span className="text-2xs text-chart-1">+12% this month</span>} />
            <StatCard title="Active Sessions" value="387" icon={<BarChart3 className="h-4 w-4 text-primary" />} />
            <StatCard title="Completion Rate" value="94%" icon={<CheckCircle className="h-4 w-4 text-primary" />} />
          </DashboardGrid>
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className="text-2xs">MetricCard</Badge>
          <DashboardGrid columns={4}>
            <MetricCard title="Revenue" value="$12.5K" icon={<Star className="h-4 w-4" />} description="+8.2% from last month" />
            <MetricCard title="Tasks" value="156" icon={<CheckCircle className="h-4 w-4" />} />
            <MetricCard title="Alerts" value="3" icon={<AlertCircle className="h-4 w-4" />} />
            <MetricCard title="Score" value="92" icon={<TrendingUp className="h-4 w-4" />} />
          </DashboardGrid>
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className="text-2xs">ChartCard</Badge>
          <ChartCard title="Weekly Trend" description="Example chart card wrapper">
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              [Chart content goes here]
            </div>
          </ChartCard>
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className="text-2xs">InsightCard</Badge>
          <DashboardGrid columns={3}>
            <InsightCard icon={<Lightbulb className="h-4 w-4 text-primary" />} title="AI Insight" description="Team productivity increased 15% this sprint" badge={<Badge variant="secondary">New</Badge>} />
            <InsightCard icon={<AlertCircle className="h-4 w-4 text-destructive" />} title="Risk Alert" description="3 overdue tasks require attention" />
            <InsightCard icon={<TrendingUp className="h-4 w-4 text-chart-1" />} title="Trend" description="Wellness scores trending upward" />
          </DashboardGrid>
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className="text-2xs">EmptyState</Badge>
          <Card className={cardVariants.glass}>
            <CardContent>
              <EmptyState title="No data yet" description="This is the standard empty state component" actionLabel="Get Started" onAction={() => {}} />
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
                <code className="text-2xs font-mono text-muted-foreground mt-1 block">{classes}</code>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Separator />

      {/* ─── Premium Card Variants ─── */}
      <Section title="Premium Card Variants" icon={<Star className="h-5 w-5 text-primary" />}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="premium-card rounded-[10px] p-5 space-y-1">
            <p className={typography.cardTitle}>premium-card</p>
            <p className="text-2xs text-muted-foreground">Soft gradient, inner highlight, subtle shadow</p>
          </div>
          <div className="premium-card-vip rounded-[10px] p-5 space-y-1">
            <p className={typography.cardTitle}>premium-card-vip</p>
            <p className="text-2xs text-muted-foreground">Primary glow border + gradient + shadow</p>
          </div>
          <div className="p-5 rounded-[10px] space-y-2">
            <p className={typography.cardTitle}>vip-stat-chip</p>
            <div className="flex gap-2">
              <div className="vip-stat-chip">
                <span className="text-sm font-semibold">94%</span>
                <span className="text-2xs text-muted-foreground">Score</span>
              </div>
              <div className="vip-stat-chip">
                <span className="text-sm font-semibold">12</span>
                <span className="text-2xs text-muted-foreground">Tasks</span>
              </div>
            </div>
          </div>
          <div className="p-5 rounded-[10px] space-y-2">
            <p className={typography.cardTitle}>premium-badge</p>
            <div className="flex gap-2">
              <span className="premium-badge px-3 py-1 rounded-full text-xs font-medium">Premium</span>
              <span className="premium-badge px-3 py-1 rounded-full text-xs font-medium">VIP</span>
            </div>
          </div>
        </div>
      </Section>

      <Separator />

      {/* ─── Contextual Widget Styles ─── */}
      <Section title="Contextual Widget Styles" icon={<Info className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardHeader><CardTitle className={typography.cardTitle}>Islamic Calendar Pattern</CardTitle></CardHeader>
          <CardContent className={`${spacing.cardStandard} space-y-4`}>
            <div className="rounded-xl px-4 py-3.5 space-y-2.5 transition-colors border bg-transparent border-[#69cbfc]/35 shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🕌</span>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Islamic Calendar</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">10 Shawwal 1447</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full text-muted-foreground font-medium border border-[#2a0909]/[0.48] bg-[#919191]/0 inline-block">
                🤍 White Day
              </span>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">border bg-transparent border-[#69cbfc]/35 shadow-md</code> — container</p>
              <p><code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">border border-[#2a0909]/[0.48] bg-[#919191]/0</code> — lightweight badge</p>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Separator />

      {/* ─── 7. UI Governance Rules ─── */}
      <Section title="UI Governance Rules" icon={<Shield className="h-5 w-5 text-primary" />}>
        <div className="grid gap-4 md:grid-cols-2">
          <RuleCard title="Component Usage">
            <p>✅ Always use system components from <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">@/components/system</code></p>
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
            <p>✅ Import from system: <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">{"import { MetricCard } from '@/components/system'"}</code></p>
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

      <Separator />

      {/* ─── 9. State Colors ─── */}
      <Section title="State Colors" icon={<AlertCircle className="h-5 w-5 text-primary" />}>
        <p className="text-sm text-muted-foreground">
          Semantic state tokens for task/item lifecycle. Use CSS variables <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">--state-*</code> or the <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">STATE_COLORS</code> map from <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">@/config/toolkit-colors</code>.
        </p>

        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard}`}>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-4">
              {([
                { name: 'Completed', cssVar: 'state-completed' },
                { name: 'Overdue', cssVar: 'state-overdue' },
                { name: 'Missed', cssVar: 'state-missed' },
                { name: 'Pending', cssVar: 'state-pending' },
                { name: 'Important', cssVar: 'state-important' },
                { name: 'Normal', cssVar: 'state-normal' },
                { name: 'Checked', cssVar: 'state-checked' },
              ] as const).map((c) => (
                <div key={c.cssVar} className="flex flex-col items-center gap-1.5">
                  <div className="flex gap-1">
                    <EditableSwatch name="" cssVar={c.cssVar} {...swatchProps} />
                    <EditableSwatch name="" cssVar={`${c.cssVar}-bg`} {...swatchProps} />
                  </div>
                  <span className="text-2xs text-muted-foreground text-center leading-tight">{c.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={cardVariants.glass}>
          <CardHeader className="pb-2">
            <CardTitle className={typography.cardTitle}>Live Badge Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {([
              { label: 'Completed', v: 'completed' },
              { label: 'Overdue', v: 'overdue' },
              { label: 'Missed', v: 'missed' },
              { label: 'Pending', v: 'pending' },
              { label: 'Important', v: 'important' },
              { label: 'Normal', v: 'normal' },
              { label: 'Checked', v: 'checked' },
            ] as const).map((b) => (
              <span
                key={b.v}
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: `hsl(var(--state-${b.v}-bg))`,
                  color: `hsl(var(--state-${b.v}))`,
                  borderColor: `hsl(var(--state-${b.v}) / 0.3)`,
                }}
              >
                {b.label}
              </span>
            ))}
          </CardContent>
        </Card>

        <RuleCard title="Usage">
          <p>CSS: <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">{"bg-[hsl(var(--state-completed))]/20 text-[hsl(var(--state-completed))]"}</code></p>
          <p>JS: <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">{"import { STATE_COLORS } from '@/config/toolkit-colors'"}</code></p>
          <p>Inline: <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">{"style={{ color: STATE_COLORS.overdue }}"}</code></p>
        </RuleCard>
      </Section>

      <Separator />

      {/* ─── 10. Action Colors ─── */}
      <Section title="Action Colors" icon={<AlertCircle className="h-5 w-5 text-primary" />}>
        <p className="text-sm text-muted-foreground">
          Semantic tokens for audit log actions. Use CSS variables <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">--action-*</code> or <code className="text-2xs bg-muted/30 px-1.5 py-0.5 rounded">ACTION_COLORS</code>.
        </p>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard}`}>
            <div className="flex flex-wrap gap-4">
              <EditableSwatch name="Create" cssVar="action-create" {...swatchProps} />
              <EditableSwatch name="Update" cssVar="action-update" {...swatchProps} />
              <EditableSwatch name="Toggle" cssVar="action-toggle" {...swatchProps} />
              <EditableSwatch name="Status" cssVar="action-status" {...swatchProps} />
              <EditableSwatch name="Delete" cssVar="destructive" {...swatchProps} />
            </div>
          </CardContent>
        </Card>
        <Card className={cardVariants.glass}>
          <CardHeader className="pb-2"><CardTitle className={typography.cardTitle}>Live Badge Preview</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {([
              { label: 'Create', v: 'action-create' },
              { label: 'Update', v: 'action-update' },
              { label: 'Toggle', v: 'action-toggle' },
              { label: 'Status', v: 'action-status' },
            ] as const).map((b) => (
              <span
                key={b.v}
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: `hsl(var(--${b.v}) / 0.1)`,
                  color: `hsl(var(--${b.v}))`,
                  borderColor: `hsl(var(--${b.v}) / 0.2)`,
                }}
              >
                {b.label}
              </span>
            ))}
          </CardContent>
        </Card>
      </Section>

      <Separator />

      {/* ─── 11. Rank Colors ─── */}
      <Section title="Rank Colors" icon={<Star className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard}`}>
            <div className="flex flex-wrap gap-4">
              <EditableSwatch name="Gold" cssVar="rank-gold" {...swatchProps} />
              <EditableSwatch name="Silver" cssVar="rank-silver" {...swatchProps} />
              <EditableSwatch name="Bronze" cssVar="rank-bronze" {...swatchProps} />
            </div>
          </CardContent>
        </Card>
      </Section>

      <Separator />

      {/* ─── 12. Prayer Colors ─── */}
      <Section title="Prayer Colors" icon={<CheckCircle className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard}`}>
            <div className="flex flex-wrap gap-4">
              <EditableSwatch name="Mosque" cssVar="prayer-mosque" {...swatchProps} />
              <EditableSwatch name="Home" cssVar="prayer-home" {...swatchProps} />
              <EditableSwatch name="Work" cssVar="prayer-work" {...swatchProps} />
              <EditableSwatch name="Countdown" cssVar="prayer-countdown" {...swatchProps} />
              <EditableSwatch name="Missed" cssVar="state-missed" {...swatchProps} />
            </div>
          </CardContent>
        </Card>
      </Section>

      <Separator />

      {/* ─── 13. Trend Colors ─── */}
      <Section title="Trend Colors" icon={<TrendingUp className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard}`}>
            <div className="flex flex-wrap gap-4">
              <EditableSwatch name="Positive" cssVar="trend-positive" {...swatchProps} />
              <EditableSwatch name="Negative" cssVar="destructive" {...swatchProps} />
            </div>
          </CardContent>
        </Card>
      </Section>

      <Separator />

      {/* ─── 14. KPI Accent Colors ─── */}
      <Section title="KPI Accent Colors" icon={<BarChart3 className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard}`}>
            <div className="flex flex-wrap gap-4">
              <EditableSwatch name="Progress" cssVar="kpi-progress" {...swatchProps} />
              <EditableSwatch name="Utilization" cssVar="kpi-utilization" {...swatchProps} />
              <EditableSwatch name="Risk" cssVar="kpi-risk" {...swatchProps} />
              <EditableSwatch name="Trend" cssVar="kpi-trend" {...swatchProps} />
            </div>
          </CardContent>
        </Card>
      </Section>

      <Separator />

      {/* ─── 15. Severity Colors ─── */}
      <Section title="Severity Colors" icon={<AlertCircle className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard}`}>
            <div className="flex flex-wrap gap-4">
              <EditableSwatch name="Medium" cssVar="severity-medium" {...swatchProps} />
              <EditableSwatch name="High (destructive)" cssVar="destructive" {...swatchProps} />
            </div>
          </CardContent>
        </Card>
      </Section>

      <Separator />

      {/* ─── 16. Islamic Accent ─── */}
      <Section title="Islamic Widget Accent" icon={<CheckCircle className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard}`}>
            <div className="flex flex-wrap gap-4">
              <EditableSwatch name="Islamic Accent" cssVar="islamic-accent" {...swatchProps} />
            </div>
          </CardContent>
        </Card>
      </Section>

      <Separator />

      {/* ─── 17. System Role Colors ─── */}
      <Section title="System Role Colors" icon={<Shield className="h-5 w-5 text-primary" />}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard}`}>
            <div className="flex flex-wrap gap-4">
              {Object.entries(SYSTEM_ROLE_COLORS).map(([name]) => {
                const cssVarMap: Record<string, string> = {
                  super_admin: 'destructive',
                  tenant_admin: 'state-important',
                  manager: 'state-pending',
                  user: 'state-completed',
                };
                return <EditableSwatch key={name} name={name} cssVar={cssVarMap[name] || 'primary'} {...swatchProps} />;
              })}
            </div>
          </CardContent>
        </Card>
      </Section>

      <Separator />

      {/* ─── 18. Widget Accent Colors (Hex Exceptions) ─── */}
      <Section title="Widget Accent Colors (Hex Exceptions)" icon={<Info className="h-5 w-5 text-primary" />}>
        <p className="text-sm text-muted-foreground">
          These hex values are used in color-picker inputs or inline SVG where CSS variables are not supported. They are documented here as exceptions to the HSL-only rule.
        </p>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard} space-y-4`}>
            <div>
              <h4 className={typography.cardTitle}>Islamic Calendar Widget</h4>
              <div className="flex gap-3 mt-2">
                {[
                  { hex: '#69cbfc', label: 'Border accent' },
                  { hex: '#2a0909', label: 'Badge border' },
                ].map((c) => (
                  <div key={c.hex} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md border border-border/50" style={{ backgroundColor: c.hex }} />
                    <div>
                      <span className="text-xs font-semibold text-foreground">{c.hex}</span>
                      <p className="text-2xs text-muted-foreground">{c.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h4 className={typography.cardTitle}>Org Default Fallback</h4>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-8 h-8 rounded-md border border-border/50" style={{ backgroundColor: '#3B82F6' }} />
                <div>
                  <span className="text-xs font-semibold text-foreground">#3B82F6</span>
                  <p className="text-2xs text-muted-foreground">HTML color input fallback (ORG_DEFAULT_COLOR_HEX)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
