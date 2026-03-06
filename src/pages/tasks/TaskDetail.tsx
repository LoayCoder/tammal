import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft, CheckCircle2, ShieldCheck, Lock, MessageSquare, ListChecks,
  Activity, Paperclip, Users, Clock, CalendarDays, ChevronLeft,
  Send, Trash2,
} from 'lucide-react';
import { useUnifiedTasks, type UnifiedTask } from '@/hooks/workload/useUnifiedTasks';
import { useTaskChecklists } from '@/hooks/tasks/useTaskChecklists';
import { useTaskComments } from '@/hooks/tasks/useTaskComments';
import { useTaskActivity } from '@/hooks/tasks/useTaskActivity';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  open: 'bg-chart-2/10 text-chart-2',
  in_progress: 'bg-chart-2/10 text-chart-2',
  under_review: 'bg-chart-4/10 text-chart-4',
  pending_approval: 'bg-chart-5/10 text-chart-5',
  completed: 'bg-chart-1/10 text-chart-1',
  verified: 'bg-primary/10 text-primary',
  rejected: 'bg-destructive/10 text-destructive',
  archived: 'bg-muted text-muted-foreground',
};

const PRIORITY_LABELS: Record<number, { label: string; className: string }> = {
  0: { label: 'Critical', className: 'text-destructive' },
  1: { label: 'High', className: 'text-chart-5' },
  2: { label: 'Medium', className: 'text-chart-4' },
  3: { label: 'Low', className: 'text-muted-foreground' },
};

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { employee } = useCurrentEmployee();
  const { tenantId } = useTenantId();
  const [commentText, setCommentText] = useState('');
  const [tab, setTab] = useState('comments');

  // Fetch single task
  const { data: task, isPending: taskLoading } = useQuery({
    queryKey: ['task-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_tasks')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return { ...data, comments: (data.comments as unknown as any[]) ?? [] } as unknown as UnifiedTask;
    },
    enabled: !!id,
  });

  const { checklists, isPending: checklistLoading, updateItem } = useTaskChecklists(id);
  const { comments, isPending: commentsLoading, addComment, removeComment } = useTaskComments(id);
  const { activities, isPending: activityLoading } = useTaskActivity(id);

  const handleAddComment = () => {
    if (!commentText.trim() || !employee || !id) return;
    addComment({ task_id: id, user_id: employee.id, comment_text: commentText.trim() });
    setCommentText('');
  };

  const handleToggleChecklist = (itemId: string, currentStatus: string) => {
    updateItem({ id: itemId, status: currentStatus === 'completed' ? 'pending' : 'completed' });
  };

  if (taskLoading) {
    return <div className="space-y-4 p-2"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;
  }

  if (!task) {
    return <div className="text-center text-muted-foreground py-20">{t('tasks.notFound')}</div>;
  }

  const priorityInfo = PRIORITY_LABELS[task.priority] ?? PRIORITY_LABELS[2];
  const statusClass = STATUS_COLORS[task.status] ?? STATUS_COLORS.draft;

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />{t('common.back')}
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">{task.title}</h1>
            {task.is_locked && <Lock className="h-4 w-4 text-chart-4" />}
          </div>
          {task.title_ar && <p className="text-sm text-muted-foreground" dir="rtl">{task.title_ar}</p>}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={statusClass}>{t(`tasks.status.${task.status}`)}</Badge>
            <Badge variant="outline" className={priorityInfo.className}>P{task.priority} — {priorityInfo.label}</Badge>
            <Badge variant="outline">{task.source_type}</Badge>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
          {task.due_date && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {t('tasks.fields.dueDate')}: {format(new Date(task.due_date), 'PPP')}
            </span>
          )}
          {task.estimated_minutes && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {task.estimated_minutes}m {t('tasks.fields.estimated')}
            </span>
          )}
        </div>
      </div>

      {/* Progress */}
      <Card className="border-0 bg-muted/30">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{t('tasks.fields.progress')}</span>
            <span className="font-bold">{task.progress}%</span>
          </div>
          <Progress value={task.progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Description */}
      {task.description && (
        <Card className="border-0">
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t('tasks.fields.description')}</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p></CardContent>
        </Card>
      )}

      {/* Tabs: Comments, Checklist, Activity */}
      <Card className="border-0">
        <CardContent className="p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="comments" className="gap-1.5 text-xs">
                <MessageSquare className="h-3.5 w-3.5" />{t('tasks.comments.title')} ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="checklist" className="gap-1.5 text-xs">
                <ListChecks className="h-3.5 w-3.5" />{t('tasks.checklist.title')} ({checklists.length})
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1.5 text-xs">
                <Activity className="h-3.5 w-3.5" />{t('tasks.activity.title')} ({activities.length})
              </TabsTrigger>
            </TabsList>

            {/* Comments */}
            <TabsContent value="comments" className="space-y-4">
              <ScrollArea className="max-h-[400px]">
                {commentsLoading ? <Skeleton className="h-20" /> : comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t('tasks.comments.empty')}</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map(c => (
                      <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{c.employee?.full_name ?? c.user_id.slice(0, 8)}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), 'PP p')}</span>
                          </div>
                          <p className="text-sm mt-1">{c.comment_text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="flex gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t('tasks.comments.placeholder')}
                  rows={2}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleAddComment} disabled={!commentText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Checklist */}
            <TabsContent value="checklist">
              {checklistLoading ? <Skeleton className="h-20" /> : checklists.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t('tasks.checklist.empty')}</p>
              ) : (
                <div className="space-y-2">
                  {checklists.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                      <Checkbox
                        checked={item.status === 'completed'}
                        onCheckedChange={() => handleToggleChecklist(item.id, item.status)}
                      />
                      <span className={`text-sm flex-1 ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {item.title}
                      </span>
                      {item.due_date && (
                        <span className="text-xs text-muted-foreground">{format(new Date(item.due_date), 'PP')}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Activity Log */}
            <TabsContent value="activity">
              {activityLoading ? <Skeleton className="h-20" /> : activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t('tasks.activity.empty')}</p>
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <div className="relative ps-6 space-y-4">
                    <div className="absolute start-2 top-2 bottom-2 w-px bg-border" />
                    {activities.map(a => (
                      <div key={a.id} className="relative">
                        <div className="absolute -start-[18px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium capitalize">{a.action.replace(/_/g, ' ')}</span>
                            {a.employee?.full_name && <span className="text-xs text-muted-foreground">— {a.employee.full_name}</span>}
                            <span className="text-xs text-muted-foreground">{format(new Date(a.created_at), 'PP p')}</span>
                          </div>
                          {a.details && Object.keys(a.details).length > 0 && (
                            <p className="text-xs text-muted-foreground">{JSON.stringify(a.details)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
