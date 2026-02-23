
# Remove "Enable AI Generation" Toggle from Schedule Management

## What Changes
Remove the non-functional "Enable AI Generation" toggle from the schedule creation/editing form to avoid user confusion, since the backend does not act on this flag.

## Technical Details

### File: `src/pages/admin/ScheduleManagement.tsx`

1. **Remove the UI toggle** (lines 1035-1038): Delete the `div` containing the "Enable AI Generation" label and switch.

2. **Remove state variable** (line 102): Remove `const [enableAI, setEnableAI] = useState(false);`

3. **Remove state reset** (line 188): Remove `setEnableAI(false);` from the reset function.

4. **Remove state load** (line 209): Remove `setEnableAI(schedule.enable_ai_generation);` from the edit handler.

5. **Hardcode the value in save** (line 256): Change `enable_ai_generation: enableAI` to `enable_ai_generation: false` so the database column stays consistent.

No database changes needed -- the column remains for future use when the feature is implemented.
