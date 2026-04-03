import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  StatusBadge,
  TENANT_STATUS_CONFIG,
  ACCOUNT_STATUS_CONFIG,
  EMPLOYEE_STATUS_CONFIG,
  CYCLE_STATUS_CONFIG,
  RISK_LEVEL_CONFIG,
  SCHEDULE_STATUS_CONFIG,
  GENERIC_TASK_STATUS_CONFIG,
  OKR_STATUS_CONFIG,
  PRAYER_STATUS_CONFIG,
} from '@/shared/status-badge';
import type { StatusBadgeConfig } from '@/shared/status-badge';
import { StatCard, MetricCard, ChartCard, InsightCard, DashboardGrid, PageHeader, EmptyState } from '@/components/system';
import { spacing, typography, cardVariants } from '@/theme/tokens';
import {
  BarChart3, TrendingUp, CheckCircle, Star, AlertCircle, Lightbulb, Users
} from 'lucide-react';

/* ── Section wrapper ─── */
function ShowcaseSection({ label, children, code }: { label: string; children: React.ReactNode; code?: string }) {
  return (
    <div className="space-y-3">
      <Badge variant="outline" className="text-2xs">{label}</Badge>
      {children}
      {code && (
        <pre className="text-2xs font-mono bg-muted/40 text-muted-foreground rounded-lg p-3 overflow-x-auto">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

/* ── StatusBadge preset section ─── */
interface PresetSectionProps {
  title: string;
  config: StatusBadgeConfig;
  translationPrefix?: string;
  showIcon?: boolean;
}

function PresetSection({ title, config, translationPrefix, showIcon = false }: PresetSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {Object.keys(config).map((status) => (
          <StatusBadge
            key={status}
            status={status}
            config={config}
            translationPrefix={translationPrefix}
            showIcon={showIcon}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default function ComponentShowcase() {
  const { t } = useTranslation();
  const [switchOn, setSwitchOn] = useState(false);

  return (
    <div className="container mx-auto py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Component Sandbox</h1>
        <p className="text-muted-foreground text-sm">
          Live reference for all system components and UI primitives. Use this page to validate UI changes.
        </p>
      </div>

      <Separator />

      {/* ════════ SYSTEM COMPONENTS ════════ */}
      <h2 className={typography.sectionTitle}>System Components</h2>

      <ShowcaseSection label="PageHeader" code={`import { PageHeader } from "@/components/system";\n<PageHeader icon={…} title="…" subtitle="…" actions={…} />`}>
        <PageHeader
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
          title="Example Page Header"
          subtitle="Standard header used across all modules"
          actions={<Button size="sm">Action</Button>}
        />
      </ShowcaseSection>

      <ShowcaseSection label="StatCard" code={`import { StatCard, DashboardGrid } from "@/components/system";\n<DashboardGrid columns={3}>\n  <StatCard title="…" value="…" icon={…} trend={…} />\n</DashboardGrid>`}>
        <DashboardGrid columns={3}>
          <StatCard title="Total Users" value="1,245" icon={<TrendingUp className="h-4 w-4 text-primary" />} trend={<span className="text-2xs text-chart-1">+12%</span>} />
          <StatCard title="Active" value="387" icon={<Users className="h-4 w-4 text-primary" />} />
          <StatCard title="Rate" value="94%" icon={<CheckCircle className="h-4 w-4 text-primary" />} />
        </DashboardGrid>
      </ShowcaseSection>

      <ShowcaseSection label="MetricCard" code={`import { MetricCard } from "@/components/system";\n<MetricCard title="…" value="…" icon={…} description="…" />`}>
        <DashboardGrid columns={4}>
          <MetricCard title="Revenue" value="$12.5K" icon={<Star className="h-4 w-4" />} description="+8.2%" />
          <MetricCard title="Tasks" value="156" icon={<CheckCircle className="h-4 w-4" />} />
          <MetricCard title="Alerts" value="3" icon={<AlertCircle className="h-4 w-4" />} />
          <MetricCard title="Score" value="92" icon={<TrendingUp className="h-4 w-4" />} />
        </DashboardGrid>
      </ShowcaseSection>

      <ShowcaseSection label="ChartCard" code={`import { ChartCard } from "@/components/system";\n<ChartCard title="…" description="…">{children}</ChartCard>`}>
        <ChartCard title="Weekly Trend" description="Chart card wrapper example">
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">[Chart content]</div>
        </ChartCard>
      </ShowcaseSection>

      <ShowcaseSection label="InsightCard" code={`import { InsightCard } from "@/components/system";\n<InsightCard icon={…} title="…" description="…" badge={…} />`}>
        <DashboardGrid columns={3}>
          <InsightCard icon={<Lightbulb className="h-4 w-4 text-primary" />} title="AI Insight" description="Productivity up 15%" badge={<Badge variant="secondary">New</Badge>} />
          <InsightCard icon={<AlertCircle className="h-4 w-4 text-destructive" />} title="Risk" description="3 overdue tasks" />
          <InsightCard icon={<TrendingUp className="h-4 w-4 text-chart-1" />} title="Trend" description="Scores trending up" />
        </DashboardGrid>
      </ShowcaseSection>

      <ShowcaseSection label="EmptyState" code={`import { EmptyState } from "@/components/system";\n<EmptyState title="…" description="…" actionLabel="…" onAction={…} />`}>
        <Card className={cardVariants.glass}>
          <CardContent>
            <EmptyState title="No data yet" description="Standard empty state component" actionLabel="Get Started" onAction={() => {}} />
          </CardContent>
        </Card>
      </ShowcaseSection>

      <Separator />

      {/* ════════ UI PRIMITIVES ════════ */}
      <h2 className={typography.sectionTitle}>UI Primitives</h2>

      {/* Buttons */}
      <ShowcaseSection label="Button" code={`import { Button } from "@/components/ui/button";\n<Button variant="default | secondary | outline | ghost | destructive | link" size="default | sm | lg | icon" />`}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard} space-y-4`}>
            <div className="flex flex-wrap gap-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon"><Star className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </ShowcaseSection>

      {/* Badge */}
      <ShowcaseSection label="Badge" code={`import { Badge } from "@/components/ui/badge";\n<Badge variant="default | secondary | outline | destructive" />`}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard} flex flex-wrap gap-3`}>
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </CardContent>
        </Card>
      </ShowcaseSection>

      {/* Avatar */}
      <ShowcaseSection label="Avatar" code={`import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";\n<Avatar><AvatarFallback>AB</AvatarFallback></Avatar>`}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard} flex items-center gap-4`}>
            <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>AB</AvatarFallback></Avatar>
            <Avatar className="h-12 w-12"><AvatarFallback className="text-lg">XL</AvatarFallback></Avatar>
          </CardContent>
        </Card>
      </ShowcaseSection>

      {/* Forms */}
      <ShowcaseSection label="Input / Textarea" code={`import { Input } from "@/components/ui/input";\nimport { Textarea } from "@/components/ui/textarea";`}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard} space-y-4 max-w-md`}>
            <div className="space-y-1.5">
              <Label>Text Input</Label>
              <Input placeholder="Enter text…" />
            </div>
            <div className="space-y-1.5">
              <Label>Textarea</Label>
              <Textarea placeholder="Enter description…" />
            </div>
          </CardContent>
        </Card>
      </ShowcaseSection>

      {/* Select */}
      <ShowcaseSection label="Select" code={`import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";`}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard} max-w-xs`}>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select option…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
                <SelectItem value="b">Option B</SelectItem>
                <SelectItem value="c">Option C</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </ShowcaseSection>

      {/* Switch & Checkbox */}
      <ShowcaseSection label="Switch / Checkbox" code={`import { Switch } from "@/components/ui/switch";\nimport { Checkbox } from "@/components/ui/checkbox";`}>
        <Card className={cardVariants.glass}>
          <CardContent className={`${spacing.cardStandard} space-y-4`}>
            <div className="flex items-center gap-3">
              <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
              <Label>Toggle ({switchOn ? 'On' : 'Off'})</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="cb1" />
              <Label htmlFor="cb1">Checkbox option</Label>
            </div>
          </CardContent>
        </Card>
      </ShowcaseSection>

      {/* Dialog */}
      <ShowcaseSection label="Dialog" code={`import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";`}>
        <Card className={cardVariants.glass}>
          <CardContent className={spacing.cardStandard}>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Example Dialog</DialogTitle>
                  <DialogDescription>This is a standard dialog component.</DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">Dialog content goes here.</p>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </ShowcaseSection>

      {/* Tabs */}
      <ShowcaseSection label="Tabs" code={`import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";`}>
        <Card className={cardVariants.glass}>
          <CardContent className={spacing.cardStandard}>
            <Tabs defaultValue="tab1">
              <TabsList>
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                <TabsTrigger value="tab3">Tab 3</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="text-sm text-muted-foreground pt-3">Content for tab 1</TabsContent>
              <TabsContent value="tab2" className="text-sm text-muted-foreground pt-3">Content for tab 2</TabsContent>
              <TabsContent value="tab3" className="text-sm text-muted-foreground pt-3">Content for tab 3</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </ShowcaseSection>

      {/* Table */}
      <ShowcaseSection label="Table" code={`import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";`}>
        <Card className={cardVariants.glass}>
          <CardContent className={spacing.cardStandard}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell>Ahmed</TableCell><TableCell><Badge variant="secondary">Active</Badge></TableCell><TableCell>Admin</TableCell></TableRow>
                <TableRow><TableCell>Sara</TableCell><TableCell><Badge variant="outline">Pending</Badge></TableCell><TableCell>User</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </ShowcaseSection>

      <Separator />

      {/* ════════ STATUS BADGE PRESETS ════════ */}
      <h2 className={typography.sectionTitle}>StatusBadge Presets</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <PresetSection title="Tenant Status" config={TENANT_STATUS_CONFIG} translationPrefix="common" />
        <PresetSection title="Account Status" config={ACCOUNT_STATUS_CONFIG} showIcon />
        <PresetSection title="Employee Status" config={EMPLOYEE_STATUS_CONFIG} translationPrefix="employees.status" />
        <PresetSection title="Recognition Cycle" config={CYCLE_STATUS_CONFIG} translationPrefix="recognition.cycle.status" />
        <PresetSection title="Risk Level" config={RISK_LEVEL_CONFIG} translationPrefix="aiGovernance.riskLevel" />
        <PresetSection title="Schedule Status" config={SCHEDULE_STATUS_CONFIG} translationPrefix="schedules.status" />
        <PresetSection title="Generic Task / Survey" config={GENERIC_TASK_STATUS_CONFIG} translationPrefix="tasks.status" />
        <PresetSection title="OKR Status" config={OKR_STATUS_CONFIG} translationPrefix="okr.status" />
        <PresetSection title="Prayer Status" config={PRAYER_STATUS_CONFIG} translationPrefix="spiritual.prayer.status" showIcon />
      </div>

      {/* Size variants */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Size Variants</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">default</p>
            <StatusBadge status="active" config={TENANT_STATUS_CONFIG} translationPrefix="common" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">sm</p>
            <StatusBadge status="active" config={TENANT_STATUS_CONFIG} translationPrefix="common" size="sm" />
          </div>
        </CardContent>
      </Card>

      {/* Fallback */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Unknown Status Fallback</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <StatusBadge status="unknown_xyz" config={TENANT_STATUS_CONFIG} />
          <StatusBadge status="unknown_xyz" config={TENANT_STATUS_CONFIG} label="Custom Label" />
        </CardContent>
      </Card>
    </div>
  );
}
