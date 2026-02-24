

## Unify Crisis Support Pages

### Problem
There are two separate crisis support pages:
- `/mental-toolkit/crisis` -- A static directory of global emergency hotline numbers (search, region filter, call buttons)
- `/crisis-support` -- The full MHFA peer support request system (intent selection, anonymity, first aider assignment, case creation)

### Solution
Keep `/crisis-support` as the single crisis page and enhance it by integrating the best elements from the mental toolkit version (the emergency contacts directory with search and region filtering). Then remove the `/mental-toolkit/crisis` page entirely.

### What Changes

**1. Enhance `/crisis-support` (CrisisRequestPage.tsx)**
- Add the emergency hotline directory (from `CrisisSupport.tsx`) as a collapsible section at the bottom of the page, replacing the minimal "Quick Access" card that currently only shows 911 and a Saudi number
- Include the search input and region filter chips from the mental toolkit version
- This gives users access to global hotlines AND the MHFA request system in one place

**2. Remove `/mental-toolkit/crisis` route and page**
- Delete `src/pages/mental-toolkit/CrisisPage.tsx`
- Remove its route from `src/App.tsx`
- Remove the lazy import for `CrisisPage`

**3. Update sidebar navigation**
- Remove the `/mental-toolkit/crisis` link from the Mental Toolkit Resources section in `AppSidebar.tsx`
- Update the `resourcesOpen` state check to no longer include that path

**4. Update MentalToolkit.tsx resources tab**
- Remove the `CrisisSupport` component from the resources tab since it now lives under `/crisis-support`
- Remove the unused import

**5. Keep `CrisisSupport` component**
- The `src/components/mental-toolkit/resources/CrisisSupport.tsx` component itself stays (it will be imported into `CrisisRequestPage.tsx` to replace the minimal quick-access card)

### Technical Details

| File | Action |
|---|---|
| `src/pages/crisis/CrisisRequestPage.tsx` | Import and embed `CrisisSupport` component, replacing the minimal quick-access card |
| `src/pages/mental-toolkit/CrisisPage.tsx` | Delete file |
| `src/App.tsx` | Remove CrisisPage lazy import and `/mental-toolkit/crisis` route |
| `src/components/layout/AppSidebar.tsx` | Remove `/mental-toolkit/crisis` from resources items and `resourcesOpen` path check |
| `src/pages/MentalToolkit.tsx` | Remove `CrisisSupport` import and usage from resources tab |

### Risk: Low
- No database changes
- No breaking changes to the MHFA system
- The emergency directory is preserved and made more accessible

