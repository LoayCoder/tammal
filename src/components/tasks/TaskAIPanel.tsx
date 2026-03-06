import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Users, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { useTaskAI } from '@/hooks/tasks/useTaskAI';

interface TaskAIPanelProps {
  taskId: string;
}

const RISK_COLORS: Record<string, string> = {
  low: 'bg-chart-1/10 text-chart-1',
  medium: 'bg-chart-4/10 text-chart-4',
  high: 'bg-chart-5/10 text-chart-5',
  critical: 'bg-destructive/10 text-destructive',
};

export function TaskAIPanel({ taskId }: TaskAIPanelProps) {
  const { t } = useTranslation();
  const { suggestAssignee, estimateCompletion, predictRisk, isLoading } = useTaskAI(taskId);

  return (
    <Card className="border-0 bg-gradient-to-b from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          {t('taskAI.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => suggestAssignee.mutate()}
            disabled={isLoading}
          >
            <Users className="h-3.5 w-3.5" />
            {t('taskAI.suggestAssignee')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => estimateCompletion.mutate()}
            disabled={isLoading}
          >
            <Clock className="h-3.5 w-3.5" />
            {t('taskAI.estimateTime')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => predictRisk.mutate()}
            disabled={isLoading}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {t('taskAI.predictRisk')}
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {/* Assignee Suggestions */}
        {suggestAssignee.data?.suggestions && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-chart-2" />
              {t('taskAI.assigneeSuggestions')}
            </h4>
            {suggestAssignee.data.suggestions.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{s.employee_name}</span>
                    <Badge variant="secondary" className="text-xs">{s.confidence}%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completion Estimate */}
        {estimateCompletion.data && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-chart-4" />
              {t('taskAI.completionEstimate')}
            </h4>
            <div className="p-3 rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {estimateCompletion.data.estimated_minutes < 60
                    ? `${estimateCompletion.data.estimated_minutes}m`
                    : `${Math.round(estimateCompletion.data.estimated_minutes / 60)}h ${estimateCompletion.data.estimated_minutes % 60}m`}
                </span>
                <Badge variant="outline" className="text-xs">
                  {t('taskAI.confidence')}: {estimateCompletion.data.confidence}%
                </Badge>
              </div>
              <Progress value={estimateCompletion.data.confidence} className="h-1.5" />
              <p className="text-xs text-muted-foreground">{estimateCompletion.data.reasoning}</p>
              {estimateCompletion.data.risk_factors.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {estimateCompletion.data.risk_factors.map((rf, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {rf}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Risk Prediction */}
        {predictRisk.data && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-chart-5" />
              {t('taskAI.riskPrediction')}
            </h4>
            <div className="p-3 rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={`${RISK_COLORS[predictRisk.data.risk_level]} text-xs`}>
                  {t(`taskAI.riskLevels.${predictRisk.data.risk_level}`)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {t('taskAI.riskScore')}: {predictRisk.data.risk_score}/100
                </span>
              </div>
              <p className="text-xs">{predictRisk.data.summary}</p>
              {predictRisk.data.risks.map((r, i) => (
                <div key={i} className="p-2 rounded bg-background/50 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{r.category}</Badge>
                    <Badge className={`${RISK_COLORS[r.impact]} text-xs`}>{r.impact}</Badge>
                  </div>
                  <p className="text-xs">{r.description}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> {r.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !suggestAssignee.data && !estimateCompletion.data && !predictRisk.data && (
          <p className="text-xs text-muted-foreground text-center py-2">
            {t('taskAI.empty')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
