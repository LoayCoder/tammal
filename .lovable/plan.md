

# App Guidance / Onboarding Tour System

## Overview
Build a step-by-step guided tour that highlights key features of the app for new users, with the ability to restart it anytime from Settings.

## Architecture

### 1. Database: Track tour completion per user
**Migration:** Create `user_onboarding` table:
- `id` UUID PK
- `user_id` UUID (references auth.users, unique)
- `tour_completed` BOOLEAN DEFAULT false
- `completed_at` TIMESTAMPTZ NULL
- `tenant_id` UUID
- RLS: users can only read/update their own row
- Auto-create row via trigger on profile creation

### 2. New Component: `AppGuidedTour`
**File:** `src/components/onboarding/AppGuidedTour.tsx`
- Multi-step overlay tour using a custom spotlight/tooltip component (no external library)
- Steps highlight key areas: Dashboard, Wellness Toolkit, Workload, Recognition, Spiritual, Settings
- Each step shows: title, description, icon, step counter (e.g. 3/8)
- "Next", "Back", "Skip" buttons
- On completion or skip → marks `tour_completed = true` in DB
- Supports both Arabic and English with RTL-aware positioning

### 3. Tour Steps Definition
**File:** `src/components/onboarding/tourSteps.ts`
- Array of ~8 steps, each with:
  - `targetSelector` (CSS selector or route-based)
  - `title` / `description` (i18n keys)
  - `icon`
  - `placement` (top/bottom/start/end — logical, not left/right)
- Steps cover: Dashboard overview, Daily Check-in, Mental Toolkit, Workload & Tasks, Recognition & Awards, Spiritual Corner, Support, Profile & Settings

### 4. Hook: `useOnboardingTour`
**File:** `src/hooks/onboarding/useOnboardingTour.ts`
- Fetches `user_onboarding` row for current user
- Exposes: `showTour`, `completeTour`, `resetTour`, `isLoading`
- Auto-triggers tour if `tour_completed === false`

### 5. Integration Points

**MainLayout.tsx** — Mount `<AppGuidedTour />` so it overlays the entire app when active

**UserProfile.tsx** — Add a "Restart App Tour" button in the settings section (after Security Settings):
```
<Button onClick={resetTour}>
  <BookOpen /> Restart App Guide
</Button>
```

**AppSidebar.tsx** — Add a "App Guide" item under the Help menu group

### 6. Tour UI Design
- Semi-transparent dark backdrop with spotlight cutout on the target element
- Floating card with glassmorphic styling (matching the app's premium aesthetic)
- Progress dots at the bottom
- Smooth fade/slide transitions between steps
- Mobile-responsive (fullscreen card on small screens)

## Files to Create/Modify
1. **New migration** — `user_onboarding` table + RLS + trigger
2. **New:** `src/components/onboarding/AppGuidedTour.tsx` — Tour overlay component
3. **New:** `src/components/onboarding/tourSteps.ts` — Step definitions
4. **New:** `src/hooks/onboarding/useOnboardingTour.ts` — Tour state hook
5. **Edit:** `src/components/layout/MainLayout.tsx` — Mount tour component
6. **Edit:** `src/pages/settings/UserProfile.tsx` — Add "Restart Tour" button
7. **Edit:** `src/components/layout/AppSidebar.tsx` — Add "App Guide" to Help menu
8. **Edit:** i18n translation files for tour content (EN + AR)

