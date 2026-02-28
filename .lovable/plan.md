

## PR-D: Remove Legacy Shim `src/lib/constants.ts`

### Overview
One remaining consumer (`useQuestionBatches.ts`) imports from the shim. We update that import, then delete the shim file.

### Steps

1. **Update import in `src/hooks/questions/useQuestionBatches.ts`** (line 39)
   - Change `import { MAX_BATCH_SIZE } from '@/lib/constants'` to `import { MAX_BATCH_SIZE } from '@/config/constants'`

2. **Delete `src/lib/constants.ts`**
   - The file is now a dead shim with zero consumers.

3. **Validate**
   - TypeScript build: clean
   - Test suite: 78/78 pass

### Risk Rating: Very Low
Purely mechanical import path change + dead file deletion. Zero logic or value changes.

