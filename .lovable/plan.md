

## Fix Top Header Icons to Match Bottom Nav's Lucide Minimal Style

The bottom navigation uses abstract, minimal icons (`Dot`, `Waves`, `Send`, `Fingerprint`, `Grip`). The top header icons (`Radio`, `Type`, `Contrast`) feel inconsistent — they are more literal/technical rather than abstract and minimal.

### Icon Mapping

| Component | Current Icon | New Icon | Rationale |
|-----------|-------------|----------|-----------|
| Notification Bell | `Radio` (broadcast) | `Rss` | Minimal signal/broadcast feel, cleaner geometry |
| Language Selector | `Type` (T letter) | `Languages` | Abstract, recognizable, cleaner than a literal "T" |
| Theme Toggle | `Contrast` (half circle) | `Eclipse` | Abstract celestial icon, minimal and premium |

All icons from `lucide-react`, no new dependencies.

### Files to Edit

1. **`src/components/notifications/UnifiedNotificationBell.tsx`** — Replace `Radio` import and usage with `Rss`
2. **`src/components/LanguageSelector.tsx`** — Replace `Type` with `Languages`
3. **`src/components/ThemeToggle.tsx`** — Replace `Contrast` with `Eclipse`

### Styling Consistency
- All top icons will use `h-5 w-5` (already consistent)
- No other changes needed — the swap alone aligns the visual language

