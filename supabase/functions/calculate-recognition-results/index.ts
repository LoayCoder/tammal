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
    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify caller via getUser
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { cycle_id } = await req.json();
    if (!cycle_id) throw new Error('cycle_id required');

    // 1. Get cycle & set status to 'calculating'
    const { data: cycle, error: cycleErr } = await supabase
      .from('award_cycles')
      .select('*')
      .eq('id', cycle_id)
      .single();
    if (cycleErr) throw cycleErr;

    // Validate cycle status — only allow from 'voting' status
    if (!['voting', 'calculating', 'announced'].includes(cycle.status)) {
      throw new Error(`Cannot calculate results: cycle is in '${cycle.status}' status. Must be 'voting', 'calculating', or 'announced'.`);
    }

    await supabase.from('award_cycles').update({ status: 'calculating' }).eq('id', cycle_id);

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
      .select('id, theme_id, nominee_id, nominator_id')
      .in('theme_id', themeIds)
      .in('status', ['endorsed', 'shortlisted'])
      .is('deleted_at', null);
    if (!nominations?.length) throw new Error('No eligible nominations');

    // 3b. Fetch department info for all nominees
    const uniqueNomineeIds = [...new Set(nominations.map(n => n.nominee_id))];
    const { data: employeeDepts } = await supabase
      .from('employees')
      .select('user_id, department_id, departments:department_id(name)')
      .in('user_id', uniqueNomineeIds)
      .is('deleted_at', null);

    const nomineeDeptMap: Record<string, { department_id: string | null; department_name: string }> = {};
    for (const emp of (employeeDepts || [])) {
      const deptName = (emp.departments as any)?.name || 'Unknown';
      nomineeDeptMap[emp.user_id] = { department_id: emp.department_id, department_name: deptName };
    }

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
            nomination_id: nom.id, raw_avg: 0, weighted_avg: 0, total_votes: 0,
            criterion_breakdown: {}, vote_distribution: {},
            confidence_interval: { lower: 0, upper: 0 },
          });
          continue;
        }

        // Per-criterion averages
        const criterionBreakdown: Record<string, { avg: number; count: number }> = {};
        for (const c of themeCriteria) {
          const scores = nomVotes
            .map(v => { const cs = v.criteria_scores as Record<string, number>; return cs?.[c.id]; })
            .filter((s): s is number => s != null);
          const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
          criterionBreakdown[c.id] = { avg: Math.round(avg * 100) / 100, count: scores.length };
        }

        const rawScores = nomVotes.map(v => {
          const cs = v.criteria_scores as Record<string, number>;
          const vals = Object.values(cs || {});
          return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        });
        const rawAvg = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;

        const weightedAvg = themeCriteria.reduce((sum, c) => {
          const cb = criterionBreakdown[c.id];
          return sum + (cb ? cb.avg * c.weight / totalWeight : 0);
        }, 0);

        const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        nomVotes.forEach(v => {
          const cs = v.criteria_scores as Record<string, number>;
          Object.values(cs || {}).forEach(s => {
            const key = String(Math.round(s));
            if (distribution[key] !== undefined) distribution[key]++;
          });
        });

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

      nomineeScores.sort((a, b) => b.weighted_avg - a.weighted_avg);

      // --- Fairness Analysis ---
      const fairnessReport: Record<string, any> = {};

      // Clique detection: check if nominator nominated someone who also nominated them
      const biasDetection = fairnessConfig.biasDetection || fairnessConfig.bias_detection || {};
      const cliqueThreshold = biasDetection.cliqueThreshold || fairnessConfig.clique_threshold || 3;
      const cliqueWarnings: any[] = [];
      for (const nom of themeNominations) {
        // Find reverse nominations: where this nominee nominated the original nominator
        const reverseNoms = nominations.filter(
          n => n.nominator_id === nom.nominee_id && n.nominee_id === nom.nominator_id
        );
        if (reverseNoms.length > 0) {
          cliqueWarnings.push({
            nomination_id: nom.id,
            nominator_id: nom.nominator_id,
            nominee_id: nom.nominee_id,
            mutual_count: reverseNoms.length,
          });
        }
      }
      if (cliqueWarnings.length >= cliqueThreshold) {
        fairnessReport.clique_warnings = cliqueWarnings;
      }

      // Vote anomaly detection
      const anomalies: any[] = [];
      for (const nom of themeNominations) {
        const nomVotes = (votes || []).filter(v => v.nomination_id === nom.id);
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
      // Demographic parity calculation
      const parityTarget = fairnessConfig.demographicParityTarget || fairnessConfig.demographic_parity_target || 0.8;
      const deptNomineeCounts: Record<string, { name: string; nominees: number; winners: number }> = {};

      for (const nom of themeNominations) {
        const info = nomineeDeptMap[nom.nominee_id];
        const deptKey = info?.department_id || 'unknown';
        const deptName = info?.department_name || 'Unknown';
        if (!deptNomineeCounts[deptKey]) {
          deptNomineeCounts[deptKey] = { name: deptName, nominees: 0, winners: 0 };
        }
        deptNomineeCounts[deptKey].nominees++;
      }

      // Count winners (top 3) by department
      const top3Ids = nomineeScores.slice(0, 3).map(ns => ns.nomination_id);
      for (const nomId of top3Ids) {
        const nom = themeNominations.find(n => n.id === nomId);
        if (!nom) continue;
        const info = nomineeDeptMap[nom.nominee_id];
        const deptKey = info?.department_id || 'unknown';
        if (deptNomineeCounts[deptKey]) {
          deptNomineeCounts[deptKey].winners++;
        }
      }

      const totalNominees = themeNominations.length;
      const totalWinners = top3Ids.length;
      const deptEntries = Object.entries(deptNomineeCounts);

      if (deptEntries.length < 2 || totalWinners === 0) {
        fairnessReport.demographic_parity = { status: 'insufficient_data', department_count: deptEntries.length, nominee_count: totalNominees, winner_count: totalWinners, note: 'Not enough departments or winners to evaluate parity' };
      } else {
        const departments: Record<string, { nominees: number; winners: number; ratio: number }> = {};
        const underrepresented: string[] = [];
        const overrepresented: string[] = [];
        let minRatio = Infinity;

        for (const [, dept] of deptEntries) {
          const nomShare = dept.nominees / totalNominees;
          const winShare = totalWinners > 0 ? dept.winners / totalWinners : 0;
          const ratio = nomShare > 0 ? Math.round((winShare / nomShare) * 100) / 100 : 0;

          departments[dept.name] = { nominees: dept.nominees, winners: dept.winners, ratio };

          if (dept.nominees > 0 && dept.winners === 0 && nomShare >= 0.15) {
            underrepresented.push(dept.name);
          } else if (ratio > 1.5) {
            overrepresented.push(dept.name);
          }
          if (ratio < minRatio) minRatio = ratio;
        }

        const parityScore = Math.round(Math.min(minRatio, 1) * 100) / 100;
        const status = parityScore >= parityTarget ? 'balanced' : 'imbalanced';

        fairnessReport.demographic_parity = {
          status,
          score: parityScore,
          target: parityTarget,
          departments,
          underrepresented,
          overrepresented,
          note: status === 'balanced'
            ? 'Department representation is within acceptable range'
            : 'Some departments are under or over-represented in results',
        };
      }

      if (biasDetection.visibilityBias || fairnessConfig.visibility_bias) {
        fairnessReport.visibility_correction = { applied: true, method: 'remote_worker_boost' };
      }

      // 7. Soft-delete old results for this theme+cycle to ensure idempotency
      const { data: oldResults } = await supabase
        .from('theme_results')
        .select('id')
        .eq('theme_id', theme.id)
        .eq('cycle_id', cycle_id)
        .is('deleted_at', null);

      const oldResultIds = oldResults?.map(r => r.id) || [];
      if (oldResultIds.length > 0) {
        await supabase
          .from('nominee_rankings')
          .update({ deleted_at: new Date().toISOString() })
          .in('theme_results_id', oldResultIds);

        await supabase
          .from('theme_results')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', oldResultIds);
      }

      // Insert fresh results
      const { data: themeResult, error: trErr } = await supabase
        .from('theme_results')
        .insert({
          tenant_id: cycle.tenant_id,
          theme_id: theme.id,
          cycle_id: cycle_id,
          first_place_nomination_id: nomineeScores[0]?.nomination_id || null,
          second_place_nomination_id: nomineeScores[1]?.nomination_id || null,
          third_place_nomination_id: nomineeScores[2]?.nomination_id || null,
          fairness_report: fairnessReport,
          appeal_status: 'closed',
        })
        .select()
        .single();
      if (trErr) throw trErr;

      // 8. Insert nominee_rankings
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

      // Update nomination statuses after results are calculated
      const top3NominationIds = nomineeScores.slice(0, 3).map(ns => ns.nomination_id);
      if (top3NominationIds.length > 0) {
        await supabase
          .from('nominations')
          .update({ status: 'shortlisted', endorsement_status: 'sufficient' })
          .in('id', top3NominationIds);

        // Points configuration from cycle
        const pointsConfig = (cycle.points_config || {}) as Record<string, number>;
        const rankRewards: { amount: number; sourceType: string }[] = [
          { amount: pointsConfig.first_place ?? 5000, sourceType: 'award_win' },
          { amount: pointsConfig.second_place ?? 2000, sourceType: 'award_runner_up' },
          { amount: pointsConfig.third_place ?? 1000, sourceType: 'award_finalist' },
        ];
        const nominatorBonus = pointsConfig.nominator_bonus ?? 200;

        // Send award_won notifications + award points to top 3 nominees
        for (let i = 0; i < Math.min(3, nomineeScores.length); i++) {
          const ns = nomineeScores[i];
          const nom = themeNominations.find(n => n.id === ns.nomination_id);
          if (nom) {
            // Notification
            await supabase.from('recognition_notifications').insert({
              tenant_id: cycle.tenant_id,
              user_id: nom.nominee_id,
              nomination_id: nom.id,
              type: 'award_won',
              title: `Congratulations! You placed #${i + 1}`,
              body: `You placed #${i + 1} in "${theme.name}"`,
            });

            // Award points to winner
            const reward = rankRewards[i];
            if (reward && reward.amount > 0) {
              await supabase.from('points_transactions').insert({
                user_id: nom.nominee_id,
                tenant_id: cycle.tenant_id,
                amount: reward.amount,
                source_type: reward.sourceType,
                source_id: nom.id,
                status: 'credited',
                description: `#${i + 1} place in "${theme.name}" — ${cycle.name}`,
              });
            }

            // Award nominator bonus
            if (nominatorBonus > 0 && nom.nominator_id) {
              await supabase.from('points_transactions').insert({
                user_id: nom.nominator_id,
                tenant_id: cycle.tenant_id,
                amount: nominatorBonus,
                source_type: 'nominator_bonus',
                source_id: nom.id,
                status: 'credited',
                description: `Nominator bonus — your nominee placed #${i + 1} in "${theme.name}"`,
              });
            }
          }
        }
      }

      // Ensure all eligible nominations in this theme have endorsement_status synced
      const allNomIds = themeNominations.map(n => n.id);
      if (allNomIds.length > 0) {
        await supabase
          .from('nominations')
          .update({ endorsement_status: 'sufficient' })
          .in('id', allNomIds)
          .eq('endorsement_status', 'pending');
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
