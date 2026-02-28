

# PR: Barrel File Cleanup — `src/hooks/` Directory

## Summary

Remove ~80 single-line re-export ("barrel") files from `src/hooks/` and repoint all ~397 import references across ~60 consuming files to the canonical subdirectory paths.

**Zero behavior change. Zero logic change. Import path updates only.**

---

## Scope

### Barrel Files to Remove (80 files)

Each contains only `export * from './subfolder/useX'`. Full list by subdirectory:

**auth/** (6 barrels): `useAuth.ts`, `useRoles.ts`, `useProfile.ts`, `usePermissions.ts`, `useLoginHistory.ts`, `useCurrentEmployee.ts`, `useUserPermissions.ts`

**org/** (18 barrels): `useTenants.ts`, `useTenantId.ts`, `useTenantUsage.ts`, `useTenantAssets.ts`, `useTenantInvitations.ts`, `usePlans.ts`, `useSubscriptions.ts`, `usePlatformSettings.ts`, `useUsers.ts`, `useUnifiedUsers.ts`, `useEmployees.ts`, `useBranches.ts`, `useDepartments.ts`, `useDivisions.ts`, `useSites.ts`, `useWorkSites.ts`, `useOrgTree.ts`

**branding/** (4 barrels): `useBranding.ts`, `useBrandingColors.ts`, `useTheme.ts`, `useDynamicFavicon.ts`, `useDynamicPWA.ts`

**ui/** (4 barrels): `use-mobile.tsx`, `use-toast.ts`, `usePWAInstall.ts`, `usePushNotifications.ts`, `useSpeechToText.ts`

**analytics/** (6 barrels): `useOrgAnalytics.ts`, `useDashboardStats.ts`, `useDashboardView.ts`, `useWellnessInsights.ts`, `useCrisisAnalytics.ts`, `usePersonalMoodDashboard.ts`

**audit/** (1 barrel): `useAuditLog.ts`

**wellness/** (9 barrels): `useGamification.ts`, `useMoodHistory.ts`, `useMoodDefinitions.ts`, `useMoodQuestionConfig.ts`, `useMoodPathwayQuestions.ts`, `useBreathingSessions.ts`, `useEmployeeResponses.ts`, `useThoughtReframes.ts`

**spiritual/** (7 barrels): `usePrayerLogs.ts`, `usePrayerTimes.ts`, `useFastingLogs.ts`, `useQuranSessions.ts`, `useHijriCalendar.ts`, `useSpiritualReports.ts`, `useSpiritualPreferences.ts`

**questions/** (12 barrels): `useQuestions.ts`, `useAIModels.ts`, `useAIKnowledge.ts`, `useAIQuestionGeneration.ts`, `useEnhancedAIGeneration.ts`, `useQuestionBatches.ts`, `useQuestionCategories.ts`, `useQuestionSubcategories.ts`, `useQuestionSchedules.ts`, `useScheduledQuestions.ts`, `useCheckinScheduledQuestions.ts`, `useGenerationPeriods.ts`, `useFrameworkDocuments.ts`, `useReferenceFrameworks.ts`

**crisis/** (2 barrels): `useCrisisSupport.ts`, `useCrisisNotifications.ts`

---

## Execution Steps

### Step 1 — Update all import sites (~60 files, ~397 references)

For each barrel, find every consumer and change the import path. Example transforms:

```text
BEFORE: import { useAuth } from '@/hooks/useAuth'
AFTER:  import { useAuth } from '@/hooks/auth/useAuth'

BEFORE: import { useGamification } from '@/hooks/useGamification'
AFTER:  import { useGamification } from '@/hooks/wellness/useGamification'

BEFORE: import { useTenants } from '@/hooks/useTenants'
AFTER:  import { useTenants } from '@/hooks/org/useTenants'
```

Affected file categories:
- **Pages** (~25 files): EmployeeHome, DailyCheckin, MoodPathwaySettings, OrgStructure, TenantManagement, UnifiedUserManagement, AdminBranding, AuditLogs, PrayerTracker, QuranReader, etc.
- **Components** (~25 files): InlineDailyCheckin, TenantSheet, InviteUserDialog, OrgFilterBar, PermissionMatrix, SpiritualPreferencesCard, etc.
- **Hooks** (cross-references): Some canonical hooks import from barrel siblings (e.g., `useSpiritualPreferences` imports `useAuth` via barrel) -- these will also be updated.
- **Features** (~5 files): ai-generator, cycle-builder, org-dashboard internal hooks.
- **Tests** (~5 files): Existing smoke and hook tests.

### Step 2 — Validate build and tests

- TypeScript compilation must pass with 0 errors
- All 74/74 tests must pass
- Search repo for any remaining `@/hooks/use[A-Z]` or `@/hooks/use-` references pointing to root barrel files

### Step 3 — Delete all barrel files

Remove all ~80 single-line re-export files from `src/hooks/` root directory.

### Step 4 — Final verification

- Re-run build
- Re-run full test suite
- Search for orphan references

---

## Technical Details

### Path Mapping Reference

| Barrel file | Canonical path |
|---|---|
| `useAuth` | `auth/useAuth` |
| `useRoles` | `auth/useRoles` |
| `useProfile` | `auth/useProfile` |
| `usePermissions` | `auth/usePermissions` |
| `useCurrentEmployee` | `auth/useCurrentEmployee` |
| `useUserPermissions` | `auth/useUserPermissions` |
| `useLoginHistory` | `auth/useLoginHistory` |
| `useTenants` | `org/useTenants` |
| `useTenantId` | `org/useTenantId` |
| `useTenantUsage` | `org/useTenantUsage` |
| `useTenantAssets` | `org/useTenantAssets` |
| `useTenantInvitations` | `org/useTenantInvitations` |
| `usePlans` | `org/usePlans` |
| `useSubscriptions` | `org/useSubscriptions` |
| `usePlatformSettings` | `org/usePlatformSettings` |
| `useUsers` | `org/useUsers` |
| `useUnifiedUsers` | `org/useUnifiedUsers` |
| `useEmployees` | `org/useEmployees` |
| `useBranches` | `org/useBranches` |
| `useDepartments` | `org/useDepartments` |
| `useDivisions` | `org/useDivisions` |
| `useSites` | `org/useSites` |
| `useWorkSites` | `org/useWorkSites` |
| `useOrgTree` | `org/useOrgTree` |
| `useBranding` | `branding/useBranding` |
| `useBrandingColors` | `branding/useBrandingColors` |
| `useTheme` | `branding/useTheme` |
| `useDynamicFavicon` | `branding/useDynamicFavicon` |
| `useDynamicPWA` | `branding/useDynamicPWA` |
| `use-mobile` | `ui/use-mobile` |
| `use-toast` | `ui/use-toast` |
| `usePWAInstall` | `ui/usePWAInstall` |
| `usePushNotifications` | `ui/usePushNotifications` |
| `useSpeechToText` | `ui/useSpeechToText` |
| `useOrgAnalytics` | `analytics/useOrgAnalytics` |
| `useDashboardStats` | `analytics/useDashboardStats` |
| `useDashboardView` | `analytics/useDashboardView` |
| `useWellnessInsights` | `analytics/useWellnessInsights` |
| `useCrisisAnalytics` | `analytics/useCrisisAnalytics` |
| `usePersonalMoodDashboard` | `analytics/usePersonalMoodDashboard` |
| `useAuditLog` | `audit/useAuditLog` |
| `useGamification` | `wellness/useGamification` |
| `useMoodHistory` | `wellness/useMoodHistory` |
| `useMoodDefinitions` | `wellness/useMoodDefinitions` |
| `useMoodQuestionConfig` | `wellness/useMoodQuestionConfig` |
| `useMoodPathwayQuestions` | `wellness/useMoodPathwayQuestions` |
| `useBreathingSessions` | `wellness/useBreathingSessions` |
| `useEmployeeResponses` | `wellness/useEmployeeResponses` |
| `useThoughtReframes` | `wellness/useThoughtReframes` |
| `usePrayerLogs` | `spiritual/usePrayerLogs` |
| `usePrayerTimes` | `spiritual/usePrayerTimes` |
| `useFastingLogs` | `spiritual/useFastingLogs` |
| `useQuranSessions` | `spiritual/useQuranSessions` |
| `useHijriCalendar` | `spiritual/useHijriCalendar` |
| `useSpiritualReports` | `spiritual/useSpiritualReports` |
| `useSpiritualPreferences` | `spiritual/useSpiritualPreferences` |
| `useQuestions` | `questions/useQuestions` |
| `useAIModels` | `questions/useAIModels` |
| `useAIKnowledge` | `questions/useAIKnowledge` |
| `useAIQuestionGeneration` | `questions/useAIQuestionGeneration` |
| `useEnhancedAIGeneration` | `questions/useEnhancedAIGeneration` |
| `useQuestionBatches` | `questions/useQuestionBatches` |
| `useQuestionCategories` | `questions/useQuestionCategories` |
| `useQuestionSubcategories` | `questions/useQuestionSubcategories` |
| `useQuestionSchedules` | `questions/useQuestionSchedules` |
| `useScheduledQuestions` | `questions/useScheduledQuestions` |
| `useCheckinScheduledQuestions` | `questions/useCheckinScheduledQuestions` |
| `useGenerationPeriods` | `questions/useGenerationPeriods` |
| `useFrameworkDocuments` | `questions/useFrameworkDocuments` |
| `useReferenceFrameworks` | `questions/useReferenceFrameworks` |
| `useCrisisSupport` | `crisis/useCrisisSupport` |
| `useCrisisNotifications` | `crisis/useCrisisNotifications` |

### Risk Assessment

- **Risk**: Low -- purely mechanical import path changes
- **Behavioral change**: None
- **Circular dependency risk**: None (barrels only add indirection, removing them simplifies the graph)

