

# Fix: AI Governance Page "Something went wrong" Crash

## Root Cause Analysis

After thorough code review, the crash is caused by the `ai-governance` edge function failing and error propagation breaking the React component tree. Two specific issues were identified:

### Issue 1: Edge Function Auth Method Incompatibility

The `ai-governance` edge function (line 60) uses `authClient.auth.getClaims(token)` which may not be available in the version of `@supabase/supabase-js@2` resolved by esm.sh. Most other edge functions in the project use `auth.getUser(token)` which is stable across all v2 versions.

When `getClaims` is undefined, the edge function throws an unhandled error at line 60, returning a 500 (not 401). The `supabase.functions.invoke` call in the hooks receives a `FunctionsHttpError`, and `if (error) throw error` propagates it into React Query. While React Query normally handles this gracefully, the `AIGovernance.tsx` page component destructures data from **6 parallel queries** at the top level. If any hook's error state leads to unexpected `undefined` access during render, the PageErrorBoundary catches it.

### Issue 2: Unsafe Destructuring of Hook Results

In `AIGovernance.tsx` (line 36), `budgetConfig` is typed as `Record<string, unknown> | null`, but is used on line 73 with:
```
const currentStrategy = (budgetConfig?.routing_strategy as string) ?? 'cost_aware';
```
This is safe. However, the deeper issue is that when the edge function returns a 500, `useBudgetConfig` returns `undefined` (not `null`), and `budgetConfig` is `undefined` which may cascade through the components.

## Fix Plan

### Fix 1: Stabilize Edge Function Auth (Critical)

**File:** `supabase/functions/ai-governance/index.ts`

Replace `getClaims` with the more reliable `getUser` pattern used by all other edge functions:

```typescript
// Before (line 59-64):
const token = authHeader.replace('Bearer ', '')
const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token)
if (claimsError || !claimsData?.claims) { ... }
const userId = claimsData.claims.sub as string

// After:
const { data: { user }, error: authError } = await authClient.auth.getUser()
if (authError || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
}
const userId = user.id
```

This aligns with the 11 other edge functions that use `getUser()` successfully.

### Fix 2: Defensive Hook Error Handling in Page Component

**File:** `src/pages/admin/AIGovernance.tsx`

Wrap the governance page content so that if **any** of the 6 queries returns an error, a clear error state is shown instead of crashing:

- Check `summaryQuery.error || logsQuery.error || costQuery.error || perfQuery.error || budgetQuery.error || penaltiesQuery.error`
- If any has errored, show a user-friendly error card with a retry button
- This prevents cascading `undefined` access through child components

### Fix 3: Deploy Edge Function

Re-deploy the `ai-governance` edge function after the auth fix to ensure it handles auth correctly.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/ai-governance/index.ts` | Replace `getClaims` with `getUser` |
| `src/pages/admin/AIGovernance.tsx` | Add query error guard with retry UI |

## Validation

- Navigate to `/admin/ai-governance` while logged in -- page loads without crash
- Navigate while logged out -- redirected to `/auth` by `AdminRoute`
- Edge function returns 401 (not 500) for invalid tokens
- All 6 data queries fail gracefully with error UI and retry option
