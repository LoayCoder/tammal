import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { QuestionCategory, CreateCategoryInput } from "@/hooks/useQuestionCategories";

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E',
];

const ICONS = [
  'heart', 'brain', 'balance-scale', 'smile', 'users', 
  'target', 'trending-up', 'award', 'briefcase', 'star',
  'shield', 'zap', 'compass', 'flag', 'help-circle',
];

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: QuestionCategory | null;
  onSubmit: (data: CreateCategoryInput) => void;
  isLoading?: boolean;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
  isLoading,
}: CategoryDialogProps) {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [icon, setIcon] = useState("help-circle");
  const [weight, setWeight] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [isGlobal, setIsGlobal] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setNameAr(category.name_ar || "");
      setDescription(category.description || "");
      setDescriptionAr(category.description_ar || "");
      setColor(category.color);
      setIcon(category.icon);
      setWeight(category.weight);
      setIsActive(category.is_active);
      setIsGlobal(category.is_global);
    } else {
      setName("");
      setNameAr("");
      setDescription("");
      setDescriptionAr("");
      setColor("#3B82F6");
      setIcon("help-circle");
      setWeight(1);
      setIsActive(true);
      setIsGlobal(false);
    }
  }, [category, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      name_ar: nameAr || undefined,
      description: description || undefined,
      description_ar: descriptionAr || undefined,
      color,
      icon,
      weight,
      is_active: isActive,
      is_global: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? t('categories.editCategory') : t('categories.addCategory')}
          </DialogTitle>
          <DialogDescription>
            {category ? t('categories.editCategoryDescription') : t('categories.addCategoryDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('categories.name')} (English)</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr">{t('categories.name')} (العربية)</Label>
                <Input
                  id="nameAr"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('categories.description')} (English)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionAr">{t('categories.description')} (العربية)</Label>
              <Textarea
                id="descriptionAr"
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                rows={2}
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('categories.color')}</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      color === c ? 'border-foreground ring-2 ring-offset-2 ring-primary' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10 p-1 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">{t('categories.weight')}</Label>
                <Input
                  id="weight"
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">{t('categories.isActive')}</Label>
              </div>

            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {category ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
