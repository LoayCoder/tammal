import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Department } from '@/hooks/useDepartments';
import type { Employee } from '@/hooks/useEmployees';

interface DepartmentTreeProps {
  departments: Department[];
  employees: Employee[];
  onEdit: (department: Department) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

function buildTree(departments: Department[], parentId: string | null = null): Department[] {
  return departments
    .filter(d => d.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

function DepartmentNode({
  department, departments, employees, onEdit, onDelete, onAddChild, level = 0,
}: {
  department: Department;
  departments: Department[];
  employees: Employee[];
  onEdit: (d: Department) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  level?: number;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(level < 1);
  const children = buildTree(departments, department.id);
  const hasChildren = children.length > 0;
  const empCount = employees.filter(e => (e as any).department_id === department.id).length;
  const headEmployee = department.head_employee_id
    ? employees.find(e => e.id === department.head_employee_id)
    : null;
  const displayName = i18n.language === 'ar' && department.name_ar ? department.name_ar : department.name;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50 group"
        style={{ paddingInlineStart: `${level * 24 + 12}px` }}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
            <ChevronRight
              className={`h-4 w-4 transition-transform rtl:-scale-x-100 ${open ? 'rotate-90' : ''} ${!hasChildren ? 'opacity-0' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>
        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: department.color }}
        />
        <span className="font-medium flex-1 text-start">{displayName}</span>
        {headEmployee && (
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {headEmployee.full_name}
          </span>
        )}
        {empCount > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" /> {empCount}
          </Badge>
        )}
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddChild(department.id)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(department)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('organization.deleteDepartment')}</AlertDialogTitle>
                <AlertDialogDescription>{t('organization.confirmDeleteDept')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(department.id)}>{t('common.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {hasChildren && (
        <CollapsibleContent>
          {children.map(child => (
            <DepartmentNode
              key={child.id}
              department={child}
              departments={departments}
              employees={employees}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              level={level + 1}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

export function DepartmentTree({ departments, employees, onEdit, onDelete, onAddChild }: DepartmentTreeProps) {
  const { t } = useTranslation();
  const rootDepartments = buildTree(departments, null);

  if (rootDepartments.length === 0) {
    return <p className="text-muted-foreground text-center py-8">{t('common.noData')}</p>;
  }

  return (
    <div className="space-y-1">
      {rootDepartments.map(dept => (
        <DepartmentNode
          key={dept.id}
          department={dept}
          departments={departments}
          employees={employees}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
        />
      ))}
    </div>
  );
}
