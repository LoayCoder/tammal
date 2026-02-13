import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuditLog } from './useAuditLog';

export interface Invitation {
  id: string;
  code: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  tenant_id: string;
  branch_id: string | null;
  employee_id: string | null;
  expires_at: string;
  used: boolean;
  used_at: string | null;
  used_by: string | null;
  deleted_at: string | null;
  delivery_status: string;
  delivery_channel: string;
  email_sent_at: string | null;
  whatsapp_sent_at: string | null;
  last_send_error: string | null;
  metadata: Record<string, any>;
  created_at: string;
  created_by: string | null;
}

export interface CreateInvitationInput {
  email: string;
  full_name?: string;
  phone_number?: string;
  tenant_id: string;
  branch_id?: string;
  employee_id?: string;
  expiry_days?: number;
  delivery_channel?: 'email' | 'whatsapp';
}

// Generate 8-character alphanumeric code (excludes ambiguous chars: O, 0, I, 1, L)
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useTenantInvitations(tenantId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  const invitationsQuery = useQuery({
    queryKey: ['invitations', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateInvitationInput) => {
      const code = generateInvitationCode();
      const expiryDays = input.expiry_days || 7;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          code,
          email: input.email,
          full_name: input.full_name || null,
          phone_number: input.phone_number || null,
          tenant_id: input.tenant_id,
          branch_id: input.branch_id || null,
          employee_id: input.employee_id || null,
          expires_at: expiresAt.toISOString(),
          delivery_channel: input.delivery_channel || 'email',
          created_by: user.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      if (error) throw error;

      // Trigger email sending
      try {
        await supabase.functions.invoke('send-invitation-email', {
          body: {
            email: input.email,
            code,
            tenantName: 'New Tenant', // We might need to fetch this or pass it in
            fullName: input.full_name,
            expiresAt: expiresAt.toISOString(),
            inviteUrl: `${window.location.origin}/auth/accept-invite?code=${code}`,
            language: 'en', // Todo: Pass this from input
            tenant_id: input.tenant_id
          },
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // We don't throw here to avoid rolling back the invitation creation
        toast.error(t('invitations.emailSendError'));
      }

      return data as Invitation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', tenantId] });
      toast.success(t('invitations.createSuccess'));

      logEvent({
        tenant_id: data.tenant_id,
        entity_type: 'tenant',
        entity_id: data.id,
        action: 'create',
        changes: { after: data },
        metadata: { type: 'invitation' },
      });
    },
    onError: (error) => {
      toast.error(t('invitations.createError'));
      console.error('Create invitation error:', error);
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase
        .from('invitations')
        .update({
          delivery_status: 'pending',
          last_send_error: null,
        })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;

      if (error) throw error;

      // Fetch tenant details for the email
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', (data as any).tenant_id)
        .single();

      // Trigger edge function to send email
      try {
        await supabase.functions.invoke('send-invitation-email', {
          body: {
            email: (data as any).email,
            code: (data as any).code,
            tenantName: tenant?.name || 'Tammal',
            fullName: (data as any).full_name,
            expiresAt: (data as any).expires_at,
            inviteUrl: `${window.location.origin}/auth/accept-invite?code=${(data as any).code}`,
            // We ideally store language preference in invitation metadata or default to en
            language: (data as any).metadata?.language || 'en'
          },
        });
      } catch (emailError) {
        console.error('Failed to resend invitation email:', emailError);
        throw emailError;
      }

      return data as Invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', tenantId] });
      toast.success(t('invitations.resendSuccess'));
    },
    onError: (error) => {
      toast.error(t('invitations.resendError'));
      console.error('Resend invitation error:', error);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { data: before } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      const { error } = await supabase
        .from('invitations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', invitationId);

      if (error) throw error;
      return { id: invitationId, before };
    },
    onSuccess: ({ id, before }) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', tenantId] });
      toast.success(t('invitations.revokeSuccess'));

      logEvent({
        tenant_id: tenantId,
        entity_type: 'tenant',
        entity_id: id,
        action: 'delete',
        changes: { before },
        metadata: { type: 'invitation_revoke' },
      });
    },
    onError: (error) => {
      toast.error(t('invitations.revokeError'));
      console.error('Revoke invitation error:', error);
    },
  });

  // Get invitation status
  const getStatus = (invitation: Invitation): 'pending' | 'used' | 'expired' | 'revoked' => {
    if (invitation.deleted_at) return 'revoked';
    if (invitation.used) return 'used';
    if (new Date(invitation.expires_at) < new Date()) return 'expired';
    return 'pending';
  };

  // Calculate days remaining
  const getDaysRemaining = (invitation: Invitation): number => {
    const now = new Date();
    const expires = new Date(invitation.expires_at);
    const diffTime = expires.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return {
    invitations: invitationsQuery.data ?? [],
    isLoading: invitationsQuery.isLoading,
    error: invitationsQuery.error,
    createInvitation: createMutation.mutate,
    resendInvitation: resendMutation.mutate,
    revokeInvitation: revokeMutation.mutate,
    isCreating: createMutation.isPending,
    isResending: resendMutation.isPending,
    isRevoking: revokeMutation.isPending,
    getStatus,
    getDaysRemaining,
  };
}

// Hook to verify invitation code (for signup flow)
export function useVerifyInvitation(code?: string) {
  return useQuery({
    queryKey: ['invitation-verify', code],
    queryFn: async () => {
      if (!code) return null;

      const { data, error } = await supabase
        .from('invitations')
        .select('*, tenants(name)')
        .eq('code', code)
        .is('deleted_at', null)
        .is('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!code && code.length === 8,
  });
}
