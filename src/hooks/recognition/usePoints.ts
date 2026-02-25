import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface PointsTransaction {
  id: string;
  user_id: string;
  tenant_id: string;
  amount: number;
  source_type: string;
  source_id: string | null;
  description: string | null;
  status: string;
  awarded_by: string | null;
  awarded_at: string;
  expires_at: string | null;
  created_at: string;
  deleted_at: string | null;
}

export function usePoints() {
  const { user } = useAuth();
  const { tenantId } = useTenantId();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['points-transactions', tenantId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .is('deleted_at', null)
        .eq('user_id', user!.id)
        .order('awarded_at', { ascending: false });
      if (error) throw error;
      return data as PointsTransaction[];
    },
    enabled: !!tenantId && !!user?.id,
  });

  // Balance = sum of all amounts (credits are positive, debits/redemptions are negative)
  // Only count 'credited' and 'redeemed' status - expired originals are already 
  // marked 'expired' and have corresponding negative debit records
  const balance = transactions
    .filter(t => t.status === 'credited' || t.status === 'redeemed')
    .reduce((sum, t) => sum + t.amount, 0);

  const expiringWithin30Days = transactions.filter(t => {
    if (t.status !== 'credited' || !t.expires_at) return false;
    const exp = new Date(t.expires_at);
    const now = new Date();
    const diffDays = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 30;
  }).reduce((sum, t) => sum + t.amount, 0);

  return { transactions, balance, expiringWithin30Days, isLoading };
}
