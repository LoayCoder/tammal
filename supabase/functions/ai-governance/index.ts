import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface GovernanceRequest {
  action: string
  params?: Record<string, unknown>
}

type RoleAccess = 'super_admin' | 'tenant_admin' | 'engineering' | 'finance' | 'risk'

const ACTION_ACCESS: Record<string, RoleAccess[]> = {
  get_summary: ['super_admin', 'tenant_admin', 'engineering', 'finance', 'risk'],
  get_routing_logs: ['super_admin', 'engineering'],
  get_cost_breakdown: ['super_admin', 'finance'],
  get_performance_trend: ['super_admin', 'risk'],
  get_penalties: ['super_admin', 'risk'],
  get_budget_config: ['super_admin', 'finance'],
  switch_strategy: ['super_admin'],
  reset_posterior: ['super_admin'],
  apply_penalty: ['super_admin', 'risk'],
  clear_penalty: ['super_admin', 'risk'],
  update_budget: ['super_admin', 'finance'],
  refresh_summary: ['super_admin'],
  get_audit_log: ['super_admin', 'tenant_admin'],
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Auth client to verify the caller
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }
    const userId = claimsData.claims.sub as string

    // Service-role client for all data access
    const db = createClient(supabaseUrl, serviceRoleKey)

    // Resolve user roles & permissions
    const { data: userRoles } = await db
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)

    const { data: userPerms } = await db
      .from('user_roles')
      .select('roles:custom_role_id (role_permissions (permissions (code)))')
      .eq('user_id', userId)

    const isSuperAdmin = userRoles?.some((r: any) => r.role === 'super_admin') ?? false
    const isTenantAdmin = userRoles?.some((r: any) => r.role === 'tenant_admin') ?? false

    const permCodes = new Set<string>()
    if (userPerms) {
      for (const ur of userPerms) {
        const role = ur.roles as any
        if (role?.role_permissions) {
          for (const rp of role.role_permissions) {
            if (rp.permissions?.code) permCodes.add(rp.permissions.code)
          }
        }
      }
    }

    const hasGovernancePerm = (perm: string) => isSuperAdmin || permCodes.has(perm)

    // Resolve effective roles for access check
    const effectiveRoles: RoleAccess[] = []
    if (isSuperAdmin) effectiveRoles.push('super_admin')
    if (isTenantAdmin) effectiveRoles.push('tenant_admin')
    if (hasGovernancePerm('ai_governance.engineering')) effectiveRoles.push('engineering')
    if (hasGovernancePerm('ai_governance.finance')) effectiveRoles.push('finance')
    if (hasGovernancePerm('ai_governance.risk')) effectiveRoles.push('risk')

    // Get tenant_id
    const { data: profile } = await db
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', userId)
      .single()
    const tenantId = profile?.tenant_id

    // Parse request
    const body: GovernanceRequest = await req.json()
    const { action, params = {} } = body

    if (!action || !ACTION_ACCESS[action]) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders })
    }

    // Check access
    const requiredRoles = ACTION_ACCESS[action]
    const hasAccess = requiredRoles.some(r => effectiveRoles.includes(r))
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
    }

    let result: unknown = null

    switch (action) {
      case 'get_summary': {
        const { data } = await db
          .from('ai_governance_summary')
          .select('*')
          .eq('tenant_id', tenantId)
        result = data ?? []
        break
      }

      case 'get_routing_logs': {
        const limit = (params.limit as number) || 100
        const { data } = await db
          .from('ai_generation_logs')
          .select('id, created_at, model_used, settings, success, duration_ms, tokens_used')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(limit)
        result = data ?? []
        break
      }

      case 'get_cost_breakdown': {
        const days = (params.days as number) || 30
        const since = new Date()
        since.setDate(since.getDate() - days)
        const { data } = await db
          .from('ai_cost_daily_agg')
          .select('*')
          .eq('tenant_id', tenantId)
          .gte('date', since.toISOString().split('T')[0])
          .order('date', { ascending: true })
        result = data ?? []
        break
      }

      case 'get_performance_trend': {
        const days = (params.days as number) || 30
        const since = new Date()
        since.setDate(since.getDate() - days)
        const { data } = await db
          .from('ai_performance_daily_agg')
          .select('*')
          .gte('date', since.toISOString().split('T')[0])
          .order('date', { ascending: true })
        result = data ?? []
        break
      }

      case 'get_penalties': {
        const { data } = await db
          .from('ai_provider_penalties')
          .select('*')
          .gte('penalty_expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
        result = data ?? []
        break
      }

      case 'get_budget_config': {
        const { data } = await db
          .from('tenant_ai_budget_config')
          .select('*')
          .eq('tenant_id', tenantId)
          .single()
        result = data
        break
      }

      case 'switch_strategy': {
        const strategy = params.strategy as string
        if (!['hybrid', 'cost_aware', 'thompson'].includes(strategy)) {
          return new Response(JSON.stringify({ error: 'Invalid strategy' }), { status: 400, headers: corsHeaders })
        }
        const targetTenantId = (params.tenant_id as string) || tenantId

        // Get previous value
        const { data: prev } = await db
          .from('tenant_ai_budget_config')
          .select('routing_strategy')
          .eq('tenant_id', targetTenantId)
          .single()

        const { error } = await db
          .from('tenant_ai_budget_config')
          .update({ routing_strategy: strategy })
          .eq('tenant_id', targetTenantId)

        if (error) throw error

        // Audit log
        await db.from('ai_governance_audit_log').insert({
          tenant_id: targetTenantId,
          user_id: userId,
          action: 'switch_strategy',
          target_entity: `tenant:${targetTenantId}`,
          previous_value: { routing_strategy: prev?.routing_strategy },
          new_value: { routing_strategy: strategy },
        })

        result = { success: true }
        break
      }

      case 'reset_posterior': {
        const provider = params.provider as string
        const feature = params.feature as string
        if (!provider || !feature) {
          return new Response(JSON.stringify({ error: 'provider and feature required' }), { status: 400, headers: corsHeaders })
        }

        const { data: prev } = await db
          .from('ai_provider_metrics_agg')
          .select('ts_alpha, ts_beta')
          .eq('provider', provider)
          .eq('feature', feature)
          .single()

        const { error } = await db
          .from('ai_provider_metrics_agg')
          .update({ ts_alpha: 1, ts_beta: 1, ts_latency_mean: 0, ts_latency_variance: 1, ts_cost_mean: 0, ts_cost_variance: 1 })
          .eq('provider', provider)
          .eq('feature', feature)

        if (error) throw error

        await db.from('ai_governance_audit_log').insert({
          tenant_id: tenantId,
          user_id: userId,
          action: 'reset_posterior',
          target_entity: `${provider}:${feature}`,
          previous_value: prev,
          new_value: { ts_alpha: 1, ts_beta: 1 },
        })

        result = { success: true }
        break
      }

      case 'apply_penalty': {
        const provider = params.provider as string
        const feature = params.feature as string
        const durationMinutes = (params.duration_minutes as number) || 10
        const multiplier = (params.multiplier as number) || 0.7
        if (!provider || !feature) {
          return new Response(JSON.stringify({ error: 'provider and feature required' }), { status: 400, headers: corsHeaders })
        }

        const expiresAt = new Date(Date.now() + durationMinutes * 60_000).toISOString()
        const { error } = await db
          .from('ai_provider_penalties')
          .insert({ provider, feature, penalty_multiplier: multiplier, penalty_expires_at: expiresAt })

        if (error) throw error

        await db.from('ai_governance_audit_log').insert({
          tenant_id: tenantId,
          user_id: userId,
          action: 'apply_penalty',
          target_entity: `${provider}:${feature}`,
          new_value: { multiplier, duration_minutes: durationMinutes, expires_at: expiresAt },
        })

        result = { success: true }
        break
      }

      case 'clear_penalty': {
        const penaltyId = params.penalty_id as string
        if (!penaltyId) {
          return new Response(JSON.stringify({ error: 'penalty_id required' }), { status: 400, headers: corsHeaders })
        }

        const { data: prev } = await db
          .from('ai_provider_penalties')
          .select('*')
          .eq('id', penaltyId)
          .single()

        const { error } = await db
          .from('ai_provider_penalties')
          .delete()
          .eq('id', penaltyId)

        if (error) throw error

        await db.from('ai_governance_audit_log').insert({
          tenant_id: tenantId,
          user_id: userId,
          action: 'clear_penalty',
          target_entity: prev?.provider ?? penaltyId,
          previous_value: prev,
        })

        result = { success: true }
        break
      }

      case 'update_budget': {
        const updates: Record<string, unknown> = {}
        if (params.monthly_budget != null) updates.monthly_budget = params.monthly_budget
        if (params.soft_limit_percentage != null) updates.soft_limit_percentage = params.soft_limit_percentage
        if (params.routing_mode != null) updates.routing_mode = params.routing_mode

        const { data: prev } = await db
          .from('tenant_ai_budget_config')
          .select('monthly_budget, soft_limit_percentage, routing_mode')
          .eq('tenant_id', tenantId)
          .single()

        const { error } = await db
          .from('tenant_ai_budget_config')
          .update(updates)
          .eq('tenant_id', tenantId)

        if (error) throw error

        await db.from('ai_governance_audit_log').insert({
          tenant_id: tenantId,
          user_id: userId,
          action: 'update_budget',
          target_entity: `tenant:${tenantId}`,
          previous_value: prev,
          new_value: updates,
        })

        result = { success: true }
        break
      }

      case 'refresh_summary': {
        // Refresh materialized view using raw SQL via RPC isn't available;
        // use a direct query via service role
        const { error } = await db.rpc('refresh_ai_governance_summary' as any)
        if (error) {
          // Fallback: the function might not exist yet, that's ok
          console.warn('Materialized view refresh not available:', error.message)
        }
        result = { success: true, note: 'Refresh requested' }
        break
      }

      case 'get_audit_log': {
        const limit = (params.limit as number) || 50
        let query = db
          .from('ai_governance_audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)

        if (!isSuperAdmin && tenantId) {
          query = query.eq('tenant_id', tenantId)
        }

        const { data } = await query
        result = data ?? []
        break
      }
    }

    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ai-governance error:', err)
    return new Response(JSON.stringify({ error: err.message ?? 'Internal error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
