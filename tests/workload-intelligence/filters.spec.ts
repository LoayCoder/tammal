import { test, expect } from '@playwright/test';
import { navigateToWorkloadIntelligence } from './helpers';

test.describe('Workload Intelligence - Filters', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToWorkloadIntelligence(page);
  });

  test('applies filters and verifies result updates', async ({ page }) => {
    // 1. Apply a text search filter
    const searchInput = page.getByPlaceholder(/Search/i).first();
    await expect(searchInput).toBeVisible();

    // 2. Search for a non-existent employee to see it empty out
    await searchInput.fill('NonExistentEmployee_XYZ');

    // 3. Verify filtered results dynamically update (badge updates to 0 tasks)
    await expect(page.getByText(/0 tasks/i).first()).toBeVisible({ timeout: 10_000 });
    
    // Ensure loading spinner is hidden after fetch
    await expect(page.locator('[data-testid="loading-spinner"]')).toHaveCount(0);
  });

  test('clears filters and restores results', async ({ page }) => {
    // Apply a filter first
    const searchInput = page.getByPlaceholder(/Search/i).first();
    await searchInput.fill('NonExistentEmployee_XYZ');
    await expect(page.getByText(/0 tasks/i).first()).toBeVisible({ timeout: 10_000 });

    // 1. Clear text filter
    await searchInput.clear();

    // 2. Verify filter chip/empty state is gone
    await expect(page.getByText(/0 tasks/i)).not.toBeVisible();
    await expect(page.getByText(/No tasks found|لا يوجد مهام/i)).not.toBeVisible();
  });
});
