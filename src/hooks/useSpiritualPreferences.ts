import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SpiritualPreferences {
  id: string;
  user_id: string;
  enabled: boolean;
  prayer_enabled: boolean;
  quran_enabled: boolean;
  fasting_enabled: boolean;
  reminders_enabled: boolean;
  reminder_intensity: string;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  calculation_method: number;
  created_at: string;
  updated_at: string;
}

export function useSpiritualPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['spiritual-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('spiritual_preferences' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as SpiritualPreferences | null;
    },
    enabled: !!user?.id,
  });

  const upsertPreferences = useMutation({
    mutationFn: async (updates: Partial<SpiritualPreferences>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      if (preferences?.id) {
        const { data, error } = await supabase
          .from('spiritual_preferences' as any)
          .update(updates)
          .eq('id', preferences.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('spiritual_preferences' as any)
          .insert({ user_id: user.id, ...updates })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spiritual-preferences'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return {
    preferences,
    isLoading,
    upsertPreferences,
    isEnabled: preferences?.enabled ?? false,
    isPrayerEnabled: preferences?.enabled && preferences?.prayer_enabled,
  };
}
