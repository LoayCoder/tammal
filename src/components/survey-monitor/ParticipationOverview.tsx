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
          <Card key={label}>
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <Icon className={`h-5 w-5 ${colorClass}`} />
              <span className="text-2xl font-bold">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Secondary: Question-level */}
      <div className="grid grid-cols-3 gap-3">
        {questionCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-3 flex items-center gap-3">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
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
