import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { format, addMonths, addDays, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

interface CreatePeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: { id: string; name: string; name_ar: string | null; color: string }[];
  subcategories: { id: string; category_id: string; name: string; name_ar: string | null; color: string }[];
  onConfirm: (params: {
    periodType: string;
    startDate: string;
    endDate: string;
    lockedCategoryIds: string[];
    lockedSubcategoryIds: string[];
  }) => void;
  isCreating: boolean;
}

export function CreatePeriodDialog({
  open,
  onOpenChange,
  categories,
  subcategories,
  onConfirm,
  isCreating,
}: CreatePeriodDialogProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const [periodType, setPeriodType] = useState('monthly');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);

  const handlePeriodTypeChange = (type: string) => {
    setPeriodType(type);
    const now = new Date();
    if (type === 'monthly') {
      setStartDate(format(now, 'yyyy-MM-dd'));
      setEndDate(format(addMonths(now, 1), 'yyyy-MM-dd'));
    } else if (type === 'quarterly') {
      setStartDate(format(startOfQuarter(now), 'yyyy-MM-dd'));
      setEndDate(format(endOfQuarter(now), 'yyyy-MM-dd'));
    } else {
      setStartDate(format(startOfYear(now), 'yyyy-MM-dd'));
      setEndDate(format(endOfYear(now), 'yyyy-MM-dd'));
    }
  };

  const filteredSubs = subcategories.filter(s => selectedCatIds.includes(s.category_id));

  const toggleCat = (id: string) => {
    if (selectedCatIds.includes(id)) {
      setSelectedCatIds(prev => prev.filter(c => c !== id));
      const orphanSubs = subcategories.filter(s => s.category_id === id).map(s => s.id);
      setSelectedSubIds(prev => prev.filter(s => !orphanSubs.includes(s)));
    } else {
      setSelectedCatIds(prev => [...prev, id]);
    }
  };

  const toggleSub = (id: string) => {
    setSelectedSubIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getLabel = (item: { name: string; name_ar: string | null }) =>
    isRTL && item.name_ar ? item.name_ar : item.name;

  const handleSubmit = () => {
    onConfirm({
      periodType,
      startDate,
      endDate,
      lockedCategoryIds: selectedCatIds,
      lockedSubcategoryIds: selectedSubIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('aiGenerator.createPeriod')}</DialogTitle>
          <DialogDescription>{t('aiGenerator.createPeriodDesc', 'Lock categories & subcategories for a generation period')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Period Type */}
          <div className="space-y-2">
            <Label>{t('aiGenerator.periodType')}</Label>
            <Select value={periodType} onValueChange={handlePeriodTypeChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{t('aiGenerator.periodMonthly')}</SelectItem>
                <SelectItem value="quarterly">{t('aiGenerator.periodQuarterly')}</SelectItem>
                <SelectItem value="annual">{t('aiGenerator.periodAnnual')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">{t('common.from')}</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('common.to')}</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Lock Categories */}
          <div className="space-y-2">
            <Label>{t('aiGenerator.category')}</Label>
            <ScrollArea className="h-[140px] rounded-md border p-2">
              {categories.map(c => (
                <label key={c.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-accent rounded px-1">
                  <Checkbox checked={selectedCatIds.includes(c.id)} onCheckedChange={() => toggleCat(c.id)} />
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-sm truncate">{getLabel(c)}</span>
                </label>
              ))}
            </ScrollArea>
          </div>

          {/* Lock Subcategories */}
          {filteredSubs.length > 0 && (
            <div className="space-y-2">
              <Label>{t('aiGenerator.subcategory')}</Label>
              <ScrollArea className="h-[120px] rounded-md border p-2">
                {filteredSubs.map(s => (
                  <label key={s.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-accent rounded px-1">
                    <Checkbox checked={selectedSubIds.includes(s.id)} onCheckedChange={() => toggleSub(s.id)} />
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-sm truncate">{getLabel(s)}</span>
                  </label>
                ))}
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isCreating || selectedCatIds.length === 0}>
            {isCreating && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
