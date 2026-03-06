import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Trash2, Pencil, X, Check, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import type { TaskComment } from '@/hooks/tasks/useTaskComments';

interface TaskCommentsPanelProps {
  comments: TaskComment[];
  isLoading: boolean;
  currentEmployeeId?: string;
  onAdd: (params: { task_id: string; user_id: string; comment_text: string }) => void;
  onRemove: (id: string) => void;
  onEdit: (params: { id: string; comment_text: string }) => void;
  taskId: string;
}

export function TaskCommentsPanel({
  comments, isLoading, currentEmployeeId, onAdd, onRemove, onEdit, taskId,
}: TaskCommentsPanelProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleSend = () => {
    if (!text.trim() || !currentEmployeeId) return;
    onAdd({ task_id: taskId, user_id: currentEmployeeId, comment_text: text.trim() });
    setText('');
  };

  const handleStartEdit = (c: TaskComment) => {
    setEditingId(c.id);
    setEditText(c.comment_text);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editText.trim()) return;
    onEdit({ id: editingId, comment_text: editText.trim() });
    setEditingId(null);
    setEditText('');
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (isLoading) return <Skeleton className="h-32" />;

  return (
    <div className="space-y-4">
      <ScrollArea className="max-h-[500px]">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">{t('tasks.comments.empty')}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {comments.map((c, idx) => {
              const isOwn = currentEmployeeId === c.user_id;
              const isEditing = editingId === c.id;
              const showDateSep = idx === 0 || format(new Date(c.created_at), 'PP') !== format(new Date(comments[idx - 1].created_at), 'PP');

              return (
                <div key={c.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-3 py-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {format(new Date(c.created_at), 'PP')}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  <div className={`flex gap-3 p-3 rounded-lg group transition-colors hover:bg-muted/40 ${isOwn ? 'bg-primary/5' : 'bg-muted/20'}`}>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-[10px]">
                        {getInitials(c.employee?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold truncate">
                          {c.employee?.full_name ?? c.user_id.slice(0, 8)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), 'p')}</span>
                          {c.updated_at !== c.created_at && (
                            <span className="text-[10px] text-muted-foreground italic">({t('tasks.comments.edited')})</span>
                          )}
                          {isOwn && !isEditing && (
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartEdit(c)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(c.id)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {isEditing ? (
                        <div className="mt-1.5 space-y-2">
                          <Textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2} className="text-sm" />
                          <div className="flex gap-1.5 justify-end">
                            <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => setEditingId(null)}>
                              <X className="h-3 w-3" />{t('common.cancel')}
                            </Button>
                            <Button size="sm" className="h-7 gap-1" onClick={handleSaveEdit} disabled={!editText.trim()}>
                              <Check className="h-3 w-3" />{t('common.save')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm mt-1 whitespace-pre-wrap break-words">{c.comment_text}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Compose area */}
      <div className="flex gap-2 items-end border-t pt-3">
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('tasks.comments.placeholder')}
          rows={2}
          className="flex-1 resize-none"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <Button size="icon" onClick={handleSend} disabled={!text.trim()} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
