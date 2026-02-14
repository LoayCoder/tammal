import { useState, useEffect } from 'react';
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
import { useRoles, Role } from '@/hooks/useRoles';
import { useUserRoles } from '@/hooks/useUsers';
import type { UserWithRoles } from '@/hooks/useUsers';
import { Shield, Loader2 } from 'lucide-react';

interface UserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRoles | null;
  tenantId?: string;
}

export function UserRoleDialog({ open, onOpenChange, user, tenantId }: UserRoleDialogProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { roles, isLoading: rolesLoading } = useRoles(tenantId);
  const { userRoles, assignRole, removeRole } = useUserRoles(user?.user_id);
  
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const userRoleIds = userRoles
    ?.filter(ur => ur.custom_role_id)
    .map(ur => ur.custom_role_id as string)
    .sort()
    .join(',') || '';

  useEffect(() => {
    if (user && open) {
      setSelectedRoles(userRoleIds ? userRoleIds.split(',') : []);
    }
  }, [user?.user_id, open, userRoleIds]);

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, roleId]);
    } else {
      setSelectedRoles(prev => prev.filter(id => id !== roleId));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Find roles to add and remove
      const currentRoleIds = userRoles
        .filter(ur => ur.custom_role_id)
        .map(ur => ur.custom_role_id as string);
      
      const rolesToAdd = selectedRoles.filter(id => !currentRoleIds.includes(id));
      const rolesToRemove = userRoles.filter(
        ur => ur.custom_role_id && !selectedRoles.includes(ur.custom_role_id)
      );

      // Remove roles
      for (const userRole of rolesToRemove) {
        await removeRole.mutateAsync(userRole.id);
      }

      // Add roles
      for (const roleId of rolesToAdd) {
        await assignRole.mutateAsync({ 
          userId: user.user_id, 
          customRoleId: roleId,
          role: 'user'
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving roles:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('users.manageRoles')}
          </DialogTitle>
          <DialogDescription>
            {user?.full_name || t('users.unnamed')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pe-4">
          {rolesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('roles.noRoles')}
            </div>
          ) : (
            <div className="space-y-4">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-start space-x-3 rtl:space-x-reverse p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                    disabled={role.is_system_role}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`role-${role.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {isRTL && role.name_ar ? role.name_ar : role.name}
                      </Label>
                      <Badge
                        style={{ backgroundColor: role.color + '20', color: role.color }}
                        variant="outline"
                        className="text-xs"
                      >
                        {role.base_role}
                      </Badge>
                      {role.is_system_role && (
                        <Badge variant="secondary" className="text-xs">
                          {t('roles.system')}
                        </Badge>
                      )}
                    </div>
                    {(isRTL ? role.description_ar : role.description) && (
                      <p className="text-sm text-muted-foreground">
                        {isRTL && role.description_ar ? role.description_ar : role.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
