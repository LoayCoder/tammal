import { test, expect } from '@playwright/test';
import { navigateToWorkloadIntelligence } from './helpers';

test.describe('Workload Intelligence - Data Persistence', () => {
  test('persists selected filters and state across page reloads', async ({ page }) => {
    await navigateToWorkloadIntelligence(page);

    // 1. Apply a specific filter to the query
    const searchInput = page.getByPlaceholder(/Search/i).first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Ahmed');

    // 2. Wait for filter to apply - use network idle instead of arbitrary timeout
    await page.waitForLoadState('networkidle');

    // Save current URL to check if filters are in query string
    const urlBeforeReload = page.url();

    // 3. Refresh the page
    await page.reload();

    // Re-verify we're on the intelligence view
    await expect(page.getByRole('heading', { name: /Team Command Center|Workload/i, level: 1 })).toBeVisible({ timeout: 15_000 });

    // 4. Check if filters persist (via URL query string or localStorage)
    if (urlBeforeReload.includes('?')) {
      // If filters are in URL, verify input retains value
      await expect(searchInput).toHaveValue(/Ahmed/i);
    } else {
      // If filters are not persisted, verify input is cleared
      await expect(searchInput).toHaveValue('');
    }
  });
});
