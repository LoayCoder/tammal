import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useUserRoles } from '@/hooks/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Key, Mail, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function UserProfile() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { permissions, isLoading: permissionsLoading, isSuperAdmin } = useUserPermissions();
  const { userRoles, isLoading: rolesLoading } = useUserRoles(user?.id);

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
      <div className="flex items-center gap-3">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.description')}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('profile.accountInfo')}
            </CardTitle>
            <CardDescription>{t('profile.accountInfoDescription')}</CardDescription>
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
          </CardContent>
        </Card>

        {/* Roles Card */}
        <Card>
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
      <Card>
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
    </div>
  );
}
