

# Make Reference Frameworks Selectable + Enhanced AI Rewrite

## Overview

Transform the currently read-only Reference Frameworks list into a multi-select system where selected frameworks directly influence question generation. Also enhance the AI Rewrite function to incorporate selected frameworks and uploaded document content.

## Changes

### 1. State Management (`AIQuestionGenerator.tsx`)

Add new state:
```typescript
const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
```

Pass `selectedFrameworks` and `setSelectedFrameworks` down through `ConfigPanel` to `KnowledgeBasePanel`. Also pass them to `handleRewritePrompt` and `handleGenerate`.

Update `handleGenerate` to include `selectedFrameworks` in the generate call.

Update `handleRewritePrompt` to send `selectedFrameworks` and active document content summaries to the `rewrite-prompt` edge function.

### 2. KnowledgeBasePanel UI (`KnowledgeBasePanel.tsx`)

**Framework Selection:**
- Replace the current read-only framework list with clickable, toggleable items
- Each framework gets a checkbox or a selected/unselected visual state (highlighted border + checkmark when selected)
- Show selected count in the collapsible trigger: "Reference Frameworks (3/6 selected)"
- Frameworks are always visible when Expert Knowledge is enabled (no need to expand collapsible to see them -- keep collapsible but default open when frameworks are selected)
- Selected frameworks get a primary-colored left border and subtle background highlight

**Props additions:**
```typescript
selectedFrameworks: string[];
onSelectedFrameworksChange: (frameworks: string[]) => void;
```

### 3. ConfigPanel Props (`ConfigPanel.tsx`)

Pass through the new `selectedFrameworks` and `onSelectedFrameworksChange` props to `KnowledgeBasePanel`.

### 4. GenerateInput Interface (`useEnhancedAIGeneration.ts`)

Add `selectedFrameworks?: string[]` to the `GenerateInput` interface.

### 5. Generate Edge Function (`generate-questions/index.ts`)

**Accept `selectedFrameworks` in request body.**

Instead of always injecting ALL 6 frameworks when expert knowledge is enabled, only inject the selected frameworks. If no frameworks are selected but expert knowledge is on, include all 6 as default.

Update the expert prompt section to dynamically build only from selected frameworks:
```
# Reference Frameworks (Knowledge Base):
${selectedFrameworks includes 'ISO45003' ? '1. **ISO 45003...**' : ''}
${selectedFrameworks includes 'UWES' ? '2. **UWES...**' : ''}
...
```

Framework keys mapping:
| UI Key | Framework ID |
|--------|-------------|
| `frameworkISO45003` | `ISO45003` |
| `frameworkISO10018` | `ISO10018` |
| `frameworkCOPSOQ` | `COPSOQ` |
| `frameworkUWES` | `UWES` |
| `frameworkWHO` | `WHO` |
| `frameworkGallup` | `Gallup` |

Also update the user prompt to emphasize: "Align questions with the following selected frameworks: [list]"

### 6. Rewrite Prompt Edge Function (`rewrite-prompt/index.ts`)

**Accept additional parameters:**
```typescript
{ prompt, useExpertKnowledge, selectedFrameworks, documentSummaries }
```

- `selectedFrameworks`: Array of framework IDs -- inject only these into the rewrite context
- `documentSummaries`: Short text summaries from active documents (sent from client, truncated to ~2000 chars total)

Update the system prompt to:
- Reference only the selected frameworks (not all 6)
- Include document context if provided
- Instruct the AI to align the rewritten prompt with the selected frameworks and document content

### 7. Localization Updates

**English (`en.json`):**
```json
"frameworksSelected": "{{count}} selected",
"selectFrameworks": "Select frameworks to guide question generation",
"allFrameworks": "All frameworks"
```

**Arabic (`ar.json`):** Matching Arabic translations.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/admin/AIQuestionGenerator.tsx` | Add `selectedFrameworks` state, pass to ConfigPanel, update handleGenerate and handleRewritePrompt |
| `src/components/ai-generator/ConfigPanel.tsx` | Pass through selectedFrameworks props |
| `src/components/ai-generator/KnowledgeBasePanel.tsx` | Make frameworks selectable with checkboxes, show selection state |
| `src/hooks/useEnhancedAIGeneration.ts` | Add `selectedFrameworks` to GenerateInput |
| `supabase/functions/generate-questions/index.ts` | Accept selectedFrameworks, conditionally build expert prompt |
| `supabase/functions/rewrite-prompt/index.ts` | Accept selectedFrameworks + documentSummaries, use in rewrite context |
| `src/locales/en.json` | Add framework selection keys |
| `src/locales/ar.json` | Add Arabic translations |

