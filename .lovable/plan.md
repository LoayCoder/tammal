

# Enhanced Reference Frameworks UI

## Overview

Redesign the `FrameworkSelector` component from a compact collapsible list into a visually rich, card-grid-based interface with better visual hierarchy, richer framework cards, inline document management, and smoother interactions. The component stays within the AI Generator config panel but becomes more spacious, attractive, and easier to manage.

---

## Current Problems

1. **Cramped layout** -- frameworks are tiny rows with 10px text, hard to read and interact with
2. **Expand/collapse awkward** -- a small chevron button inside each row is easy to miss
3. **No visual distinction** -- all frameworks look the same regardless of selection state or type (default vs custom)
4. **Document management buried** -- documents only appear after expanding, with very small controls
5. **Edit/delete actions hidden** -- only visible after expanding, easy to overlook
6. **No empty state design** -- when there are no frameworks, the page just shows the "Add" button

---

## Proposed Design

### Framework Cards (replace flat list)

Each framework becomes a **visual card** with:
- Left accent border using the primary color when selected
- Icon displayed large (24px) with a soft colored background circle
- Name + description visible without expanding
- A "Selected" chip/badge when active
- Default badge for system frameworks
- Document count badge (e.g., "3 docs")
- Action buttons (Edit, Delete) as icon-only buttons in the card corner, visible on hover
- Click anywhere on the card to toggle selection

### Expanded State

Clicking the expand chevron (or a "Details" button) slides open a panel below the card showing:
- Full description text
- Document list with status badges (Extracted / Pending)
- Upload button for new documents
- Delete buttons per document

### Grid Layout

- On wider screens (sidebar is ~320px), cards stack vertically but with more breathing room
- Each card has `p-3` padding, `rounded-xl`, subtle shadow on hover
- Selected cards have a gradient left border and a soft background tint

### Empty State

When no frameworks exist, show a centered illustration area with:
- BookOpen icon (large, muted)
- "No frameworks yet" message
- "Add your first framework to guide AI question generation" subtitle
- Prominent "Add Framework" button

### Search/Filter (if > 5 frameworks)

A small search input that filters frameworks by name -- only shown when there are more than 5 frameworks.

### Select All / Deselect All

Quick action buttons in the header to select or deselect all frameworks at once.

---

## Technical Implementation

### File: `src/components/ai-generator/FrameworkSelector.tsx` (Major Rewrite)

- Replace the flat `button` rows with styled `Card`-like divs
- Add search state and filtering logic
- Add "Select All" / "Deselect All" buttons in header
- Improve expand/collapse with smooth animation (Collapsible per card)
- Add hover states for edit/delete actions
- Add empty state UI
- Use logical properties throughout (ms-/me-/ps-/pe-)
- Increase touch targets for better mobile usability

### File: `src/components/ai-generator/FrameworkDialog.tsx` (Minor Polish)

- Add subtle section dividers between EN and AR fields
- Add emoji picker preview (show the icon larger in a preview area)
- Improve file upload area with drag-and-drop visual zone
- Add accepted file types hint text

### File: `src/components/ai-generator/FrameworkDocuments.tsx` (Minor Polish)

- Slightly larger touch targets for delete buttons
- Add file size display for each document
- Improve status badge styling (green glow for extracted, amber pulse for pending)

### File: `src/locales/en.json` and `src/locales/ar.json`

New keys:
- `aiGenerator.noFrameworksYet` / `aiGenerator.noFrameworksDesc`
- `aiGenerator.selectAll` / `aiGenerator.deselectAll`
- `aiGenerator.searchFrameworks`
- `aiGenerator.docsCount` (e.g., "{{count}} docs")
- `aiGenerator.frameworkDetails`

---

## Files Summary

| Action | File |
|---|---|
| Rewrite | `src/components/ai-generator/FrameworkSelector.tsx` -- card-based layout, search, select all, empty state |
| Modify | `src/components/ai-generator/FrameworkDialog.tsx` -- polish sections, file upload zone |
| Modify | `src/components/ai-generator/FrameworkDocuments.tsx` -- improved badges, larger targets |
| Modify | `src/locales/en.json` -- new translation keys |
| Modify | `src/locales/ar.json` -- new translation keys |

---

## Design Tokens

- Card background: `bg-card` with `hover:shadow-md` transition
- Selected state: `bg-primary/5 border-s-3 border-s-primary`
- Icon circle: `w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center`
- Text sizes: Name `text-sm font-medium`, Description `text-xs text-muted-foreground`
- All spacing uses logical properties (ms-/me-/ps-/pe-)

