

# Branding Reflection Audit & Sidebar Logo/Icon Fix

## Issues Found

### Issue 1: Sidebar shows icon when expanded (should show full logo)
Looking at the sidebar code (line 355), the **logic is correct** — expanded uses `ThemeLogo`, collapsed uses `ThemeIcon`. However, the database shows two separate assets:
- `logo_light_url` → `logo_light.svg` (used in expanded state)
- `icon_light_url` → `icon_light.svg` (used in collapsed state)

The problem is that `logo_light.svg` appears to be the **icon mark** (just the X symbol), not the full logo with "TAMMAL" text. Meanwhile `logo_url` → `logo.svg` contains the full logo (as shown in the BrandingPreview card).

**Root cause**: `ThemeLogo` in light mode picks `logoLightUrl` first (`logo_light.svg` = icon mark), falling back to `logoUrl` only if light is null. Since `logo_light_url` IS set (to the wrong asset), it never reaches `logo_url` (the full logo).

**Fix**: The `logo_light.svg` asset needs to contain the full logo with text, not just the mark. Since we can't change what the user uploaded, we should also make the sidebar fallback smarter — if `logo_light_url` renders something that looks like an icon, the user needs to re-upload the correct asset. We should surface this clearly in the branding page.

However, a code-level fix is also needed: the sidebar should prefer `logo_url` (the general logo) as the primary source, and only use `logo_light_url`/`logo_dark_url` as theme overrides. Currently `ThemeLogo` does this correctly, but the uploaded `logo_light.svg` is the wrong file.

**Action**: Swap the sidebar to always try `logo_url` first as the default, using theme variants only as overrides. Also update `ThemeLogo` fallback priority.

### Issue 2: Branding colors not fully propagated
The `useBrandingColors` hook only updates **3 CSS variables**:
- `--primary`
- `--secondary`
- `--accent`

But there are **12+ derived variables** that should also follow the branding primary color but remain hardcoded:
- `--ring` (focus rings)
- `--sidebar-primary` (active sidebar items)
- `--sidebar-ring`
- `--sidebar-active-bg`
- `--chart-1` (charts use primary)
- `--org-default`

**Result**: Sidebar active states, focus rings, and charts all use the hardcoded blue (`220 89% 56%`) instead of the tenant's configured primary (`200 96% 70%`).

### Issue 3: BrandingPreview only shows `logo_url`, not theme-aware logos
The preview card on the branding page passes `logoUrl={logoPreview}` which only tracks `branding.logo_url`. It doesn't show the `logo_light_url` or `logo_dark_url` variants that actually display in the sidebar.

---

## Plan (ordered)

### Step 1: Fix `useBrandingColors` — propagate to all derived CSS vars
Update the hook to also set:
- `--ring`, `--sidebar-primary`, `--sidebar-ring` → match `--primary`
- `--sidebar-active-bg` → derive from primary (light tint)
- `--chart-1` → match primary
- `--org-default` → match primary

### Step 2: Fix sidebar logo/icon display
Update `ThemeLogo` fallback logic so that `logoUrl` (the general/full logo) takes **priority** over empty or icon-like theme variants. Change the selection to:
```
light mode: logoLightUrl || logoUrl
```
This is already correct, but the user uploaded the icon mark as `logo_light`. The real fix is:
- In the sidebar, pass `logoUrl` as the primary, and only pass `logoLightUrl`/`logoDarkUrl` if they are **different** from the icon URLs. 
- OR: Simply ensure the sidebar expanded state always uses `logo_url` (the full logo) as the primary display, with theme variants as optional overrides.

Since the DB data shows `logo_url` = full logo and `logo_light_url` = icon mark, the cleanest fix is to update the sidebar to prefer `logo_url` and only use theme-specific variants when the user explicitly uploads different logos for light/dark (not icons).

### Step 3: Update BrandingPreview to show theme-aware logo
Pass `logo_light_url` and `logo_dark_url` to the preview component so it accurately represents what appears in the sidebar.

### Step 4: Minor — fix console warning
`BrandingPreview` is a function component receiving a ref. Add `forwardRef` or remove the ref.

---

## Files to modify
1. `src/hooks/branding/useBrandingColors.ts` — add derived CSS vars
2. `src/components/layout/AppSidebar.tsx` — fix logo URL priority  
3. `src/components/branding/BrandingPreview.tsx` — show theme-aware logos
4. `src/components/branding/ThemeLogo.tsx` — minor cleanup

