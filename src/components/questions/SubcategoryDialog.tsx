import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuestionCategories } from "@/hooks/useQuestionCategories";
import { QuestionSubcategory, CreateSubcategoryInput } from "@/hooks/useQuestionSubcategories";

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E',
];

interface SubcategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcategory?: QuestionSubcategory | null;
  onSubmit: (data: CreateSubcategoryInput) => void;
  isLoading?: boolean;
  defaultCategoryId?: string;
  existingSubcategories?: QuestionSubcategory[];
}

export function SubcategoryDialog({
  open, onOpenChange, subcategory, onSubmit, isLoading, defaultCategoryId, existingSubcategories = [],
}: SubcategoryDialogProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const { categories } = useQuestionCategories();

  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [color, setColor] = useState("#6366F1");
  const [weight, setWeight] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [isGlobal, setIsGlobal] = useState(false);

  useEffect(() => {
    if (subcategory) {
      setCategoryId(subcategory.category_id);
      setName(subcategory.name);
      setNameAr(subcategory.name_ar || "");
      setDescription(subcategory.description || "");
      setDescriptionAr(subcategory.description_ar || "");
      setColor(subcategory.color);
      setWeight(subcategory.weight);
      setIsActive(subcategory.is_active);
      setIsGlobal(subcategory.is_global);
    } else {
      setCategoryId(defaultCategoryId || "");
      setName("");
      setNameAr("");
      setDescription("");
      setDescriptionAr("");
      setColor("#6366F1");
      setWeight(1);
      setIsActive(true);
      setIsGlobal(false);
    }
  }, [subcategory, open, defaultCategoryId]);

  // Deduplication: scope to siblings in same category
  const siblings = useMemo(() =>
    existingSubcategories.filter(s => s.category_id === categoryId && s.id !== subcategory?.id),
    [existingSubcategories, categoryId, subcategory?.id]
  );
  const isNameTaken = siblings.some(s => s.name.toLowerCase() === name.trim().toLowerCase());
  const isNameArTaken = !!(nameAr.trim() && siblings.some(s => s.name_ar?.toLowerCase() === nameAr.trim().toLowerCase()));
  const isColorTaken = siblings.some(s => s.color === color);
  const takenColors = new Set(siblings.map(s => s.color));

  const canSave = name.trim() && categoryId && !isNameTaken && !isNameArTaken && !isColorTaken;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSubmit({
      category_id: categoryId,
      name,
      name_ar: nameAr || undefined,
      description: description || undefined,
      description_ar: descriptionAr || undefined,
      color,
      weight,
      is_active: isActive,
      is_global: false,
    });
  };

  const activeCategories = categories.filter(c => c.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {subcategory ? t('subcategories.editSubcategory') : t('subcategories.addSubcategory')}
          </DialogTitle>
          <DialogDescription>
            {subcategory ? t('subcategories.editSubcategory') : t('subcategories.addSubcategory')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('subcategories.parentCategory')}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder={t('aiGenerator.selectCategory')} /></SelectTrigger>
              <SelectContent>
                {activeCategories.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {isRTL && c.name_ar ? c.name_ar : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('categories.name')} (English)</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
              {isNameTaken && (
                <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{t('subcategories.nameTaken')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('categories.name')} (العربية)</Label>
              <Input value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl" />
              {isNameArTaken && (
                <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{t('subcategories.nameArTaken')}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('categories.description')} (English)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>{t('categories.description')} (العربية)</Label>
            <Textarea value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} rows={2} dir="rtl" />
          </div>

          <div className="space-y-2">
            <Label>{t('categories.color')}</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => {
                const isTaken = takenColors.has(c) && c !== subcategory?.color;
                return (
                  <button key={c} type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 relative ${color === c ? 'border-foreground ring-2 ring-offset-2 ring-primary' : 'border-transparent'} ${isTaken ? 'opacity-40' : ''}`}
                    style={{ backgroundColor: c }} onClick={() => setColor(c)}>
                    {isTaken && <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
            {isColorTaken && (
              <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{t('subcategories.colorTaken')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('categories.weight')}</Label>
              <Input type="number" min={0} max={10} step={0.1} value={weight} onChange={e => setWeight(parseFloat(e.target.value))} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>{t('categories.isActive')}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isLoading || !canSave}>{subcategory ? t('common.save') : t('common.create')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
