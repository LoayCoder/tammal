

# Add Mental Health Resources Hub to Employee Dashboard

## What
Add a new **"Mental Health Resources"** section to the dashboard with 3 cards — Meditation Library, Psychoeducation Articles, and Islamic Calendar — that open as Dialog overlays (same pattern as the existing Mental Health Tools Hub).

## Placement
After the Mental Health Tools Hub dialogs (line ~257) and before the Personal Mood Dashboard (line ~259). This creates a logical flow: Tools → Resources → Analytics.

## Cards
| Resource | Icon | Dialog Key | Component |
|----------|------|------------|-----------|
| Meditation Library | `Music` | `meditation` | `MeditationLibraryTool` |
| Psychoeducation Articles | `BookMarked` | `articles` | `PsychoeducationArticles` |
| Islamic Calendar | `Calendar` | `calendar` | `IslamicCalendar` (full page component) |

## File Changes

### Edit: `src/pages/EmployeeHome.tsx`
1. Add imports: `Music`, `BookMarked`, `Calendar` from lucide-react
2. Add imports: `MeditationLibraryTool`, `PsychoeducationArticles`, `IslamicCalendar`
3. Extend existing `openTool` state to also handle `'meditation' | 'articles' | 'calendar'`
4. Add a new section with heading "Mental Health Resources" containing a 3-card grid (same glass-card style as Tools Hub)
5. Add 3 corresponding `<Dialog>` components rendering each resource component inside `max-w-2xl` scrollable dialogs

No new files needed. Single file edit following the exact same pattern already used for the 4 Mental Health Tools.

