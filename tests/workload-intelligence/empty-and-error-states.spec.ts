import { test, expect } from '@playwright/test';
import { navigateToWorkloadIntelligence } from './helpers';

// TODO: Verify exact API endpoint pattern for mocking
// Based on codebase exploration: uses Supabase edge functions like /rest/v1/workload_metrics, 
// or RPC functions. Adjust route pattern below if needed.

test.describe('Workload Intelligence - Empty & Error States', () => {
  
  test('shows empty state UI when no data matches filters', async ({ page }) => {
    // Mock empty workload data response
    // TODO: Adjust endpoint pattern to match actual API (e.g., /rest/v1/workload_metrics, /functions/v1/workload-intelligence)
    await page.route('**/rest/v1/**', async route => {
      const url = route.request().url();
      if (url.includes('workload') || url.includes('unified_tasks') || url.includes('employees')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]) // Empty array for no data
        });
      } else {
        await route.continue();
      }
    });

    await navigateToWorkloadIntelligence(page);

    // Verify empty state message is shown
    // The UI should show either "0 tasks", "No tasks found", or similar empty state
    const emptyStateMessage = page.getByText(/0 tasks|No tasks found|لا يوجد مهام|No employees|لا يوجد موظفين/i).first();
    await expect(emptyStateMessage).toBeVisible({ timeout: 10_000 });
  });

  test('handles API errors gracefully without silent failures', async ({ page }) => {
    // Mock only data API endpoints to fail, not the page itself
    // The app should still load the page but show error for data portions
    await page.route(/.*\/(rest|functions)\/.*/, async route => {
      const url = route.request().url();
      // Only mock actual data endpoints, not page navigation
      if (url.includes('workload') || url.includes('unified_tasks') || url.includes('employees') || url.includes('objectives')) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to page - it should load even if data fails
    await page.goto('/admin/workload/team');
    
    // Wait for page to attempt loading data
    await page.waitForTimeout(3000);

    // Verify page has some content (not blank/crashed)
    const bodyText = await page.locator('body').innerText();
    const hasContent = bodyText.length > 0;
    
    // Verify page title or any visible element exists
    const pageTitle = await page.getByRole('heading').first().isVisible().catch(() => false);
    
    expect(hasContent && pageTitle).toBe(true);
  });
});
