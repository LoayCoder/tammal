import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export interface ChecklistItem {
  id?: string;
  title: string;
  status: string;
  assigned_to?: string | null;
  due_date?: string | null;
  sort_order: number;
}

interface TaskChecklistProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  disabled?: boolean;
}

export function TaskChecklist({ items, onChange, disabled }: TaskChecklistProps) {
  const { t } = useTranslation();
  const [newTitle, setNewTitle] = useState('');

  const addItem = useCallback(() => {
    if (!newTitle.trim()) return;
    onChange([...items, { title: newTitle.trim(), status: 'pending', sort_order: items.length }]);
    setNewTitle('');
  }, [items, newTitle, onChange]);

  const toggleItem = useCallback((index: number) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, status: item.status === 'completed' ? 'pending' : 'completed' } : item
    );
    onChange(updated);
  }, [items, onChange]);

  const removeItem = useCallback((index: number) => {
    onChange(items.filter((_, i) => i !== index));
  }, [items, onChange]);

  const completed = items.filter(i => i.status === 'completed').length;
  const total = items.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t('tasks.checklist.title')}</span>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {completed}/{total}
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
          />
        </div>
      )}

      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2 group">
            <Checkbox
              checked={item.status === 'completed'}
              onCheckedChange={() => toggleItem(index)}
              disabled={disabled}
            />
            <span className={`flex-1 text-sm ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
              {item.title}
            </span>
            {!disabled && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {!disabled && (
        <div className="flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t('tasks.checklist.addPlaceholder')}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
          />
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={addItem}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
