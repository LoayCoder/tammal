

## Replace Fingerprint (Profile) with Wellness Resources Page in Bottom Nav

### What Changes

The bottom navigation bar's **Fingerprint** icon currently links to `/settings/profile`. The user wants it to instead open a **Wellness Resources** page showing all mental toolkit tools as clean, premium cards.

### 1. Create New Page: `src/pages/WellnessResources.tsx`

A dedicated page displaying all 8 wellness toolkit items as a responsive card grid:

| Card | Icon | Route |
|------|------|-------|
| Mood Tracker | `Activity` | `/mental-toolkit/mood-tracker` |
| Thought Reframer | `Brain` | `/mental-toolkit/thought-reframer` |
| Breathing & Grounding | `Wind` | `/mental-toolkit/breathing` |
| Journaling | `BookOpen` | `/mental-toolkit/journaling` |
| Meditation Library | `Music` | `/mental-toolkit/meditation` |
| Habits Planner | `CheckSquare` | `/mental-toolkit/habits` |
| Articles | `BookMarked` | `/mental-toolkit/articles` |
| Self-Assessment | `ClipboardCheck` | `/mental-toolkit/assessment` |

- Cards use the same premium style as `MentalHealthResourcesHub` (rounded-2xl, border, hover effects)
- 2-column grid on mobile, clean spacing
- Each card navigates to its dedicated route
- Page has a `PageHeader` with a wellness-themed title

### 2. Register Route in `src/App.tsx`

Add `/wellness` route pointing to the new `WellnessResources` page, inside the authenticated layout.

### 3. Update Bottom Nav: `src/components/layout/MobileBottomNav.tsx`

- Change the `profile` nav item:
  - **Icon**: `Fingerprint` → `Heart` (or `Sparkles`) — a wellness-aligned icon
  - **Path**: `/settings/profile` → `/wellness`
  - **Key**: `profile` → `wellness-hub`

Profile remains accessible via the sidebar menu and the hamburger (Menu) button — no functionality is lost.

### Files Modified

| File | Change |
|------|--------|
| `src/pages/WellnessResources.tsx` | New page with wellness resource cards grid |
| `src/App.tsx` | Add `/wellness` route |
| `src/components/layout/MobileBottomNav.tsx` | Change fingerprint item to wellness hub |

