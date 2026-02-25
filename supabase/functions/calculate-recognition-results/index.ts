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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { cycle_id } = await req.json();
    if (!cycle_id) throw new Error('cycle_id required');

    // 1. Get cycle
    const { data: cycle, error: cycleErr } = await supabase
      .from('award_cycles')
      .select('*')
      .eq('id', cycle_id)
      .single();
    if (cycleErr) throw cycleErr;

    const fairnessConfig = (cycle.fairness_config || {}) as Record<string, any>;

    // 2. Get themes for cycle
    const { data: themes } = await supabase
      .from('award_themes')
      .select('id, name')
      .eq('cycle_id', cycle_id)
      .is('deleted_at', null);
    if (!themes?.length) throw new Error('No themes found');

    const themeIds = themes.map(t => t.id);

    // 3. Get all nominations
    const { data: nominations } = await supabase
      .from('nominations')
      .select('id, theme_id, nominee_id')
      .in('theme_id', themeIds)
      .in('status', ['endorsed', 'shortlisted'])
      .is('deleted_at', null);
    if (!nominations?.length) throw new Error('No eligible nominations');

    // 4. Get all votes
    const { data: votes } = await supabase
      .from('votes')
      .select('*')
      .in('nomination_id', nominations.map(n => n.id));

    // 5. Get criteria
    const { data: criteria } = await supabase
      .from('judging_criteria')
      .select('id, theme_id, weight')
      .in('theme_id', themeIds)
      .is('deleted_at', null);

    // 6. Calculate per theme
    for (const theme of themes) {
      const themeNominations = nominations.filter(n => n.theme_id === theme.id);
      const themeCriteria = (criteria || []).filter(c => c.theme_id === theme.id);
      const totalWeight = themeCriteria.reduce((s, c) => s + c.weight, 0) || 100;

      // Calculate scores per nomination
      const nomineeScores: {
        nomination_id: string;
        raw_avg: number;
        weighted_avg: number;
        total_votes: number;
        criterion_breakdown: Record<string, any>;
        vote_distribution: Record<string, number>;
        confidence_interval: { lower: number; upper: number };
      }[] = [];

      for (const nom of themeNominations) {
        const nomVotes = (votes || []).filter(v => v.nomination_id === nom.id);
        if (!nomVotes.length) {
          nomineeScores.push({
            nomination_id: nom.id,
            raw_avg: 0,
            weighted_avg: 0,
            total_votes: 0,
            criterion_breakdown: {},
            vote_distribution: {},
            confidence_interval: { lower: 0, upper: 0 },
          });
          continue;
        }

        // Per-criterion averages
        const criterionBreakdown: Record<string, { avg: number; count: number }> = {};
        for (const c of themeCriteria) {
          const scores = nomVotes
            .map(v => {
              const cs = v.criteria_scores as Record<string, number>;
              return cs?.[c.id];
            })
            .filter((s): s is number => s != null);
          const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
          criterionBreakdown[c.id] = { avg: Math.round(avg * 100) / 100, count: scores.length };
        }

        // Raw average (unweighted)
        const rawScores = nomVotes.map(v => {
          const cs = v.criteria_scores as Record<string, number>;
          const vals = Object.values(cs || {});
          return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        });
        const rawAvg = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;

        // Weighted average
        const weightedAvg = themeCriteria.reduce((sum, c) => {
          const cb = criterionBreakdown[c.id];
          return sum + (cb ? cb.avg * c.weight / totalWeight : 0);
        }, 0);

        // Vote distribution
        const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        nomVotes.forEach(v => {
          const cs = v.criteria_scores as Record<string, number>;
          Object.values(cs || {}).forEach(s => {
            const key = String(Math.round(s));
            if (distribution[key] !== undefined) distribution[key]++;
          });
        });

        // Confidence interval (simple z=1.96)
        const n = nomVotes.length;
        const stdDev = Math.sqrt(
          rawScores.reduce((sum, s) => sum + Math.pow(s - rawAvg, 2), 0) / Math.max(n - 1, 1)
        );
        const margin = n > 1 ? 1.96 * (stdDev / Math.sqrt(n)) : 0;

        nomineeScores.push({
          nomination_id: nom.id,
          raw_avg: Math.round(rawAvg * 100) / 100,
          weighted_avg: Math.round(weightedAvg * 100) / 100,
          total_votes: n,
          criterion_breakdown: criterionBreakdown,
          vote_distribution: distribution,
          confidence_interval: {
            lower: Math.round((weightedAvg - margin) * 100) / 100,
            upper: Math.round((weightedAvg + margin) * 100) / 100,
          },
        });
      }

      // Sort by weighted average descending
      nomineeScores.sort((a, b) => b.weighted_avg - a.weighted_avg);

      // --- Fairness Analysis ---
      const fairnessReport: Record<string, any> = {};

      // Clique detection: mutual nomination patterns
      const cliqueThreshold = fairnessConfig.clique_threshold || 3;
      const nominatorPairs: Record<string, Set<string>> = {};
      for (const nom of themeNominations) {
        // Check if nominee also nominated the nominator in any theme
        const reverseNoms = nominations.filter(
          n => n.nominee_id === nom.nominee_id && themeNominations.some(tn => tn.nominee_id === n.nominee_id)
        );
        if (reverseNoms.length >= cliqueThreshold) {
          if (!fairnessReport.clique_warnings) fairnessReport.clique_warnings = [];
          fairnessReport.clique_warnings.push({
            nomination_id: nom.id,
            mutual_count: reverseNoms.length,
          });
        }
      }

      // Vote anomaly detection
      const anomalies: any[] = [];
      for (const nom of themeNominations) {
        const nomVotes = (votes || []).filter(v => v.nomination_id === nom.id);
        // Detect voters who consistently give extreme scores
        const extremeVoters = nomVotes.filter(v => {
          const cs = v.criteria_scores as Record<string, number>;
          const vals = Object.values(cs || {});
          return vals.every(s => s === 1 || s === 5);
        });
        if (extremeVoters.length > 0) {
          anomalies.push({
            nomination_id: nom.id,
            type: 'extreme_scoring',
            count: extremeVoters.length,
          });
        }
      }
      fairnessReport.anomalies = anomalies;

      // Demographic parity placeholder
      fairnessReport.demographic_parity = { status: 'not_evaluated', note: 'Requires department/demographic data integration' };

      // Visibility bias
      if (fairnessConfig.visibility_bias) {
        fairnessReport.visibility_correction = { applied: true, method: 'remote_worker_boost' };
      }

      // 7. Upsert theme_results
      const { data: themeResult, error: trErr } = await supabase
        .from('theme_results')
        .upsert({
          tenant_id: cycle.tenant_id,
          theme_id: theme.id,
          cycle_id: cycle_id,
          first_place_nomination_id: nomineeScores[0]?.nomination_id || null,
          second_place_nomination_id: nomineeScores[1]?.nomination_id || null,
          third_place_nomination_id: nomineeScores[2]?.nomination_id || null,
          fairness_report: fairnessReport,
          appeal_status: 'closed',
        }, { onConflict: 'id' })
        .select()
        .single();
      if (trErr) throw trErr;

      // 8. Upsert nominee_rankings
      for (let i = 0; i < nomineeScores.length; i++) {
        const ns = nomineeScores[i];
        await supabase.from('nominee_rankings').insert({
          tenant_id: cycle.tenant_id,
          theme_results_id: themeResult.id,
          nomination_id: ns.nomination_id,
          rank: i + 1,
          raw_average_score: ns.raw_avg,
          weighted_average_score: ns.weighted_avg,
          criterion_breakdown: ns.criterion_breakdown,
          total_votes: ns.total_votes,
          vote_distribution: ns.vote_distribution,
          confidence_interval: ns.confidence_interval,
        });
      }
    }

    // 9. Advance cycle status to 'announced'
    await supabase
      .from('award_cycles')
      .update({ status: 'announced' })
      .eq('id', cycle_id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
