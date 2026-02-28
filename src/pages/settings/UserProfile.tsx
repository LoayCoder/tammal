import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/auth/useAuth';
import { useUserPermissions } from '@/hooks/auth/useUserPermissions';
import { useUserRoles } from '@/hooks/org/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Key, Mail, Calendar, Pencil, Lock, Smartphone, Monitor, Trash2, History } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { ChangeEmailDialog } from '@/components/profile/ChangeEmailDialog';
import { ChangePasswordDialog } from '@/components/profile/ChangePasswordDialog';
import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog';
import { SessionManagementDialog } from '@/components/profile/SessionManagementDialog';
import { MFASetupDialog } from '@/components/profile/MFASetupDialog';
import { LoginActivityDialog } from '@/components/profile/LoginActivityDialog';
import { SpiritualPreferencesCard } from '@/components/spiritual/SpiritualPreferencesCard';

export default function UserProfile() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { permissions, isPending: permissionsLoading, isSuperAdmin } = useUserPermissions();
  const { userRoles, isPending: rolesLoading } = useUserRoles(user?.id);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [mfaDialogOpen, setMfaDialogOpen] = useState(false);
  const [loginActivityDialogOpen, setLoginActivityDialogOpen] = useState(false);

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Group permissions by category
  const { data: permissionDetails } = useQuery({
    queryKey: ['permission-details', permissions],
    queryFn: async () => {
      if (isSuperAdmin) {
        // Get all permissions for super admin
        const { data } = await supabase
          .from('permissions')
          .select('*')
          .order('category');
        return data || [];
      }
      
      if (permissions.length === 0) return [];
      
      const { data } = await supabase
        .from('permissions')
        .select('*')
        .in('code', permissions)
        .order('category');
      return data || [];
    },
    enabled: permissions.length > 0 || isSuperAdmin,
  });

  const groupedPermissions = permissionDetails?.reduce((acc, perm) => {
    const category = perm.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, typeof permissionDetails>) || {};

  const isRTL = i18n.language === 'ar';

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="glass-card border-0 rounded-xl p-6 flex items-center gap-3">
        <div className="bg-primary/10 rounded-lg p-2">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.description')}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info Card */}
        <Card className="glass-card border-0 rounded-xl">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('profile.accountInfo')}
              </CardTitle>
              <CardDescription>{t('profile.accountInfoDescription')}</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setEditDialogOpen(true)}
            >
              <Pencil className="me-2 h-4 w-4" />
              {t('profile.editProfile')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">
                  {profile?.full_name || t('profile.noName')}
                </h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('profile.memberSince')}</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.created_at ? formatDate(user.created_at) : '-'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('profile.lastSignIn')}</span>
                <span>{user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : '-'}</span>
              </div>
            </div>

            <Separator />

            {/* Security Actions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{t('profile.securitySettings')}</h4>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEmailDialogOpen(true)}
                >
                  <Mail className="me-2 h-4 w-4" />
                  {t('profile.changeEmail')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  <Lock className="me-2 h-4 w-4" />
                  {t('profile.changePassword')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setMfaDialogOpen(true)}
                >
                  <Smartphone className="me-2 h-4 w-4" />
                  {t('profile.twoFactorAuth')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSessionDialogOpen(true)}
                >
                  <Monitor className="me-2 h-4 w-4" />
                  {t('profile.manageSessions')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLoginActivityDialogOpen(true)}
                >
                  <History className="me-2 h-4 w-4" />
                  {t('profile.loginActivity')}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Danger Zone */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-destructive">{t('profile.dangerZone')}</h4>
              <Button 
                variant="outline" 
                size="sm"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setDeleteAccountDialogOpen(true)}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {t('profile.deleteAccount')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Roles Card */}
        <Card className="glass-card border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('profile.yourRoles')}
            </CardTitle>
            <CardDescription>{t('profile.rolesDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {rolesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-40" />
              </div>
            ) : isSuperAdmin ? (
              <div className="space-y-3">
                <Badge 
                  className="text-sm px-3 py-1"
                  style={{ backgroundColor: '#dc2626', color: 'white' }}
                >
                  {t('profile.superAdmin')}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {t('profile.superAdminDescription')}
                </p>
              </div>
            ) : userRoles.length === 0 ? (
              <p className="text-muted-foreground">{t('profile.noRoles')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userRoles.map((userRole) => {
                  const role = userRole.roles as any;
                  return (
                    <div key={userRole.id} className="space-y-1">
                      <Badge 
                        className="text-sm px-3 py-1"
                        style={{ 
                          backgroundColor: role?.color || '#6366f1', 
                          color: 'white' 
                        }}
                      >
                        {isRTL ? (role?.name_ar || role?.name) : role?.name}
                      </Badge>
                      {role?.description && (
                        <p className="text-xs text-muted-foreground ps-1">
                          {role.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permissions Card */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('profile.yourPermissions')}
          </CardTitle>
          <CardDescription>
            {isSuperAdmin 
              ? t('profile.allPermissionsGranted')
              : t('profile.permissionsDescription')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permissionsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : Object.keys(groupedPermissions).length === 0 ? (
            <p className="text-muted-foreground">{t('profile.noPermissions')}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div 
                  key={category} 
                  className="border rounded-lg p-4 space-y-2"
                >
                  <h4 className="font-medium capitalize text-sm text-primary">
                    {category}
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {perms.map((perm: any) => (
                      <Badge 
                        key={perm.id} 
                        variant="secondary"
                        className="text-xs"
                      >
                        {isRTL ? (perm.name_ar || perm.name) : perm.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spiritual Preferences */}
      <SpiritualPreferencesCard />

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentProfile={{
          full_name: profile?.full_name || null,
          avatar_url: profile?.avatar_url || null,
          email: user?.email,
        }}
        onSuccess={() => {
          // Refetch is handled by the hook
        }}
      />

      {/* Change Email Dialog */}
      <ChangeEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        currentEmail={user?.email}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={deleteAccountDialogOpen}
        onOpenChange={setDeleteAccountDialogOpen}
      />

      {/* Session Management Dialog */}
      <SessionManagementDialog
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
      />

      {/* MFA Setup Dialog */}
      <MFASetupDialog
        open={mfaDialogOpen}
        onOpenChange={setMfaDialogOpen}
      />

      {/* Login Activity Dialog */}
      <LoginActivityDialog
        open={loginActivityDialogOpen}
        onOpenChange={setLoginActivityDialogOpen}
      />
    </div>
  );
}
