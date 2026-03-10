import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DataTable } from '@/shared/data-table/DataTable';
import { Flame, AlertTriangle } from 'lucide-react';

interface MemberSummary {
  id: string;
  name: string;
  role: string | null;
  department: string | null;
  active: number;
  completed: number;
  overdue: number;
  highPriority: number;
  avgProgress: number;
  total: number;
}

interface TeamMemberAccordionProps {
  members: MemberSummary[];
  tasksByEmployee: Map<string, any[]>;
  taskColumns: any[];
  isLoading: boolean;
}

export function TeamMemberAccordion({ members, tasksByEmployee, taskColumns, isLoading }: TeamMemberAccordionProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="h-64 animate-pulse bg-muted/30 rounded-lg" />;
  }

  if (members.length === 0) {
    return <div className="text-center py-8 text-sm text-muted-foreground">{t('teamWorkload.noTasksFound')}</div>;
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {members.map(member => {
        const memberTasks = tasksByEmployee.get(member.id) ?? [];
        const overdueRatio = member.active > 0 ? member.overdue / member.active : 0;
        const riskLevel = overdueRatio > 0.5 ? 'high' : overdueRatio > 0.25 ? 'medium' : 'low';

        return (
          <AccordionItem key={member.id} value={member.id} className="border rounded-lg bg-muted/10 px-1">
            <AccordionTrigger className="py-3 px-3 hover:no-underline">
              <div className="flex flex-1 items-center justify-between me-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{member.name}</span>
                      {riskLevel === 'high' && (
                        <Badge variant="destructive" className="gap-1 text-2xs py-0 px-1.5">
                          <Flame className="h-2.5 w-2.5" />{t('tasks.managerOverview.atRisk')}
                        </Badge>
                      )}
                      {riskLevel === 'medium' && (
                        <Badge className="bg-chart-5/10 text-chart-5 gap-1 text-2xs py-0 px-1.5">
                          <AlertTriangle className="h-2.5 w-2.5" />{t('tasks.managerOverview.warning')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {member.role && <span>{member.role}</span>}
                      {member.role && member.department && <span>·</span>}
                      {member.department && <span>{member.department}</span>}
                    </div>
                  </div>
                </div>

                {/* Desktop stats */}
                <div className="hidden sm:flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xs font-bold">{member.active}</div>
                    <p className="text-2xs text-muted-foreground">{t('tasks.stats.active')}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-chart-1">{member.completed}</div>
                    <p className="text-2xs text-muted-foreground">{t('tasks.stats.completed')}</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-bold ${member.overdue > 0 ? 'text-destructive' : ''}`}>{member.overdue}</div>
                    <p className="text-2xs text-muted-foreground">{t('tasks.stats.overdue')}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-chart-5">{member.highPriority}</div>
                    <p className="text-2xs text-muted-foreground">P1</p>
                  </div>
                  <div className="w-20">
                    <div className="flex items-center justify-between text-2xs mb-0.5">
                      <span className="text-muted-foreground">{t('tasks.managerOverview.avgProgress')}</span>
                      <span className="font-medium">{member.avgProgress}%</span>
                    </div>
                    <Progress value={member.avgProgress} className="h-1" />
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 pb-3">
              {/* Mobile stats */}
              <div className="sm:hidden grid grid-cols-4 gap-2 text-center mb-3 py-2 px-2 rounded-lg bg-muted/20">
                <div>
                  <div className="text-sm font-bold">{member.active}</div>
                  <p className="text-2xs text-muted-foreground">{t('tasks.stats.active')}</p>
                </div>
                <div>
                  <div className="text-sm font-bold text-chart-1">{member.completed}</div>
                  <p className="text-2xs text-muted-foreground">{t('tasks.stats.completed')}</p>
                </div>
                <div>
                  <div className={`text-sm font-bold ${member.overdue > 0 ? 'text-destructive' : ''}`}>{member.overdue}</div>
                  <p className="text-2xs text-muted-foreground">{t('tasks.stats.overdue')}</p>
                </div>
                <div>
                  <div className="text-sm font-bold text-chart-5">{member.highPriority}</div>
                  <p className="text-2xs text-muted-foreground">P1</p>
                </div>
              </div>

              {memberTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t('teamWorkload.noTasksFound')}</p>
              ) : (
                <DataTable
                  columns={taskColumns}
                  data={memberTasks}
                  rowKey={row => row.id}
                  isLoading={false}
                  emptyMessage={t('teamWorkload.noTasksFound')}
                  bordered={false}
                />
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
