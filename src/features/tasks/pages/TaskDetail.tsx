import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Lock, MessageSquare, ListChecks,
  Activity, Paperclip, Clock, CalendarDays, ChevronLeft,
  Plus, Upload, FileIcon, X, Trash2,
} from 'lucide-react';
import { useTaskChecklists } from '@/features/tasks/hooks/useTaskChecklists';
import { TaskDependenciesPanel } from '@/features/tasks/components/TaskDependenciesPanel';
import { TaskTimeTrackingPanel } from '@/features/tasks/components/TaskTimeTrackingPanel';
import { TaskAIPanel } from '@/features/tasks/components/TaskAIPanel';
import { TaskCommentsPanel } from '@/features/tasks/components/TaskCommentsPanel';
import { TaskActivityTimeline } from '@/features/tasks/components/TaskActivityTimeline';
import { useTaskComments } from '@/features/tasks/hooks/useTaskComments';
import { useTaskActivity } from '@/features/tasks/hooks/useTaskActivity';
import { useTaskAttachments } from '@/features/tasks/hooks/useTaskAttachments';
import { useTaskDetail, useTaskUpdate } from '@/features/tasks/hooks/useTaskDetail';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['draft', 'open', 'in_progress', 'under_review', 'pending_approval', 'completed', 'rejected', 'archived'] as const;

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  open: 'bg-chart-2/10 text-chart-2',
  in_progress: 'bg-chart-2/10 text-chart-2',
  under_review: 'bg-chart-4/10 text-chart-4',
  pending_approval: 'bg-chart-5/10 text-chart-5',
  completed: 'bg-chart-1/10 text-chart-1',
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState('comments');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');

  const { task, taskLoading } = useTaskDetail(id);
  const updateTask = useTaskUpdate(id);

  const { checklists, isPending: checklistLoading, updateItem, createItem, removeItem } = useTaskChecklists(id);
  const { comments, isPending: commentsLoading, addComment, removeComment, editComment } = useTaskComments(id);
  const { activities, isPending: activityLoading } = useTaskActivity(id);
  const { attachments, isPending: attachmentsLoading, uploadFile, removeFile, isUploading } = useTaskAttachments(id);

  const handleToggleChecklist = (itemId: string, currentStatus: string) => {
    updateItem({ id: itemId, status: currentStatus === 'completed' ? 'pending' : 'completed' });
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistTitle.trim() || !id) return;
    createItem({ task_id: id, title: newChecklistTitle.trim(), sort_order: checklists.length });
    setNewChecklistTitle('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !employee) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('tasks.attachments.maxSizeError'));
      return;
    }
    uploadFile({ task_id: id, file, uploaded_by: employee.id });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveDescription = () => {
    updateTask.mutate({ description: editDesc });
    setIsEditingDesc(false);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
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

          {/* Inline status & priority controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={task.status}
              onValueChange={(v) => updateTask.mutate({ status: v })}
              disabled={task.is_locked}
            >
              <SelectTrigger className="w-[170px] h-8 text-xs">
                <Badge className={`${statusClass} pointer-events-none`}>{t(`tasks.status.${task.status}`)}</Badge>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s}>{t(`tasks.status.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(task.priority)}
              onValueChange={(v) => updateTask.mutate({ priority: parseInt(v) })}
              disabled={task.is_locked}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <Badge variant="outline" className={priorityInfo.className}>P{task.priority} — {priorityInfo.label}</Badge>
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3].map(p => (
                  <SelectItem key={p} value={String(p)}>P{p} — {PRIORITY_LABELS[p].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge variant="outline">{task.source_type}</Badge>
            {(task as any).employee?.full_name && (
              <Badge variant="secondary">{(task as any).employee.full_name}</Badge>
            )}
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

      {/* Description — click to edit */}
      <Card className="border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{t('tasks.fields.description')}</CardTitle>
            {!isEditingDesc && !task.is_locked && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => { setEditDesc(task.description ?? ''); setIsEditingDesc(true); }}
              >
                {t('common.edit')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingDesc ? (
            <div className="space-y-2">
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setIsEditingDesc(false)}>{t('common.cancel')}</Button>
                <Button size="sm" onClick={handleSaveDescription} disabled={updateTask.isPending}>{t('common.save')}</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {task.description || t('tasks.noDescription')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dependencies */}
      {id && <TaskDependenciesPanel taskId={id} />}

      {/* Time Tracking */}
      {id && <TaskTimeTrackingPanel taskId={id} />}

      {/* AI Insights */}
      {id && <TaskAIPanel taskId={id} />}

      {/* Tabs: Comments, Checklist, Attachments, Activity */}
      <Card className="border-0">
        <CardContent className="p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="comments" className="gap-1.5 text-xs">
                <MessageSquare className="h-3.5 w-3.5" />{t('tasks.comments.title')} ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="checklist" className="gap-1.5 text-xs">
                <ListChecks className="h-3.5 w-3.5" />{t('tasks.checklist.title')} ({checklists.length})
              </TabsTrigger>
              <TabsTrigger value="attachments" className="gap-1.5 text-xs">
                <Paperclip className="h-3.5 w-3.5" />{t('tasks.attachments.title')} ({attachments.length})
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1.5 text-xs">
                <Activity className="h-3.5 w-3.5" />{t('tasks.activity.title')} ({activities.length})
              </TabsTrigger>
            </TabsList>

            {/* Comments */}
            <TabsContent value="comments">
              <TaskCommentsPanel
                comments={comments}
                isLoading={commentsLoading}
                currentEmployeeId={employee?.id}
                onAdd={addComment}
                onRemove={removeComment}
                onEdit={editComment}
                taskId={id!}
              />
            </TabsContent>

            {/* Checklist */}
            <TabsContent value="checklist" className="space-y-4">
              {checklistLoading ? <Skeleton className="h-20" /> : checklists.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t('tasks.checklist.empty')}</p>
              ) : (
                <div className="space-y-2">
                  {checklists.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 group">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {/* Add checklist item */}
              <div className="flex gap-2">
                <Input
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  placeholder={t('tasks.checklist.addPlaceholder')}
                  className="flex-1 h-9"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddChecklistItem(); }}
                />
                <Button size="sm" onClick={handleAddChecklistItem} disabled={!newChecklistTitle.trim()} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />{t('common.add')}
                </Button>
              </div>
            </TabsContent>

            {/* Attachments */}
            <TabsContent value="attachments" className="space-y-4">
              {attachmentsLoading ? <Skeleton className="h-20" /> : attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t('tasks.attachments.empty')}</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 group">
                      <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <a
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:underline truncate block"
                        >
                          {att.file_name}
                        </a>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(att.file_size)} · {format(new Date(att.created_at), 'PP')}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => removeFile(att.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {isUploading ? t('tasks.attachments.uploading') : t('tasks.attachments.upload')}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">{t('tasks.attachments.maxSize')}</p>
              </div>
            </TabsContent>

            {/* Activity Log */}
            <TabsContent value="activity">
              <TaskActivityTimeline activities={activities} isLoading={activityLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
