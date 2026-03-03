

# Redesign Qur'an Surah Viewer — Flowing Text Layout

## Problem
Currently each ayah is inside its own `Card`, creating a cluttered, card-heavy layout that doesn't feel like reading a book.

## Design Approach
Replace the per-ayah cards with a **flowing paragraph** style — like a real Mushaf page:

### Arabic Text Section
- All verses flow as **inline text** in a single RTL paragraph, separated by verse-end markers (﴿١﴾ style ornamental numbers)
- Large, elegant Arabic font with generous `leading-[2.5]` line-height
- Centered on a clean, borderless surface with subtle top/bottom decorative dividers

### Translation Section
- Below the Arabic block, translations displayed as a **numbered list** (not cards) with soft separator lines between them
- Each translation prefixed with the verse number in a small circle
- Compact, readable `text-sm` styling

### Header
- Ornamental surah header: surah name in Arabic (large), English name + translation below, revelation type badge
- Decorative border/divider using a simple CSS ornament pattern

### Navigation
- Keep prev/next surah buttons and back button
- Keep bismillah display
- Keep scroll-to-top

## File Changes

### Edit: `src/pages/spiritual/QuranTextReader.tsx`
Rewrite the `SurahViewer` component's verse rendering section:

1. **Replace** the `<div className="space-y-3">` verses loop with:
   - A single `<div dir="rtl">` containing all Arabic text inline, each verse followed by `<span className="text-primary/60 text-lg mx-1">﴿{numberInSurah}﴾</span>`
   
2. **Add** a translation section below with a toggle (show/hide translations):
   - Simple divs with verse numbers, no cards
   
3. **Restyle** the surah header with a decorative centered layout

No new files needed. Single file edit.

