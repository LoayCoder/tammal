

## Fix Survey Card: Missing Translation, Minimal Design, Icon Consistency

### Issues Found

1. **`home.dueDate` translation key missing** — not in `en.json` or `ar.json`, so it renders the raw key
2. **Card is too heavy** — oversized icon container (h-14 w-14), large padding, complex gradient
3. **Icon style mismatch** — `ClipboardList` at h-7 w-7 with thick stroke doesn't match the page's thin outline standard (strokeWidth 1.5, h-5 w-5)

### Changes

**1. `src/locales/en.json`** — Add missing key:
```json
"dueDate": "Due: {{date}}"
```

**2. `src/locales/ar.json`** — Add missing key:
```json
"dueDate": "الموعد النهائي: {{date}}"
```

**3. `src/pages/EmployeeHome.tsx`** — Simplify the survey card:
- Shrink icon container from `h-14 w-14` → `h-10 w-10`, icon from `h-7 w-7` → `h-5 w-5`
- Add `strokeWidth={1.5}` to `ClipboardList` to match other page icons
- Reduce padding from `p-6` → `p-4`
- Keep the due date + urgency logic as-is (it works, just needed the translation key)

### Files Modified
| File | Change |
|------|--------|
| `src/locales/en.json` | Add `home.dueDate` translation |
| `src/locales/ar.json` | Add `home.dueDate` translation |
| `src/pages/EmployeeHome.tsx` | Reduce icon/padding size, match strokeWidth to page standard |

