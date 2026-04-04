import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Lock, MessageSquare, ListChecks,
  Activity, Paperclip, Clock, CalendarDays, ChevronLeft,
  Plus, Upload, FileIcon, X, Trash2, Play, Square, Timer,
  Brain, Users, AlertTriangle, ArrowUpDown, GitBranch, Link2,
  Send,
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

import { getValidNextStatuses, STATUS_COLORS } from '@/features/tasks/constants/taskLifecycle';

const PRIORITY_LABELS: Record<number, { label: string; className: string }> = {
  0: { label: 'Critical', className: 'text-destructive' },
  1: { label: 'High', className: 'text-chart-5' },
  2: { label: 'Medium', className: 'text-chart-4' },
  3: { label: 'Low', className: 'text-muted-foreground' },
};

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { employee } = useCurrentEmployee();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAr = i18n.language === 'ar';

  const [tab, setTab] = useState('comments');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editDescAr, setEditDescAr] = useState('');

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
    updateTask.mutate({ description: editDesc, description_ar: editDescAr });
    setIsEditingDesc(false);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  if (taskLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!task) {
    return <div className="text-center text-muted-foreground py-20">{t('tasks.notFound')}</div>;
  }

  const priorityInfo = PRIORITY_LABELS[task.priority] ?? PRIORITY_LABELS[2];
  const statusClass = STATUS_COLORS[task.status] ?? STATUS_COLORS.draft;
  const assigneeName = (task as any).employee?.full_name;

  return (
    <div className="max-w-2xl mx-auto px-4 pb-8 space-y-5">

      {/* ── 1. Header ── */}
      <div className="space-y-3">
        {/* Top row: back + lock */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 -ms-2 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            <span className="text-xs">{t('common.back')}</span>
          </Button>
          {task.is_locked && <Lock className="h-4 w-4 text-chart-4" />}
        </div>

        {/* Title — language-aware (single language only) */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {(() => {
              const tenantName = (task as any).tenant?.name;
              const branchName = (task as any).employee?.branch?.name;
              const year = task.created_at ? new Date(task.created_at).getFullYear().toString().slice(-2) : '';
              const compositeId = tenantName && branchName && task.task_number
                ? `${tenantName} - ${branchName} - ${task.task_number} - ${year}`
                : task.task_number ? `#${task.task_number}` : null;
              return compositeId ? (
                <Badge
                  variant="outline"
                  className="text-2xs px-1.5 py-0 text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(compositeId);
                    toast.success(t('common.copied'));
                  }}
                >
                  {compositeId}
                </Badge>
              ) : null;
            })()}
          </div>
          <h1 className="text-lg font-semibold leading-tight tracking-tight" dir={isAr ? 'rtl' : 'ltr'}>
            {isAr ? (task.title_ar || task.title) : task.title}
          </h1>
        </div>

        {/* Badges row: status + priority */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={task.status}
            onValueChange={(v) => updateTask.mutate({ status: v })}
            disabled={task.is_locked}
          >
            <SelectTrigger className="w-auto h-7 border-0 p-0 shadow-none focus:ring-0">
              <Badge className={`${statusClass} text-2xs`}>{t(`tasks.status.${task.status}`)}</Badge>
            </SelectTrigger>
            <SelectContent>
              {getValidNextStatuses(task.status, !!task.reviewer_id).map(s => (
                <SelectItem key={s} value={s}>{t(`tasks.status.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(task.priority)}
            onValueChange={(v) => updateTask.mutate({ priority: parseInt(v) })}
            disabled={task.is_locked}
          >
            <SelectTrigger className="w-auto h-7 border-0 p-0 shadow-none focus:ring-0">
              <Badge variant="outline" className={`${priorityInfo.className} text-2xs`}>P{task.priority} · {priorityInfo.label}</Badge>
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3].map(p => (
                <SelectItem key={p} value={String(p)}>P{p} — {PRIORITY_LABELS[p].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assignee + metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {assigneeName && (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                  {assigneeName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span>{assigneeName}</span>
            </div>
          )}
          {task.due_date && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
              {format(new Date(task.due_date), 'PP')}
            </span>
          )}
          {task.estimated_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
              {task.estimated_minutes}m
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* ── 2. Time Tracking (Priority) ── */}
      {id && <TaskTimeTrackingPanel taskId={id} />}

      {/* ── 3. Progress ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{t('tasks.fields.progress')}</span>
          <span className="text-xs font-semibold">{task.progress}%</span>
        </div>
        <Progress value={task.progress} className="h-1.5 transition-all duration-500" />
      </div>

      {/* ── 4. Description — language-aware ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{t('tasks.fields.description')}</span>
          {!isEditingDesc && !task.is_locked && (
            <Button
              variant="ghost"
              size="sm"
              className="text-2xs h-6 px-2 text-muted-foreground"
              onClick={() => { setEditDesc(task.description ?? ''); setEditDescAr((task as any).description_ar ?? ''); setIsEditingDesc(true); }}
            >
              {t('common.edit')}
            </Button>
          )}
        </div>
        {isEditingDesc ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-2xs text-muted-foreground">{t('tasks.fields.description')} (EN)</span>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} className="text-sm" />
            </div>
            <div className="space-y-1">
              <span className="text-2xs text-muted-foreground">{t('tasks.fields.descriptionAr')} (AR)</span>
              <Textarea value={editDescAr} onChange={(e) => setEditDescAr(e.target.value)} rows={3} className="text-sm" dir="rtl" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditingDesc(false)}>{t('common.cancel')}</Button>
              <Button size="sm" className="h-7 text-xs" onClick={handleSaveDescription} disabled={updateTask.isPending}>{t('common.save')}</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/80 whitespace-pre-wrap leading-relaxed" dir={isAr ? 'rtl' : 'ltr'}>
            {isAr ? ((task as any).description_ar || task.description || t('tasks.noDescription')) : (task.description || t('tasks.noDescription'))}
          </p>
        )}
      </div>

      {/* ── 5. Dependencies ── */}
      {id && <TaskDependenciesPanel taskId={id} />}

      {/* ── 6. AI Insights ── */}
      {id && <TaskAIPanel taskId={id} />}

      {/* ── 7. Activity Section (Tabs) ── */}
      <div className="space-y-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full h-9 p-0.5 bg-muted/40 rounded-lg grid grid-cols-4">
            <TabsTrigger value="comments" className="text-2xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1">
              <MessageSquare className="h-3 w-3" strokeWidth={1.5} />
              {comments.length}
            </TabsTrigger>
            <TabsTrigger value="checklist" className="text-2xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1">
              <ListChecks className="h-3 w-3" strokeWidth={1.5} />
              {checklists.length}
            </TabsTrigger>
            <TabsTrigger value="attachments" className="text-2xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1">
              <Paperclip className="h-3 w-3" strokeWidth={1.5} />
              {attachments.length}
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-2xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1">
              <Activity className="h-3 w-3" strokeWidth={1.5} />
              {activities.length}
            </TabsTrigger>
          </TabsList>

          {/* Comments */}
          <TabsContent value="comments" className="mt-3">
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
          <TabsContent value="checklist" className="mt-3 space-y-3">
            {checklistLoading ? <Skeleton className="h-20" /> : checklists.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">{t('tasks.checklist.empty')}</p>
            ) : (
              <div className="space-y-1">
                {checklists.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-2 px-1 rounded-md hover:bg-muted/30 group transition-colors">
                    <Checkbox
                      checked={item.status === 'completed'}
                      onCheckedChange={() => handleToggleChecklist(item.id, item.status)}
                    />
                    <span className={`text-xs flex-1 ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                      {item.title}
                    </span>
                    {item.due_date && (
                      <span className="text-2xs text-muted-foreground">{format(new Date(item.due_date), 'PP')}</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                placeholder={t('tasks.checklist.addPlaceholder')}
                className="flex-1 h-8 text-xs"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddChecklistItem(); }}
              />
              <Button size="sm" onClick={handleAddChecklistItem} disabled={!newChecklistTitle.trim()} className="h-8 gap-1 text-xs">
                <Plus className="h-3 w-3" />{t('common.add')}
              </Button>
            </div>
          </TabsContent>

          {/* Attachments */}
          <TabsContent value="attachments" className="mt-3 space-y-3">
            {attachmentsLoading ? <Skeleton className="h-20" /> : attachments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">{t('tasks.attachments.empty')}</p>
            ) : (
              <div className="space-y-1">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-3 py-2 px-1 rounded-md hover:bg-muted/30 group transition-colors">
                    <FileIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <a
                        href={att.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium hover:underline truncate block"
                      >
                        {att.file_name}
                      </a>
                      <span className="text-2xs text-muted-foreground">
                        {formatFileSize(att.file_size)} · {format(new Date(att.created_at), 'PP')}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => removeFile(att.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-3 w-3" />
                {isUploading ? t('tasks.attachments.uploading') : t('tasks.attachments.upload')}
              </Button>
              <p className="text-2xs text-muted-foreground mt-1">{t('tasks.attachments.maxSize')}</p>
            </div>
          </TabsContent>

          {/* Activity Log */}
          <TabsContent value="activity" className="mt-3">
            <TaskActivityTimeline activities={activities} isLoading={activityLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
