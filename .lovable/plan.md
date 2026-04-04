

## Remove Crisis Support Contacts from /crisis-support

### What Changes

**`src/pages/crisis/CrisisRequestPage.tsx`**

- Remove lines 548-551: the `CrisisSupport` component rendering at the bottom of the page (the global emergency hotline directory section)
- Remove the import of `CrisisSupport` from line 18

This removes the hardcoded contact list (Emergency Services, Crisis Text Line, Samaritans, NAMI, etc.) that appears below the crisis request flow. The high-risk step still shows tenant-configured emergency contacts from the database, which is the correct behavior.

### Files Modified
| File | Change |
|------|--------|
| `src/pages/crisis/CrisisRequestPage.tsx` | Remove CrisisSupport import and rendering block |

