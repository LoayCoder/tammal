import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, X, Tag } from 'lucide-react';
import { useTaskTags, type TaskTag } from '@/hooks/tasks/useTaskTags';

interface TaskTagPickerProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  disabled?: boolean;
}

const TAG_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4'];

export function TaskTagPicker({ selectedTagIds, onChange, disabled }: TaskTagPickerProps) {
  const { t } = useTranslation();
  const { tags, createTagAsync } = useTaskTags();
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [open, setOpen] = useState(false);

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));
  const availableTags = tags.filter(tag => !selectedTagIds.includes(tag.id));

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const newTag = await createTagAsync({ name: newTagName.trim(), color: selectedColor });
      if (newTag) {
        onChange([...selectedTagIds, newTag.id]);
        setNewTagName('');
      }
    } catch {}
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{t('tasks.tags.title')}</span>
      <div className="flex flex-wrap gap-1">
        {selectedTags.map(tag => (
          <Badge key={tag.id} variant="secondary" className="gap-1" style={{ borderColor: tag.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
            {tag.name}
            {!disabled && (
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onChange(selectedTagIds.filter(id => id !== tag.id))}
              />
            )}
          </Badge>
        ))}
        {!disabled && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 gap-1 text-xs">
                <Tag className="h-3 w-3" />
                <Plus className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-3">
              {availableTags.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">{t('tasks.tags.existing')}</span>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent gap-1"
                        onClick={() => {
                          onChange([...selectedTagIds, tag.id]);
                          setOpen(false);
                        }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">{t('tasks.tags.createNew')}</span>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder={t('tasks.tags.namePlaceholder')}
                  className="h-7 text-xs"
                />
                <div className="flex gap-1">
                  {TAG_COLORS.map(c => (
                    <button
                      key={c}
                      className={`w-5 h-5 rounded-full border-2 ${selectedColor === c ? 'border-foreground' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setSelectedColor(c)}
                    />
                  ))}
                </div>
                <Button size="sm" className="w-full h-7 text-xs" onClick={handleCreateTag} disabled={!newTagName.trim()}>
                  {t('tasks.tags.create')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
