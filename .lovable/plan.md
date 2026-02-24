

# Hooks Directory Reorganization

## Overview

Reorganize the flat `src/hooks/` directory (71 files, 728 import references across 118 consumer files) into domain-based subdirectories for improved discoverability and maintainability.

## Risk Mitigation Strategy

The previous deferral cited "728 imports across 118 files" as high risk. The mitigation is straightforward:

1. Move hook files into subdirectories
2. Update all import paths in consumer files
3. No barrel files (index.ts re-exports) -- direct imports are clearer and tree-shake better

Since this is purely a file move + import path update with no logic changes, the risk of runtime breakage is minimal. The work is mechanical but voluminous.

---

## Proposed Directory Structure

```text
src/hooks/
  auth/
    useAuth.ts
    usePermissions.ts
    useUserPermissions.ts
    useLoginHistory.ts
    useProfile.ts
    useCurrentEmployee.ts
    useRoles.ts

  analytics/
    useOrgAnalytics.ts
    useDashboardStats.ts
    useDashboardView.ts
    useCrisisAnalytics.ts
    usePersonalMoodDashboard.ts
    useWellnessInsights.ts

  questions/
    useQuestions.ts
    useQuestionBatches.ts
    useQuestionCategories.ts
    useQuestionSubcategories.ts
    useQuestionSchedules.ts
    useScheduledQuestions.ts
    useCheckinScheduledQuestions.ts
    useAIQuestionGeneration.ts
    useEnhancedAIGeneration.ts
    useGenerationPeriods.ts
    useReferenceFrameworks.ts
    useFrameworkDocuments.ts
    useAIKnowledge.ts
    useAIModels.ts

  wellness/
    useMoodHistory.ts
    useMoodDefinitions.ts
    useMoodPathwayQuestions.ts
    useMoodQuestionConfig.ts
    useThoughtReframes.ts
    useBreathingSessions.ts
    useGamification.ts
    useEmployeeResponses.ts

  spiritual/
    useSpiritualPreferences.ts
    useSpiritualReports.ts
    usePrayerTimes.ts
    usePrayerLogs.ts
    useQuranSessions.ts
    useFastingLogs.ts
    useHijriCalendar.ts

  org/
    useTenants.ts
    useTenantId.ts
    useTenantAssets.ts
    useTenantInvitations.ts
    useTenantUsage.ts
    useBranches.ts
    useDepartments.ts
    useDivisions.ts
    useSites.ts
    useWorkSites.ts
    useEmployees.ts
    useUsers.ts
    useUnifiedUsers.ts
    useSubscriptions.ts
    usePlans.ts
    usePlatformSettings.ts

  crisis/
    useCrisisSupport.ts
    useCrisisNotifications.ts

  branding/
    useBranding.ts
    useBrandingColors.ts
    useTheme.ts
    useDynamicFavicon.ts
    useDynamicPWA.ts

  ui/
    use-mobile.tsx
    use-toast.ts
    useSpeechToText.ts
    usePWAInstall.ts
    usePushNotifications.ts

  audit/
    useAuditLog.ts
```

---

## Implementation Steps

### Step 1: Create subdirectories and move all 71 hook files
Each hook file is recreated in its new location with identical content.

### Step 2: Update all 728 import references across 118 consumer files
Every `from '@/hooks/useXxx'` becomes `from '@/hooks/domain/useXxx'`. This is a mechanical find-and-replace per hook file.

### Step 3: Delete the original flat files
After all imports are updated, the old files at the root of `src/hooks/` are removed.

### Step 4: Verify application loads
Browser test to confirm no broken imports.

---

## Technical Details

- **No logic changes** -- only file locations and import paths change
- **No barrel files** -- each consumer imports the hook directly from its subdirectory path
- **Cross-references between hooks** (e.g., `useCurrentEmployee` imports `useAuth`) will also be updated to use the new paths
- **Type-only imports** (e.g., `type { RiskTrendPoint } from '@/hooks/useOrgAnalytics'`) are updated identically
- The 3 files still importing `use-toast` and `use-mobile` with kebab-case will be updated to `@/hooks/ui/use-toast` and `@/hooks/ui/use-mobile`

## Estimated Scope
- 71 files moved
- ~118 consumer files updated
- 0 logic changes

