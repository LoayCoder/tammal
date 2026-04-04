

## Remaining Color Migration + Interactive Color Editor

### Remaining Unintegrated Colors (5 files)

| File | Hardcoded | Migration |
|---|---|---|
| `BatchStatusKPIs.tsx` | `bg-green-500/10 text-green-600`, `bg-orange-500/10 text-orange-600` | Use `--state-completed` and `--state-important` tokens |
| `CheckinSuccess.tsx` | `text-orange-500` (flame), `text-yellow-500` (star) | Use `--rank-bronze` and `--rank-gold` tokens |
| `DailyCheckin.tsx` | Same `text-orange-500`, `text-yellow-500` | Same tokens |
| `presets.ts` line 50 | `bg-green-500` (schedule active) | Use `--state-completed` |
| `moods.ts` + `MoodDefinitionDialog.tsx` | Mood color palette (~8 raw Tailwind colors) | **Documented exception** — user-selectable palette, must stay as raw classes |

### Interactive Color Editor Feature

Add an interactive color picker/editor to `/dev/design-system` so developers can live-preview and adjust all CSS variables directly from the page.

**How it works:**
1. Each color swatch becomes **clickable** — clicking opens an inline color picker (HTML `<input type="color">`)
2. Picking a new color updates the CSS variable on `document.documentElement` in real-time using `style.setProperty()`
3. All components on the page instantly reflect the change (live preview)
4. A **"Reset"** button per swatch restores the original value
5. A **"Copy CSS"** button generates the full `:root {}` block with current overrides for easy export
6. An **opacity/transparency slider** (0–100%) appears next to each color picker for controlling alpha

**UI Pattern:**
- Each `Swatch` component gets a click handler that toggles an inline editor panel below the swatch
- The editor panel shows: color picker input + opacity slider + hex/hsl readout + reset button
- A floating "Export Theme" button at the top generates a copyable CSS snippet of all modified variables

### Plan

**1. Migrate remaining 4 files** (moods stays as exception)
- `BatchStatusKPIs.tsx` — replace raw green/orange with state tokens
- `CheckinSuccess.tsx` — replace orange/yellow with rank tokens  
- `DailyCheckin.tsx` — same migration
- `presets.ts` line 50 — replace `bg-green-500` with state-completed token

**2. Create `EditableSwatch` component** (inside DesignSystemPage)
- Replaces current `Swatch` and `ToolkitSwatch`
- Props: `name`, `cssVar`, `defaultHsl`
- State: `isEditing`, `currentColor`, `opacity`
- On color change: `document.documentElement.style.setProperty('--{cssVar}', newHslValue)`
- On reset: `document.documentElement.style.removeProperty('--{cssVar}')`

**3. Add opacity/transparency slider**
- Range input 0–100% per token
- Updates the alpha channel in the CSS variable usage preview

**4. Add "Export Theme" floating button**
- Collects all overridden CSS variables
- Generates a copyable `:root { ... }` CSS block
- Uses a toast notification on copy

**5. Version bump to 1.5.0**

### Files Modified
1. `src/components/questions/BatchStatusKPIs.tsx` — migrate to state tokens
2. `src/components/checkin/CheckinSuccess.tsx` — migrate to rank tokens
3. `src/pages/employee/DailyCheckin.tsx` — migrate to rank tokens
4. `src/shared/status-badge/presets.ts` — migrate schedule active
5. `src/pages/dev/DesignSystemPage.tsx` — replace swatches with interactive `EditableSwatch`, add export button
6. `src/theme/version.ts` — bump to 1.5.0

