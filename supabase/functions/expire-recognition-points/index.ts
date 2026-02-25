import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date().toISOString();

    // Find credited points that have expired
    const { data: expiredTxns, error: fetchErr } = await supabase
      .from('points_transactions')
      .select('id, user_id, tenant_id, amount')
      .eq('status', 'credited')
      .lt('expires_at', now)
      .is('deleted_at', null);

    if (fetchErr) throw fetchErr;

    if (!expiredTxns || expiredTxns.length === 0) {
      return new Response(JSON.stringify({ expired: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark them as expired
    const ids = expiredTxns.map(t => t.id);
    const { error: updateErr } = await supabase
      .from('points_transactions')
      .update({ status: 'expired' })
      .in('id', ids);

    if (updateErr) throw updateErr;

    // Insert expiry debit records
    const expiryRecords = expiredTxns.map(t => ({
      user_id: t.user_id,
      tenant_id: t.tenant_id,
      amount: -t.amount,
      source_type: 'expiry' as const,
      source_id: t.id,
      status: 'expired' as const,
      description: 'Points expired',
    }));

    const { error: insertErr } = await supabase
      .from('points_transactions')
      .insert(expiryRecords);

    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ expired: expiredTxns.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
