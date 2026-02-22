

# Thought Reframer -- UI Fixes, AI Rewrite & Voice Input

## Overview

Fix mislabeled button text, add an **AI-assisted reframe** feature (the AI suggests a reframed thought for the user), and add **voice-to-text** input on all textareas so users can speak instead of type.

---

## 1. UI Fixes -- Mislabeled Buttons

**Issue**: The "Continue" button on Step 1 shows an arrow character that isn't RTL-aware. The Step 2 back/forward buttons use raw arrow characters. The summary "Save & Start Over" label is unclear.

**Fixes**:
- Replace raw `→` and `←` arrow characters with Lucide `ArrowRight` / `ArrowLeft` icons wrapped in `rtl:-scale-x-100` for proper RTL flipping
- The Step 3 "See Summary" button label is fine but will get a `Sparkles` icon prefix
- The Summary "Save & Start Over" button will be relabeled to just "Save Reframe" for clarity (separate "Start Over" button already exists)
- Ensure all button labels use translation keys (some hardcoded `"..."` for loading state will use a proper spinner)

---

## 2. AI Reframe Suggestion

Add an "AI Suggest" button on Step 3 that sends the negative thought + challenge answers to Lovable AI and returns a suggested reframed thought.

### New Edge Function: `supabase/functions/suggest-reframe/index.ts`

- Accepts: `negative_thought`, `challenge_answers` (q1, q2, q3)
- Uses Lovable AI (`google/gemini-3-flash-preview`) with a CBT-specialist system prompt
- Returns a suggested `reframed_thought` string via tool calling
- Handles 429/402 errors properly

### Frontend Changes (in `ThoughtReframerPage.tsx`)

- On Step 3, add a button: "AI Suggest" with a `Sparkles` icon
- When clicked, calls the edge function via `supabase.functions.invoke('suggest-reframe', ...)`
- Shows a loading spinner while waiting
- Populates the reframed thought textarea with the AI suggestion
- User can edit the suggestion before proceeding
- Toast on error (rate limit, payment, etc.)

---

## 3. Voice-to-Text Input

Use the **Web Speech API** (`SpeechRecognition`) built into browsers -- no external API needed, completely free.

### New Hook: `src/hooks/useSpeechToText.ts`

- Wraps `window.SpeechRecognition` / `window.webkitSpeechRecognition`
- Returns `{ isListening, startListening, stopListening, transcript, isSupported }`
- Supports language parameter (uses current i18n language: 'en-US' or 'ar-SA')
- Appends recognized text to existing textarea content
- Auto-stops after silence

### Frontend Changes (in `ThoughtReframerPage.tsx`)

- Add a small microphone icon button (`Mic` from Lucide) next to each textarea
- When tapped, starts speech recognition and appends transcribed text to the field
- Icon turns red/pulsing while listening (`Mic` becomes `MicOff` to stop)
- Only shown if `isSupported` is true (graceful degradation for unsupported browsers)
- Works on all 5 textareas: negative thought (Step 1), q1/q2/q3 (Step 2), reframed thought (Step 3)

---

## Files Summary

| Action | File |
|---|---|
| New | `supabase/functions/suggest-reframe/index.ts` -- AI reframe suggestion edge function |
| New | `src/hooks/useSpeechToText.ts` -- Web Speech API wrapper hook |
| Modify | `supabase/config.toml` -- add `suggest-reframe` function config |
| Rewrite | `src/pages/mental-toolkit/ThoughtReframerPage.tsx` -- fix buttons, add AI suggest, add mic buttons |
| Modify | `src/locales/en.json` -- new keys for AI suggest and voice |
| Modify | `src/locales/ar.json` -- new keys for AI suggest and voice |

---

## New Localization Keys

Under `mentalToolkit.thoughtReframer`:
- `aiSuggest`: "AI Suggest"
- `aiSuggesting`: "Thinking..."
- `aiSuggestTooltip`: "Let AI suggest a reframed thought based on your answers"
- `aiSuggestError`: "Could not generate suggestion. Try again."
- `voiceInput`: "Voice input"
- `voiceListening`: "Listening..."
- `voiceNotSupported`: "Voice input not supported in this browser"
- `saveReframe`: "Save Reframe"

---

## Technical Notes

- **Web Speech API** is available in Chrome, Edge, Safari (mobile + desktop). Firefox has limited support. The hook checks `isSupported` and hides the mic button if unavailable.
- **AI Suggest** uses the same Lovable AI gateway pattern as `rewrite-question`, with tool calling for structured output.
- All new buttons use logical properties for RTL support.
- The edge function config entry uses `verify_jwt = false` matching the existing pattern.

