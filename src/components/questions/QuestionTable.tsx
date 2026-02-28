import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CategoryBadge } from "./CategoryBadge";
import { Question } from "@/hooks/questions/useQuestions";
import { Edit2, Trash2, MoreHorizontal, Eye, EyeOff } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function ExpandableText({ text }: { text: string }) {
  if (!text || text === '-') return <span className="text-muted-foreground">-</span>;
  const isTruncated = text.length > 60;
  if (!isTruncated) return <p className="text-sm">{text}</p>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <p className="text-sm line-clamp-2 cursor-help">{text}</p>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-sm whitespace-pre-wrap">
        <p className="text-sm">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface QuestionTableProps {
  questions: Question[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

export function QuestionTable({
  questions,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onToggleStatus,
}: QuestionTableProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewQuestion, setViewQuestion] = useState<Question | null>(null);

  const toggleAll = () => {
    if (selectedIds.length === questions.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(questions.map((q) => q.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const getTypeLabel = (type: string) => {
    return t(`questions.types.${type}`);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === questions.length && questions.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="w-10">#</TableHead>
              <TableHead>{t('questions.questionTextEn')}</TableHead>
              <TableHead>{t('questions.questionTextAr')}</TableHead>
              <TableHead>{t('questions.category')}</TableHead>
              <TableHead>{t('questions.type')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="w-12">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {t('questions.noQuestions')}
                </TableCell>
              </TableRow>
            ) : (
              questions.map((question, index) => (
                <TableRow key={question.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(question.id)}
                      onCheckedChange={() => toggleOne(question.id)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{index + 1}</TableCell>
                  <TableCell className="max-w-xs cursor-pointer hover:bg-muted/50" onClick={() => setViewQuestion(question)}>
                    <ExpandableText text={question.text} />
                    {question.is_global && (
                      <Badge variant="secondary" className="mt-1">{t('questions.global')}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs cursor-pointer hover:bg-muted/50" dir="rtl" onClick={() => setViewQuestion(question)}>
                    <ExpandableText text={question.text_ar || '-'} />
                  </TableCell>
                  <TableCell>
                    {question.category && (
                      <CategoryBadge
                        name={question.category.name}
                        nameAr={question.category.name_ar}
                        color={question.category.color}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTypeLabel(question.type)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={question.is_active ? "default" : "secondary"}>
                      {question.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewQuestion(question)}>
                          <Eye className="h-4 w-4 me-2" />
                          {t('questions.viewQuestion')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(question)}>
                          <Edit2 className="h-4 w-4 me-2" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStatus(question.id, !question.is_active)}>
                          {question.is_active ? (
                            <>
                              <EyeOff className="h-4 w-4 me-2" />
                              {t('questions.deactivate')}
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 me-2" />
                              {t('questions.activate')}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeleteId(question.id)}
                        >
                          <Trash2 className="h-4 w-4 me-2" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('questions.deleteQuestion')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('questions.confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewQuestion} onOpenChange={() => setViewQuestion(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('questions.questionDetails')}</DialogTitle>
            <DialogDescription>{t('questions.viewQuestion')}</DialogDescription>
          </DialogHeader>

          {viewQuestion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t('questions.questionTextEn')}</p>
                <p className="text-sm bg-muted/50 rounded-md p-3">{viewQuestion.text}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t('questions.questionTextAr')}</p>
                <p className="text-sm bg-muted/50 rounded-md p-3" dir="rtl">
                  {viewQuestion.text_ar || '-'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {viewQuestion.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('questions.category')}:</span>
                    <CategoryBadge
                      name={viewQuestion.category.name}
                      nameAr={viewQuestion.category.name_ar}
                      color={viewQuestion.category.color}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('questions.type')}:</span>
                  <Badge variant="outline">{getTypeLabel(viewQuestion.type)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('common.status')}:</span>
                  <Badge variant={viewQuestion.is_active ? "default" : "secondary"}>
                    {viewQuestion.is_active ? t('common.active') : t('common.inactive')}
                  </Badge>
                </div>
                {viewQuestion.is_global && (
                  <Badge variant="secondary">{t('questions.global')}</Badge>
                )}
              </div>

              {viewQuestion.type === 'multiple_choice' && viewQuestion.options && viewQuestion.options.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{t('questions.options')}</p>
                  <ol className="list-decimal list-inside space-y-1 bg-muted/50 rounded-md p-3">
                    {viewQuestion.options.map((opt, i) => (
                      <li key={i} className="text-sm">{opt}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewQuestion(null)}>
              {t('common.close')}
            </Button>
            <Button onClick={() => {
              if (viewQuestion) {
                onEdit(viewQuestion);
                setViewQuestion(null);
              }
            }}>
              {t('common.edit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
