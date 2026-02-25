import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    // Find credited points that have expired (not already processed)
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

    // Mark originals as expired
    const ids = expiredTxns.map(t => t.id);
    const { error: updateErr } = await supabase
      .from('points_transactions')
      .update({ status: 'expired' })
      .in('id', ids);

    if (updateErr) throw updateErr;

    // No need to insert separate debit records - the original transaction
    // status change to 'expired' is sufficient. The balance calculation
    // only sums 'credited' and 'redeemed' status transactions.

    return new Response(JSON.stringify({ expired: expiredTxns.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
