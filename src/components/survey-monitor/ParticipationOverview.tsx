import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { Users, Clock, CheckCircle, TrendingUp, HelpCircle, FileCheck } from 'lucide-react';
import type { EmployeeStats, QuestionStats } from '@/hooks/analytics/useSurveyMonitor';

interface Props {
  employeeStats: EmployeeStats;
  questionStats: QuestionStats;
  isLoading: boolean;
}

export function ParticipationOverview({ employeeStats, questionStats, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const employeeCards = [
    { label: t('surveyMonitor.stats.employeesTargeted'), value: employeeStats.totalEmployees, icon: Users, colorClass: 'text-primary' },
    { label: t('surveyMonitor.stats.employeesCompleted'), value: employeeStats.employeesCompleted, icon: CheckCircle, colorClass: 'text-chart-1' },
    { label: t('surveyMonitor.stats.employeesInProgress'), value: employeeStats.employeesInProgress, icon: TrendingUp, colorClass: 'text-chart-4' },
    { label: t('surveyMonitor.stats.employeesNotStarted'), value: employeeStats.employeesNotStarted, icon: Clock, colorClass: 'text-muted-foreground' },
  ];

  const questionCards = [
    { label: t('surveyMonitor.stats.totalQuestions'), value: questionStats.totalQuestions, icon: HelpCircle },
    { label: t('surveyMonitor.stats.questionsAnswered'), value: questionStats.questionsAnswered, icon: FileCheck },
    { label: t('surveyMonitor.stats.completionPercent'), value: `${questionStats.questionCompletionPercent}%`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-3">
      {/* Primary: Employee-level */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {employeeCards.map(({ label, value, icon: Icon, colorClass }) => (
          <Card key={label} className="glass-card border-0 rounded-xl">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className={`h-4 w-4 ${colorClass}`} />
              </div>
              <span className="text-2xl font-bold">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Secondary: Question-level */}
      <div className="grid grid-cols-3 gap-3">
        {questionCards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="glass-card border-0 rounded-xl">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
