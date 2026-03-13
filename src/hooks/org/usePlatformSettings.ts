import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/auth/useAuth';

interface PlatformSettings {
  id: string;
  allow_public_signup: boolean;
  show_invitation_link: boolean;
  updated_at: string;
  updated_by: string | null;
}

export function usePlatformSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Pre-auth: use public RPC; post-auth: use direct table query
  const { data, isPending } = useQuery({
    queryKey: ['platform-settings', !!user],
    queryFn: async () => {
      if (user) {
        // Authenticated — full access
        const { data, error } = await supabase
          .from('platform_settings')
          .select('*')
          .limit(1)
          .single();
        if (error) throw error;
        return data as unknown as PlatformSettings;
      } else {
        // Pre-auth — use public RPC (returns only safe fields)
        const { data, error } = await supabase.rpc('get_public_platform_config');
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        return {
          id: '',
          allow_public_signup: row?.allow_public_signup ?? false,
          show_invitation_link: row?.show_invitation_link ?? true,
          updated_at: '',
          updated_by: null,
        } as PlatformSettings;
      }
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<Pick<PlatformSettings, 'allow_public_signup' | 'show_invitation_link'>>) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', data?.id ?? '');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
    },
  });

  return {
    allowSignup: data?.allow_public_signup ?? false,
    showInvitation: data?.show_invitation_link ?? true,
    isPending,
    settings: data,
    updateSettings,
  };
}

