import { test, expect } from '@playwright/test';
import { navigateToWorkloadIntelligence } from './helpers';

test.describe('Workload Intelligence - Page Load', () => {
  // Use global authenticated state
  test.beforeEach(async ({ page }) => {
    await navigateToWorkloadIntelligence(page);
  });

  test('verifies page heading, cards, and tables render without errors', async ({ page }) => {
    // 1. Verify Page Heading
    const heading = page.getByRole('heading', { name: /Team Command Center|Workload/i, level: 1 });
    await expect(heading).toBeVisible();

    // 2. Verify Main KPI Summary Cards are visible
    // Based on actual UI strings
    await expect(page.getByText(/Team Size/i).first()).toBeVisible();
    await expect(page.getByText(/At Risk/i).first()).toBeVisible();

    // 3. Verify Charts render
    // Generally standard canvases or svg elements
    // The previous test checks for text "Workload Distribution" which exists on chart wrappers
    await expect(page.getByText(/Workload Distribution|توزيع عبء العمل/i)).toBeVisible();

    // 4. Verify Data filter/tables are visible
    const searchInput = page.getByPlaceholder(/Search/i).first();
    await expect(searchInput).toBeVisible();

    // 5. Ensure no crash or empty error state by checking the absence of an error alert
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).not.toBeVisible();
  });
});
