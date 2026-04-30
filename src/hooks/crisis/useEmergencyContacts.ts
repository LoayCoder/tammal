import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import type { TableInsert, TableUpdate } from '@/lib/supabase-types';
import type { EmergencyContact } from './types';

export function useEmergencyContacts(tenantId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: contacts = [], isPending } = useQuery({
    queryKey: ['mh-emergency-contacts', tenantId],
    queryFn: async () => {
      let query = supabase.from('mh_emergency_contacts').select('*').is('deleted_at', null).order('sort_order');
      if (tenantId) query = query.eq('tenant_id', tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as EmergencyContact[];
    },
    enabled: !!user?.id,
  });
  const createContact = useMutation({
    mutationFn: async (data: Partial<EmergencyContact>) => {
      const { error } = await supabase.from('mh_emergency_contacts').insert(data as TableInsert<'mh_emergency_contacts'>);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-emergency-contacts'] }),
  });
  const updateContact = useMutation({
    mutationFn: async ({ id, ...data }: Partial<EmergencyContact> & { id: string }) => {
      const { error } = await supabase.from('mh_emergency_contacts').update(data as TableUpdate<'mh_emergency_contacts'>).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-emergency-contacts'] }),
  });
  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mh_emergency_contacts').update({ deleted_at: new Date().toISOString() } as TableUpdate<'mh_emergency_contacts'>).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-emergency-contacts'] }),
  });
  return { contacts, isPending, createContact, updateContact, deleteContact };
}