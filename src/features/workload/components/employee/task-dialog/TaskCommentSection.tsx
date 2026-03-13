import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';
import type { TaskComment } from '@/features/workload/hooks/useUnifiedTasks';

interface TaskCommentSectionProps {
  comments: TaskComment[];
  employeeId: string;
  currentEmployeeName?: string;
  onAddComment?: (comment: { id: string; comment: TaskComment }) => void;
  taskId: string;
}

export function TaskCommentSection({ comments, employeeId, currentEmployeeName, onAddComment, taskId }: TaskCommentSectionProps) {
  const { t } = useTranslation();
  const [commentText, setCommentText] = useState('');

  const handleAddComment = () => {
    if (!commentText.trim() || !onAddComment) return;
    onAddComment({
      id: taskId,
      comment: {
        id: crypto.randomUUID(),
        employee_id: employeeId,
        employee_name: currentEmployeeName || 'User',
        text: commentText.trim(),
        created_at: new Date().toISOString(),
      },
    });
    setCommentText('');
  };

  return (
    <div className="space-y-2 border-t pt-3">
      <Label className="flex items-center gap-1.5">
        <MessageSquare className="h-3.5 w-3.5" />{t('workload.comments.title')} ({comments.length})
      </Label>
      {comments.length > 0 && (
        <ScrollArea className="max-h-32">
          <div className="space-y-2">
            {comments.map((c: TaskComment) => (
              <div key={c.id} className="text-xs bg-muted/50 rounded p-2">
                <div className="flex justify-between">
                  <span className="font-medium">{c.employee_name}</span>
                  <span className="text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-0.5">{c.text}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      {onAddComment && (
        <div className="flex gap-2">
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={t('workload.comments.placeholder')}
            className="text-xs"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(); } }}
          />
          <Button type="button" variant="outline" size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>
            {t('workload.comments.add')}
          </Button>
        </div>
      )}
    </div>
  );
}
