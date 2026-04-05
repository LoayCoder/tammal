

## Fix 401 Auth Error in Both Edge Functions

### Root Cause

The `team-pulse-engine` and `wellness-copilot` functions use `auth.getUser(token)` for authentication, but the project's signing-keys system requires `auth.getClaims(token)` — the proven pattern used by all other working functions (e.g., `parse-document`).

Additionally, the working pattern passes the `Authorization` header into the `createClient` constructor, which the two broken functions do not do.

### Fix

In both `team-pulse-engine/index.ts` and `wellness-copilot/index.ts`, replace the auth block (lines 29-46) with the `getClaims` pattern matching `parse-document`:

```typescript
// Before (broken)
const token = authHeader.replace("Bearer ", "");
const anonClient = createClient(supabaseUrl, anonKey);
const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
if (authErr || !user) { return 401 }

// After (working pattern from parse-document)
const anonClient = createClient(supabaseUrl, anonKey, {
  global: { headers: { Authorization: authHeader } },
});
const token = authHeader.replace("Bearer ", "");
const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
if (claimsError || !claimsData?.claims) { return 401 }
const userId = claimsData.claims.sub;
```

Then replace all downstream references from `user.id` to `userId` (the `sub` claim).

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/team-pulse-engine/index.ts` | Replace `getUser()` with `getClaims()` pattern, update `user.id` → `userId` |
| `supabase/functions/wellness-copilot/index.ts` | Same auth pattern fix, update `user.id` → `userId` |

