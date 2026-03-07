

# Brand Management Gaps Analysis & Fix Plan

## Identified Gaps

### 1. CRITICAL: Missing `tenant-assets` Storage Bucket
The `tenantAssetsService` uploads to a bucket called `tenant-assets`, but this bucket **does not exist**. Only `brand-assets` exists. This causes the "Bucket not found" errors in console logs when saving logo_light, logo_dark, pwa_icon_light, pwa_icon_dark.

**Fix**: The `useBranding.ts` `saveBranding` function marks `logo_light`, `logo_dark`, `pwa_icon_light`, `pwa_icon_dark` as "strict assets" and routes them through `tenantAssetsService` which targets the non-existent `tenant-assets` bucket. Since `brand-assets` bucket already exists and works, we should route ALL uploads through `brand-assets` consistently.

### 2. CRITICAL: Missing `tenant_assets` Database Table
The `tenantAssetsService.getTenantAssets()` queries `tenant_assets` table which returns 404: `"Could not find the table 'public.tenant_assets'"`. This table was never created.

**Fix**: Either create the table, or simplify the architecture. Since the `branding_config` JSON column on `tenants` table already stores all asset URLs and works correctly, we should remove the dead `tenant_assets` table dependency and consolidate on the working `brand-assets` bucket + `tenants.branding_config` approach.

### 3. Upload Failure Silently Swallowed
In `useBranding.ts` lines 151-156, strict upload failures are caught and logged but not surfaced — the save still reports "success" even though assets failed to upload. User sees "Branding saved successfully" but their logo_light/logo_dark uploads were silently lost.

### 4. Colors Not Applied in Real-Time on Save
`useBrandingColors` hook in `MainLayout` applies colors on load, but after saving in `/admin/branding`, colors only update on page refresh since `MainLayout` uses its own `useBranding(tenantId)` instance.

### 5. Hardcoded English Strings
Lines 314, 321, 327, 331 in `AdminBranding.tsx` have hardcoded English: "PWA Icon (Light)", "PWA Icon (Dark)", "For strictly isolated light/dark theme" — not using i18n.

### 6. `useTenantId` Hook Not Used
`AdminBranding.tsx` manually fetches tenant_id with raw Supabase calls instead of using the centralized `useTenantId()` hook.

---

## Implementation Plan

### Step 1: Remove Dead `tenantAssetsService` Dependency
- **Edit** `src/hooks/branding/useBranding.ts`:
  - Remove the import of `tenantAssetsService`
  - Remove the parallel `tenantAssetsService.getTenantAssets()` call in `fetchBranding`
  - Remove the `strictAssets` routing in `saveBranding` — all uploads go through the working `uploadFile` method (which uses `brand-assets` bucket)
  - This eliminates both the missing bucket AND missing table errors

### Step 2: Use `useTenantId` Hook
- **Edit** `src/pages/admin/AdminBranding.tsx`:
  - Replace manual tenant_id fetch with `useTenantId()` hook
  - Remove the `useEffect` + raw Supabase query

### Step 3: Fix Hardcoded Strings
- **Edit** `src/pages/admin/AdminBranding.tsx`: Replace hardcoded English with i18n keys
- **Edit** translation files if needed

### Step 4: Surface Upload Errors Properly
- **Edit** `src/hooks/branding/useBranding.ts`: If any file upload fails, show error toast and stop save

---

## Files Summary

| Action | File |
|--------|------|
| Edit | `src/hooks/branding/useBranding.ts` |
| Edit | `src/pages/admin/AdminBranding.tsx` |

No database migrations needed. No new files. The `tenantAssets` service and hook files become unused (can be cleaned up later).

