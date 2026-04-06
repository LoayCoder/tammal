

## Integrate Wellness Copilot with Dynamic Tools, Resources & Support System

### Overview
Upgrade the Copilot edge function to dynamically fetch available wellness tools, first aiders, and emergency contacts, then inject that context into the AI prompt so recommendations reference real, current resources. Add a new `CopilotRecommendationsBlock` component to render actionable resource/support cards below the existing insight.

### Architecture

```text
Edge Function (wellness-copilot)
  ├─ Existing: mood data, tasks, workload aggregation
  └─ NEW: fetch available resources dynamically
       ├─ Wellness tools (from static registry — WellnessResources routes)
       ├─ First Aiders (mh_first_aiders — available ones)
       └─ Emergency contacts (mh_emergency_contacts)
  → Pass resource catalog to AI prompt
  → AI returns recommendations[] with resource references
  → Frontend renders actionable cards

WellnessCopilotCard
  ├─ CopilotInsightBlock (existing)
  ├─ CopilotRecommendationsBlock ← NEW
  │    ├─ Practice cards (breathing, meditation, etc.)
  │    ├─ Resource cards (articles, assessment)
  │    └─ Support cards (first aider, crisis)
  ├─ CopilotActionBlock (existing)
  └─ CopilotReasoningBlock (existing)
```

### 1. Edge Function Enhancement (`supabase/functions/wellness-copilot/index.ts`)

**Add dynamic resource fetching** after data aggregation:
- Query `mh_first_aiders` for available first aiders (count, names, languages, specializations) — tenant-scoped
- Query `mh_emergency_contacts` for crisis contacts — tenant-scoped
- Build a `availableResources` catalog object containing:
  - `wellnessTools`: static list of available tools with routes (mood tracker, breathing, thought reframer, journaling, meditation, habits, articles, assessment)
  - `firstAiders`: `{ count, available: boolean, specializations: string[] }`
  - `emergencyContacts`: `{ count, available: boolean }`
  - `supportRoutes`: `/crisis-support`, `/wellness`

**Expand AI tool-calling schema** to include a `recommendations` array:
```typescript
recommendations: {
  type: "array",
  items: {
    type: "object",
    properties: {
      type: { enum: ["practice", "resource", "support"] },
      key: { type: "string" }, // e.g. "breathing", "first_aider", "articles"
      title: { type: "string" },
      description: { type: "string" },
      route: { type: "string" } // app route to navigate to
    }
  },
  description: "2-4 contextual recommendations from available tools/resources/support"
}
```

**Update system prompt** to include the available resources catalog and instruct the AI to:
- Only recommend resources that actually exist in the catalog
- Match recommendations to the user's current state (mood, workload, urgency)
- Include at least one support recommendation when urgency is "attention" or "urgent"
- Always include a practice recommendation

### 2. Update Types (`useCopilotInsight.ts`)

Add to `CopilotInsight` interface:
```typescript
recommendations?: {
  type: 'practice' | 'resource' | 'support';
  key: string;
  title: string;
  description: string;
  route: string;
}[];
```

### 3. New Component: `CopilotRecommendationsBlock.tsx`

- Renders 2-4 recommendation cards in a compact grid
- Each card: icon (mapped from `key`), title, short description, actionable button ("Start", "View", "Contact")
- Card styles differ by type:
  - **Practice**: soft green/teal accent, "Start Practice" button
  - **Resource**: soft blue accent, "View Resource" button
  - **Support**: soft amber/red accent, "Contact Support" button
- Uses `<Link>` for navigation to the resource route
- Premium VIP styling: `rounded-xl`, `hover:-translate-y-0.5`, subtle border

### 4. Update `WellnessCopilotCard.tsx`

Insert `<CopilotRecommendationsBlock>` between `CopilotInsightBlock` and `CopilotActionBlock` when `insight.recommendations` exists.

### 5. Icon Mapping Utility

Create a `copilotResourceIcons` map to resolve `key` → Lucide icon:
- `breathing` → Wind, `mood_tracker` → Activity, `thought_reframer` → Brain
- `journaling` → BookOpen, `meditation` → Music, `articles` → BookMarked
- `first_aider` → HeartHandshake, `crisis_support` → Phone, `assessment` → ClipboardCheck

### Files to Create
1. `src/features/wellness-copilot/components/CopilotRecommendationsBlock.tsx`

### Files to Modify
1. `supabase/functions/wellness-copilot/index.ts` — add resource fetching + expanded AI schema
2. `src/features/wellness-copilot/hooks/useCopilotInsight.ts` — add `recommendations` to type
3. `src/features/wellness-copilot/components/WellnessCopilotCard.tsx` — render recommendations block

### Key Design Decisions
- **No new DB tables needed** — resources are derived from existing tables + static route registry
- **AI auto-discovery**: The AI receives the full catalog each time; any new tool added to the registry is immediately available
- **Cache-safe**: Recommendations are part of the cached `copilot_insight_cache`, refreshed daily
- **Urgency-driven**: Support recommendations are prioritized when urgency is "attention" or "urgent"

