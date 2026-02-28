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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useRoles, Role } from '@/hooks/auth/useRoles';
import { useUserRoles } from '@/hooks/org/useUsers';
import { useHasRole } from '@/hooks/auth/useUserPermissions';
import { useAuth } from '@/hooks/auth/useAuth';
import type { UserWithRoles } from '@/hooks/org/useUsers';
import { Shield, Loader2, AlertTriangle } from 'lucide-react';

interface UserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRoles | null;
  tenantId?: string;
}

const SYSTEM_ROLES = ['super_admin', 'tenant_admin', 'manager', 'user'] as const;
type SystemRole = typeof SYSTEM_ROLES[number];

const SYSTEM_ROLE_COLORS: Record<SystemRole, string> = {
  super_admin: '#dc2626',
  tenant_admin: '#ea580c',
  manager: '#2563eb',
  user: '#16a34a',
};

export function UserRoleDialog({ open, onOpenChange, user, tenantId }: UserRoleDialogProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { roles, isPending: rolesLoading } = useRoles(tenantId);
  const { userRoles, assignRole, removeRole, updateUserRole } = useUserRoles(user?.user_id);
  const { hasRole: isSuperAdmin } = useHasRole('super_admin');
  const { user: currentUser } = useAuth();
  
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedSystemRole, setSelectedSystemRole] = useState<SystemRole>('user');
  const [isSaving, setIsSaving] = useState(false);

  // Get current system role from user_roles
  const currentSystemRole = userRoles.length > 0 ? userRoles[0]?.role as SystemRole : 'user';
  const isEditingSelf = currentUser?.id === user?.user_id;

  const userRoleIds = userRoles
    ?.filter(ur => ur.custom_role_id)
    .map(ur => ur.custom_role_id as string)
    .sort()
    .join(',') || '';

  useEffect(() => {
    if (user && open) {
      setSelectedRoles(userRoleIds ? userRoleIds.split(',') : []);
      setSelectedSystemRole(currentSystemRole);
    }
  }, [user?.user_id, open, userRoleIds, currentSystemRole]);

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, roleId]);
    } else {
      setSelectedRoles(prev => prev.filter(id => id !== roleId));
    }
  };

  // Determine the effective system role: if custom roles are selected, use the highest base_role
  const getEffectiveSystemRole = (): SystemRole => {
    if (selectedRoles.length === 0) return selectedSystemRole;
    
    const priority: Record<SystemRole, number> = { super_admin: 4, tenant_admin: 3, manager: 2, user: 1 };
    let highest: SystemRole = selectedSystemRole;
    
    for (const roleId of selectedRoles) {
      const roleObj = roles.find(r => r.id === roleId);
      if (roleObj?.base_role) {
        const br = roleObj.base_role as SystemRole;
        if (priority[br] > priority[highest]) {
          highest = br;
        }
      }
    }
    
    return highest;
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const currentRoleIds = userRoles
        .filter(ur => ur.custom_role_id)
        .map(ur => ur.custom_role_id as string);
      
      const rolesToAdd = selectedRoles.filter(id => !currentRoleIds.includes(id));
      const rolesToRemove = userRoles.filter(
        ur => ur.custom_role_id && !selectedRoles.includes(ur.custom_role_id)
      );

      // Remove custom role assignments
      for (const userRole of rolesToRemove) {
        await removeRole.mutateAsync(userRole.id);
      }

      // Add custom role assignments
      for (const roleId of rolesToAdd) {
        const roleObj = roles.find(r => r.id === roleId);
        const baseRole = (roleObj?.base_role as SystemRole) || 'user';
        
        // Check if user already has a user_roles row with this same system role value
        const existingRow = userRoles.find(ur => ur.role === baseRole && !ur.custom_role_id);
        
        if (existingRow) {
          await updateUserRole.mutateAsync({
            userRoleId: existingRow.id,
            customRoleId: roleId,
          });
        } else {
          await assignRole.mutateAsync({ 
            userId: user.user_id, 
            customRoleId: roleId,
            role: baseRole,
          });
        }
      }

      // Handle system role change (only if super_admin is making the change)
      const effectiveRole = getEffectiveSystemRole();
      if (effectiveRole !== currentSystemRole && isSuperAdmin) {
        // Update the primary user_roles row's system role
        const primaryRow = userRoles[0];
        if (primaryRow) {
          // We need to delete the old row and insert a new one since 'role' might conflict
          await removeRole.mutateAsync(primaryRow.id);
          await assignRole.mutateAsync({
            userId: user.user_id,
            customRoleId: primaryRow.custom_role_id || undefined,
            role: effectiveRole,
          });
        }
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving roles:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Can current user change system roles?
  const canEditSystemRole = isSuperAdmin && !isEditingSelf;
  // Available system roles for the selector (super_admins shouldn't be demoted by non-super_admins)
  const availableSystemRoles = SYSTEM_ROLES.filter(r => {
    // Only super_admins can assign super_admin
    if (r === 'super_admin' && !isSuperAdmin) return false;
    return true;
  });

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
          {/* System Role Section */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <Label className="font-semibold text-sm">{t('roles.systemRole', 'System Role')}</Label>
              <Badge
                style={{ backgroundColor: SYSTEM_ROLE_COLORS[currentSystemRole] + '20', color: SYSTEM_ROLE_COLORS[currentSystemRole] }}
                variant="outline"
                className="text-xs"
              >
                {currentSystemRole}
              </Badge>
            </div>

            {canEditSystemRole ? (
              <Select value={selectedSystemRole} onValueChange={(v) => setSelectedSystemRole(v as SystemRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableSystemRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: SYSTEM_ROLE_COLORS[role] }}
                        />
                        {role.replace('_', ' ')}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                {isEditingSelf
                  ? t('roles.cannotEditOwnSystemRole', 'You cannot change your own system role')
                  : t('roles.onlySuperAdminCanEdit', 'Only super admins can change system roles')
                }
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Custom Roles Section */}
          <div className="space-y-3">
            <Label className="font-semibold text-sm">{t('roles.customRoles', 'Custom Roles')}</Label>
            
            {rolesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('roles.noRoles')}
              </div>
            ) : (
              <div className="space-y-3">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
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
          </div>
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