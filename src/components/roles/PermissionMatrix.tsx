import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePermissions, useRolePermissions } from '@/hooks/usePermissions';
import type { Role } from '@/hooks/useRoles';
import { Key, Loader2, Shield, Users, FileText, Settings, BarChart3, Calendar, ClipboardList } from 'lucide-react';

interface PermissionMatrixProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Users: <Users className="h-4 w-4" />,
  Roles: <Shield className="h-4 w-4" />,
  Admin: <Settings className="h-4 w-4" />,
  Employees: <Users className="h-4 w-4" />,
  Reports: <BarChart3 className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
  Questions: <ClipboardList className="h-4 w-4" />,
  Schedules: <Calendar className="h-4 w-4" />,
};

export function PermissionMatrix({ open, onOpenChange, role }: PermissionMatrixProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { permissionsByCategory, isLoading: permissionsLoading } = usePermissions();
  const { permissionIds, updateRolePermissions, isLoading: rolePermissionsLoading } = useRolePermissions(role?.id);
  
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (permissionIds) {
      setSelectedPermissions(permissionIds);
    }
  }, [permissionIds]);

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  const handleCategoryToggle = (categoryPermissions: string[], checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...new Set([...prev, ...categoryPermissions])]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => !categoryPermissions.includes(id)));
    }
  };

  const handleSave = async () => {
    if (!role) return;
    
    setIsSaving(true);
    try {
      await updateRolePermissions.mutateAsync({
        roleId: role.id,
        permissionIds: selectedPermissions,
      });
      onOpenChange(false);
    } catch (error) {
      logger.error('PermissionMatrix', 'Error saving permissions', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = permissionsLoading || rolePermissionsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('roles.managePermissions')}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {role && (
              <Badge
                style={{ backgroundColor: role.color + '20', color: role.color }}
                variant="outline"
              >
                {isRTL && role.name_ar ? role.name_ar : role.name}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pe-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {permissionsByCategory.map((category) => {
                const categoryPermissionIds = category.permissions.map(p => p.id);
                const allSelected = categoryPermissionIds.every(id => selectedPermissions.includes(id));
                const someSelected = categoryPermissionIds.some(id => selectedPermissions.includes(id));

                return (
                  <div key={category.category} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {CATEGORY_ICONS[category.category] || <FileText className="h-4 w-4" />}
                        <h4 className="font-medium">{category.category}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {categoryPermissionIds.filter(id => selectedPermissions.includes(id)).length}/{categoryPermissionIds.length}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={allSelected}
                          ref={(el) => {
                            if (el) {
                              (el as unknown as HTMLInputElement).indeterminate = someSelected && !allSelected;
                            }
                          }}
                          onCheckedChange={(checked) => handleCategoryToggle(categoryPermissionIds, checked as boolean)}
                        />
                        <Label className="text-sm text-muted-foreground">
                          {t('permissions.selectAll')}
                        </Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {category.permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className={`flex items-start space-x-3 rtl:space-x-reverse p-3 rounded-lg border transition-colors ${
                            selectedPermissions.includes(permission.id)
                              ? 'bg-primary/5 border-primary/20'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            id={`perm-${permission.id}`}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked as boolean)}
                          />
                          <div className="flex-1 space-y-0.5">
                            <Label
                              htmlFor={`perm-${permission.id}`}
                              className="font-medium cursor-pointer text-sm"
                            >
                              {isRTL && permission.name_ar ? permission.name_ar : permission.name}
                            </Label>
                            {(isRTL ? permission.description_ar : permission.description) && (
                              <p className="text-xs text-muted-foreground">
                                {isRTL && permission.description_ar ? permission.description_ar : permission.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              {t('permissions.selected', { count: selectedPermissions.length })}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
