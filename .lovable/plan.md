

# Mental Health Tools — Open as Dialog Overlays on Dashboard

## Approach
Replace the `Link` navigation on the 4 Mental Health Tools cards in `EmployeeHome` with **Dialog modals**. Clicking a card opens a full-width dialog overlay with the tool's content component rendered inside, while the dashboard stays visible in the background.

## Design
- Each card becomes a `Dialog` trigger instead of a `Link`
- The dialog uses `max-w-2xl` with scrollable content (`max-h-[80vh] overflow-y-auto`)
- Each dialog renders the same inner component used by the standalone pages: `BreathingGroundingTool` (simplified setup), `JournalingPromptsTool`, `HabitsPlanner`, `SelfAssessmentQuiz`
- Dialog header shows the tool icon + title
- **Note on Breathing:** The full `BreathingPage` has complex state (setup/active/complete + session history). For the dialog, we'll embed the full page component content directly to keep full functionality.

## File Changes

### Edit: `src/pages/EmployeeHome.tsx`
1. Add `useState` import, add `Dialog, DialogContent, DialogHeader, DialogTitle` imports
2. Add state: `const [openTool, setOpenTool] = useState<string | null>(null)`
3. Replace the 4 `<Link>` wrappers with `<div onClick={() => setOpenTool('breathing'|'journaling'|'habits'|'assessment')}>` triggers
4. Add 4 `<Dialog>` components below the grid, each rendering the corresponding tool component:
   - `breathing` → `BreathingGroundingTool` (the standalone component)
   - `journaling` → `JournalingPromptsTool`
   - `habits` → `HabitsPlanner`
   - `assessment` → `SelfAssessmentQuiz`
5. Import the 4 tool components

### Components to import
- `BreathingGroundingTool` from `@/components/mental-toolkit/tools/BreathingGroundingTool`
- `JournalingPromptsTool` from `@/components/mental-toolkit/practices/JournalingPromptsTool`
- `HabitsPlanner` from `@/components/mental-toolkit/practices/HabitsPlanner`
- `SelfAssessmentQuiz` from `@/components/mental-toolkit/resources/SelfAssessmentQuiz`

