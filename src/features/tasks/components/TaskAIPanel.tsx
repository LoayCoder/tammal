import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Users, Clock, AlertTriangle, Sparkles, ArrowUpDown, ListChecks, GitBranch } from 'lucide-react';
import { useTaskAI } from '@/features/tasks/hooks/useTaskAI';

interface TaskAIPanelProps {
  taskId: string;
}

const RISK_COLORS: Record<string, string> = {
  low: 'bg-chart-1/10 text-chart-1',
  medium: 'bg-chart-4/10 text-chart-4',
  high: 'bg-chart-5/10 text-chart-5',
  critical: 'bg-destructive/10 text-destructive',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-chart-1/10 text-chart-1',
  medium: 'bg-chart-4/10 text-chart-4',
  high: 'bg-chart-5/10 text-chart-5',
  critical: 'bg-destructive/10 text-destructive',
};

const DEP_TYPE_COLORS: Record<string, string> = {
  blocks: 'bg-destructive/10 text-destructive',
  blocked_by: 'bg-chart-5/10 text-chart-5',
  related: 'bg-chart-2/10 text-chart-2',
};

const AI_ACTIONS = [
  { key: 'suggestAssignee', icon: Users, labelKey: 'taskAI.suggestAssignee' },
  { key: 'estimateCompletion', icon: Clock, labelKey: 'taskAI.estimateTime' },
  { key: 'predictRisk', icon: AlertTriangle, labelKey: 'taskAI.predictRisk' },
  { key: 'suggestPriority', icon: ArrowUpDown, labelKey: 'taskAI.suggestPriority' },
  { key: 'suggestChecklist', icon: ListChecks, labelKey: 'taskAI.suggestChecklist' },
  { key: 'suggestDependencies', icon: GitBranch, labelKey: 'taskAI.suggestDependencies' },
] as const;

export function TaskAIPanel({ taskId }: TaskAIPanelProps) {
  const { t } = useTranslation();
  const ai = useTaskAI(taskId);

  const mutations: Record<string, any> = {
    suggestAssignee: ai.suggestAssignee,
    estimateCompletion: ai.estimateCompletion,
    predictRisk: ai.predictRisk,
    suggestPriority: ai.suggestPriority,
    suggestChecklist: ai.suggestChecklist,
    suggestDependencies: ai.suggestDependencies,
  };

  const hasAnyData = Object.values(mutations).some(m => m.data);

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" strokeWidth={1.5} />
        <span className="text-xs font-medium">{t('taskAI.title')}</span>
      </div>

      {/* 2-column grid of action cards */}
      <div className="grid grid-cols-2 gap-2">
        {AI_ACTIONS.map(({ key, icon: Icon, labelKey }) => (
          <button
            key={key}
            onClick={() => mutations[key].mutate()}
            disabled={ai.isLoading}
            className="flex items-center gap-2.5 p-3 rounded-lg border border-border/50 bg-background hover:bg-muted/30 hover:border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm text-start disabled:opacity-50 disabled:pointer-events-none"
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <span className="text-2xs leading-tight">{t(labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {ai.isLoading && (
        <div className="space-y-2 ps-1">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      )}

      {/* Results */}
      {ai.suggestAssignee.data?.suggestions && (
        <div className="space-y-1.5">
          <h4 className="text-2xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3 w-3" strokeWidth={1.5} />
            {t('taskAI.assigneeSuggestions')}
          </h4>
          {ai.suggestAssignee.data.suggestions.map((s: any, i: number) => (
            <div key={i} className="flex items-center gap-2 py-1.5 ps-5">
              <span className="text-xs font-medium">{s.employee_name}</span>
              <Badge variant="secondary" className="text-2xs">{s.confidence}%</Badge>
              <span className="text-2xs text-muted-foreground truncate">{s.reason}</span>
            </div>
          ))}
        </div>
      )}

      {ai.estimateCompletion.data && (
        <div className="space-y-1.5 ps-5">
          <h4 className="text-2xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3 w-3" strokeWidth={1.5} />
            {t('taskAI.completionEstimate')}
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">
              {ai.estimateCompletion.data.estimated_minutes < 60
                ? `${ai.estimateCompletion.data.estimated_minutes}m`
                : `${Math.round(ai.estimateCompletion.data.estimated_minutes / 60)}h ${ai.estimateCompletion.data.estimated_minutes % 60}m`}
            </span>
            <Badge variant="outline" className="text-2xs">{ai.estimateCompletion.data.confidence}%</Badge>
          </div>
          <Progress value={ai.estimateCompletion.data.confidence} className="h-1" />
          <p className="text-2xs text-muted-foreground">{ai.estimateCompletion.data.reasoning}</p>
        </div>
      )}

      {ai.predictRisk.data && (
        <div className="space-y-1.5 ps-5">
          <div className="flex items-center gap-2">
            <Badge className={`${RISK_COLORS[ai.predictRisk.data.risk_level]} text-2xs`}>
              {t(`taskAI.riskLevels.${ai.predictRisk.data.risk_level}`)}
            </Badge>
            <span className="text-2xs text-muted-foreground">{ai.predictRisk.data.risk_score}/100</span>
          </div>
          <p className="text-2xs">{ai.predictRisk.data.summary}</p>
          {ai.predictRisk.data.risks.map((r: any, i: number) => (
            <div key={i} className="py-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-2xs">{r.category}</Badge>
                <Badge className={`${RISK_COLORS[r.impact]} text-2xs`}>{r.impact}</Badge>
              </div>
              <p className="text-2xs text-muted-foreground">{r.mitigation}</p>
            </div>
          ))}
        </div>
      )}

      {ai.suggestPriority.data && (
        <div className="space-y-1.5 ps-5">
          <div className="flex items-center gap-2">
            <Badge className={`${PRIORITY_COLORS[ai.suggestPriority.data.suggested_priority]} text-2xs`}>
              {ai.suggestPriority.data.suggested_priority.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-2xs">{ai.suggestPriority.data.confidence}%</Badge>
          </div>
          <p className="text-2xs text-muted-foreground">{ai.suggestPriority.data.reasoning}</p>
        </div>
      )}

      {ai.suggestChecklist.data && (
        <div className="space-y-1.5 ps-5">
          <p className="text-2xs text-muted-foreground">{ai.suggestChecklist.data.reasoning}</p>
          {ai.suggestChecklist.data.items.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-1">
              <span className="text-2xs">{item.title}</span>
              <Badge variant="outline" className="text-2xs">~{item.estimated_minutes}m</Badge>
            </div>
          ))}
        </div>
      )}

      {ai.suggestDependencies.data?.suggestions && ai.suggestDependencies.data.suggestions.length > 0 && (
        <div className="space-y-1.5 ps-5">
          {ai.suggestDependencies.data.suggestions.map((d: any, i: number) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <span className="text-2xs font-medium">{d.task_title}</span>
              <Badge className={`${DEP_TYPE_COLORS[d.dependency_type]} text-2xs`}>{d.dependency_type}</Badge>
              <Badge variant="secondary" className="text-2xs">{d.confidence}%</Badge>
            </div>
          ))}
        </div>
      )}

      {!ai.isLoading && !hasAnyData && (
        <p className="text-2xs text-muted-foreground text-center py-2">
          {t('taskAI.empty')}
        </p>
      )}
    </div>
  );
}
