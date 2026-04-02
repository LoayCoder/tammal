import { test, expect } from '@playwright/test';
import { navigateToWorkloadIntelligence } from './helpers';

// TODO: Verify exact filter UI elements:
// - Filter dropdowns/labels (Team, Department, Employee, Date Range, Workload Level)
// - Filter chip/clear button selectors
// - URL query string pattern for filter state

test.describe('Workload Intelligence - Filters', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToWorkloadIntelligence(page);
  });

  test('applies filters and verifies result updates', async ({ page }) => {
    // 1. Apply a text search filter
    const searchInput = page.getByPlaceholder(/Search|بحث/i).first();
    await expect(searchInput).toBeVisible();

    // 2. Search for a non-existent employee to verify empty state
    await searchInput.fill('NonExistentEmployee_XYZ');

    // 3. Wait for filter to apply via network idle
    await page.waitForLoadState('networkidle');

    // 4. Verify filtered results show 0 tasks
    const noResultsMessage = page.getByText(/0 tasks|No tasks found|لا يوجد مهام/i).first();
    await expect(noResultsMessage).toBeVisible({ timeout: 10_000 });
    
    // 5. Verify no loading spinner is present
    await expect(page.locator('[data-testid="loading-spinner"]')).toHaveCount(0);
  });

  test('clears filters and restores results', async ({ page }) => {
    // 1. Apply a filter first
    const searchInput = page.getByPlaceholder(/Search|بحث/i).first();
    await searchInput.fill('NonExistentEmployee_XYZ');
    
    // Wait for filter to apply
    await page.waitForLoadState('networkidle');
    
    // Verify filter was applied (0 results shown)
    await expect(page.getByText(/0 tasks|No tasks found/i).first()).toBeVisible({ timeout: 10_000 });

    // 2. Clear the filter by clearing input
    await searchInput.clear();
    
    // 3. Wait for clear to apply
    await page.waitForLoadState('networkidle');

    // 4. Verify filter is cleared - results should show again
    // Either show employee data or at least the search input is empty
    await expect(searchInput).toHaveValue('');
    
    // The "0 tasks" or "No tasks found" message should no longer be visible
    await expect(page.getByText(/0 tasks|No tasks found/i)).not.toBeVisible();
  });
});
