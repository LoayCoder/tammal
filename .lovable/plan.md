

# Click-to-View Full Question Detail Dialog

## Overview
Add a detail dialog that opens when clicking on a question row in the table, showing the full English and Arabic text along with all question metadata.

## What Will Change

### QuestionTable.tsx
- Add a `viewQuestion` state (`Question | null`) to track which question detail dialog is open
- Make the question text cells clickable (cursor-pointer, hover highlight) so clicking opens the detail dialog
- Add a new `Dialog` at the bottom of the component that displays:
  - Full English question text (no truncation)
  - Full Arabic question text (RTL, no truncation)
  - Category badge
  - Question type
  - Status (active/inactive)
  - Global badge if applicable
  - Options list (for multiple choice questions)
- Add a "View" option in the row's action dropdown menu as well

### Localization (en.json + ar.json)
- Add keys: `questions.viewQuestion` ("View Question" / "عرض السؤال"), `questions.questionDetails` ("Question Details" / "تفاصيل السؤال")

## Technical Details

### New State
```typescript
const [viewQuestion, setViewQuestion] = useState<Question | null>(null);
```

### Clickable Row Cells
The EN and AR text cells will get `onClick={() => setViewQuestion(question)}` with `cursor-pointer` styling.

### Detail Dialog Layout
```
+----------------------------------+
| Question Details            [X]  |
+----------------------------------+
| Question (EN):                   |
| [Full English text, unwrapped]   |
|                                  |
| Question (AR):              RTL  |
| [Full Arabic text, unwrapped]    |
|                                  |
| Category: [Badge]  Type: [Badge] |
| Status: [Active]  Global: [Yes]  |
|                                  |
| Options (if multiple choice):    |
|  1. Option A                     |
|  2. Option B                     |
+----------------------------------+
|                    [Edit] [Close] |
+----------------------------------+
```

### Files Modified
- `src/components/questions/QuestionTable.tsx`
- `src/locales/en.json`
- `src/locales/ar.json`
